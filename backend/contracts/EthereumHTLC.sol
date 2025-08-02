// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EthereumHTLC
 * @dev Hash Time Locked Contract for atomic swaps between Ethereum and Stellar
 *
 * This contract enables trustless cross-chain swaps by:
 * 1. Locking funds with a cryptographic hash (commit phase)
 * 2. Unlocking funds when the correct preimage is revealed (reveal phase)
 * 3. Refunding funds after timeout if swap fails (refund phase)
 *
 * Used for Stellar-Ethereum bridge in ETHGlobal Unite hackathon
 */
contract EthereumHTLC is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    // ============ STRUCTURES ============

    struct SwapContract {
        address initiator; // Who created the swap
        address participant; // Who will receive the funds
        IERC20 token; // Token being swapped (address(0) for ETH)
        uint256 amount; // Amount locked in the contract
        bytes32 hashlock; // Hash of the secret
        uint256 timelock; // Unix timestamp when refund becomes available
        bool withdrawn; // True if funds have been withdrawn
        bool refunded; // True if funds have been refunded
        string stellarAddress; // Stellar destination address (for tracking)
        uint256 createdAt; // When the contract was created
    }

    // ============ STATE VARIABLES ============

    mapping(bytes32 => SwapContract) public contracts;
    mapping(address => uint256) public swapCounts; // Track swaps per user

    uint256 public totalSwaps;
    uint256 public totalVolume; // Total volume in ETH equivalent
    uint256 public constant MIN_TIMELOCK = 1 hours; // Minimum timelock duration
    uint256 public constant MAX_TIMELOCK = 48 hours; // Maximum timelock duration
    uint256 public constant FEE_BASIS_POINTS = 10; // 0.1% fee
    uint256 public constant BASIS_POINTS = 10000;

    address public feeRecipient; // Where fees are sent
    bool public emergencyStop; // Emergency stop mechanism

    // ============ EVENTS ============

    event HTLCNew(
        bytes32 indexed contractId,
        address indexed initiator,
        address indexed participant,
        address token,
        uint256 amount,
        bytes32 hashlock,
        uint256 timelock,
        string stellarAddress
    );

    event HTLCWithdraw(
        bytes32 indexed contractId,
        address indexed withdrawer,
        bytes32 preimage
    );

    event HTLCRefund(bytes32 indexed contractId, address indexed refunder);

    event FeeCollected(
        address indexed token,
        uint256 amount,
        address feeRecipient
    );

    // ============ MODIFIERS ============

    modifier contractExists(bytes32 _contractId) {
        require(
            contracts[_contractId].initiator != address(0),
            "Contract does not exist"
        );
        _;
    }

    modifier withdrawable(bytes32 _contractId) {
        require(
            contracts[_contractId].participant == msg.sender,
            "Not the participant"
        );
        require(!contracts[_contractId].withdrawn, "Already withdrawn");
        require(!contracts[_contractId].refunded, "Already refunded");
        require(
            block.timestamp <= contracts[_contractId].timelock,
            "Timelock expired"
        );
        _;
    }

    modifier refundable(bytes32 _contractId) {
        require(
            contracts[_contractId].initiator == msg.sender,
            "Not the initiator"
        );
        require(!contracts[_contractId].withdrawn, "Already withdrawn");
        require(!contracts[_contractId].refunded, "Already refunded");
        require(
            block.timestamp > contracts[_contractId].timelock,
            "Timelock not expired"
        );
        _;
    }

    modifier notEmergencyStopped() {
        require(!emergencyStop, "Contract is emergency stopped");
        _;
    }

    // ============ CONSTRUCTOR ============

    constructor(address _feeRecipient) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }

    // ============ MAIN FUNCTIONS ============

    /**
     * @dev Create a new HTLC for ERC20 tokens
     * @param _contractId Unique identifier for this swap
     * @param _participant Address that can withdraw the funds
     * @param _token ERC20 token contract address
     * @param _amount Amount of tokens to lock
     * @param _hashlock Hash of the secret (keccak256)
     * @param _timelock Unix timestamp when refund becomes available
     * @param _stellarAddress Stellar address for cross-chain tracking
     */
    function newContract(
        bytes32 _contractId,
        address _participant,
        address _token,
        uint256 _amount,
        bytes32 _hashlock,
        uint256 _timelock,
        string calldata _stellarAddress
    ) external nonReentrant whenNotPaused notEmergencyStopped {
        require(_participant != address(0), "Invalid participant");
        require(_participant != msg.sender, "Cannot be same as initiator");
        require(_token != address(0), "Invalid token address");
        require(_amount > 0, "Amount must be > 0");
        require(_hashlock != bytes32(0), "Invalid hashlock");
        require(
            contracts[_contractId].initiator == address(0),
            "Contract already exists"
        );
        require(
            _timelock > block.timestamp + MIN_TIMELOCK &&
                _timelock < block.timestamp + MAX_TIMELOCK,
            "Invalid timelock"
        );
        require(bytes(_stellarAddress).length > 0, "Stellar address required");

        // Calculate fee
        uint256 fee = (_amount * FEE_BASIS_POINTS) / BASIS_POINTS;
        uint256 amountAfterFee = _amount - fee;

        // Transfer tokens from initiator
        IERC20 token = IERC20(_token);
        token.safeTransferFrom(msg.sender, address(this), _amount);

        // Send fee to fee recipient
        if (fee > 0) {
            token.safeTransfer(feeRecipient, fee);
            emit FeeCollected(_token, fee, feeRecipient);
        }

        // Create the contract
        contracts[_contractId] = SwapContract({
            initiator: msg.sender,
            participant: _participant,
            token: token,
            amount: amountAfterFee,
            hashlock: _hashlock,
            timelock: _timelock,
            withdrawn: false,
            refunded: false,
            stellarAddress: _stellarAddress,
            createdAt: block.timestamp
        });

        // Update statistics
        swapCounts[msg.sender]++;
        totalSwaps++;
        // Note: Volume tracking would need price oracle for accurate ETH equivalent

        emit HTLCNew(
            _contractId,
            msg.sender,
            _participant,
            _token,
            amountAfterFee,
            _hashlock,
            _timelock,
            _stellarAddress
        );
    }

    /**
     * @dev Create a new HTLC for ETH
     * @param _contractId Unique identifier for this swap
     * @param _participant Address that can withdraw the funds
     * @param _hashlock Hash of the secret (keccak256)
     * @param _timelock Unix timestamp when refund becomes available
     * @param _stellarAddress Stellar address for cross-chain tracking
     */
    function newContractETH(
        bytes32 _contractId,
        address _participant,
        bytes32 _hashlock,
        uint256 _timelock,
        string calldata _stellarAddress
    ) external payable nonReentrant whenNotPaused notEmergencyStopped {
        require(_participant != address(0), "Invalid participant");
        require(_participant != msg.sender, "Cannot be same as initiator");
        require(msg.value > 0, "Amount must be > 0");
        require(_hashlock != bytes32(0), "Invalid hashlock");
        require(
            contracts[_contractId].initiator == address(0),
            "Contract already exists"
        );
        require(
            _timelock > block.timestamp + MIN_TIMELOCK &&
                _timelock < block.timestamp + MAX_TIMELOCK,
            "Invalid timelock"
        );
        require(bytes(_stellarAddress).length > 0, "Stellar address required");

        // Calculate fee
        uint256 fee = (msg.value * FEE_BASIS_POINTS) / BASIS_POINTS;
        uint256 amountAfterFee = msg.value - fee;

        // Send fee to fee recipient
        if (fee > 0) {
            (bool success, ) = feeRecipient.call{value: fee}("");
            require(success, "Fee transfer failed");
            emit FeeCollected(address(0), fee, feeRecipient);
        }

        // Create the contract (use address(0) for ETH)
        contracts[_contractId] = SwapContract({
            initiator: msg.sender,
            participant: _participant,
            token: IERC20(address(0)),
            amount: amountAfterFee,
            hashlock: _hashlock,
            timelock: _timelock,
            withdrawn: false,
            refunded: false,
            stellarAddress: _stellarAddress,
            createdAt: block.timestamp
        });

        // Update statistics
        swapCounts[msg.sender]++;
        totalSwaps++;
        totalVolume += amountAfterFee;

        emit HTLCNew(
            _contractId,
            msg.sender,
            _participant,
            address(0),
            amountAfterFee,
            _hashlock,
            _timelock,
            _stellarAddress
        );
    }

    /**
     * @dev Withdraw funds by revealing the preimage
     * @param _contractId The contract identifier
     * @param _preimage The secret that hashes to the hashlock
     */
    function withdraw(
        bytes32 _contractId,
        bytes32 _preimage
    )
        external
        contractExists(_contractId)
        withdrawable(_contractId)
        nonReentrant
    {
        SwapContract storage c = contracts[_contractId];

        // Verify the preimage
        require(
            keccak256(abi.encodePacked(_preimage)) == c.hashlock,
            "Invalid preimage"
        );

        c.withdrawn = true;

        // Transfer the funds
        if (address(c.token) == address(0)) {
            // Transfer ETH
            (bool success, ) = c.participant.call{value: c.amount}("");
            require(success, "ETH transfer failed");
        } else {
            // Transfer ERC20 tokens
            c.token.safeTransfer(c.participant, c.amount);
        }

        emit HTLCWithdraw(_contractId, msg.sender, _preimage);
    }

    /**
     * @dev Refund funds after timelock expires
     * @param _contractId The contract identifier
     */
    function refund(
        bytes32 _contractId
    )
        external
        contractExists(_contractId)
        refundable(_contractId)
        nonReentrant
    {
        SwapContract storage c = contracts[_contractId];

        c.refunded = true;

        // Transfer the funds back to initiator
        if (address(c.token) == address(0)) {
            // Transfer ETH
            (bool success, ) = c.initiator.call{value: c.amount}("");
            require(success, "ETH transfer failed");
        } else {
            // Transfer ERC20 tokens
            c.token.safeTransfer(c.initiator, c.amount);
        }

        emit HTLCRefund(_contractId, msg.sender);
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Get contract details
     */
    function getContract(
        bytes32 _contractId
    ) external view returns (SwapContract memory) {
        return contracts[_contractId];
    }

    /**
     * @dev Check if contract exists
     */
    function isContractExists(
        bytes32 _contractId
    ) external view returns (bool) {
        return contracts[_contractId].initiator != address(0);
    }

    /**
     * @dev Check if withdrawal is possible
     */
    function isWithdrawable(
        bytes32 _contractId,
        address _participant
    ) external view returns (bool) {
        SwapContract memory c = contracts[_contractId];
        return (c.initiator != address(0) &&
            c.participant == _participant &&
            !c.withdrawn &&
            !c.refunded &&
            block.timestamp <= c.timelock);
    }

    /**
     * @dev Check if refund is possible
     */
    function isRefundable(
        bytes32 _contractId,
        address _initiator
    ) external view returns (bool) {
        SwapContract memory c = contracts[_contractId];
        return (c.initiator == _initiator &&
            !c.withdrawn &&
            !c.refunded &&
            block.timestamp > c.timelock);
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @dev Update fee recipient (only owner)
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Emergency stop mechanism (only owner)
     */
    function setEmergencyStop(bool _stop) external onlyOwner {
        emergencyStop = _stop;
    }

    /**
     * @dev Pause contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ UTILITY FUNCTIONS ============

    /**
     * @dev Generate a contract ID from parameters
     */
    function generateContractId(
        address _initiator,
        address _participant,
        uint256 _amount,
        bytes32 _hashlock,
        uint256 _timelock
    ) external pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    _initiator,
                    _participant,
                    _amount,
                    _hashlock,
                    _timelock
                )
            );
    }

    // ============ RECEIVE FUNCTION ============

    receive() external payable {
        revert("Use newContractETH function");
    }
}
