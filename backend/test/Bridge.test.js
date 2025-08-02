const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Stellar-Ethereum Bridge', function () {
  let mockUSDC, mockWETH, htlc, bridgeController;
  let owner, user1, user2, bridgeBot;

  beforeEach(async function () {
    [owner, user1, user2, bridgeBot] = await ethers.getSigners();

    // Deploy mock tokens
    const MockUSDC = await ethers.getContractFactory('MockUSDC');
    mockUSDC = await MockUSDC.deploy();

    const MockWETH = await ethers.getContractFactory('MockWETH');
    mockWETH = await MockWETH.deploy();

    // Deploy HTLC contract
    const EthereumHTLC = await ethers.getContractFactory('EthereumHTLC');
    htlc = await EthereumHTLC.deploy(owner.address);

    // Deploy Bridge Controller
    const BridgeController = await ethers.getContractFactory(
      'BridgeController'
    );
    bridgeController = await BridgeController.deploy(
      await htlc.getAddress(),
      await mockUSDC.getAddress(), // Mock 1inch router
      bridgeBot.address
    );

    // Configure bridge
    await bridgeController.addSupportedToken(await mockUSDC.getAddress());
    await bridgeController.addSupportedToken(await mockWETH.getAddress());

    // Give users some tokens
    await mockUSDC.transfer(user1.address, ethers.parseUnits('1000', 6)); // 1000 USDC
    await mockWETH.transfer(user1.address, ethers.parseEther('10')); // 10 WETH
  });

  describe('Mock Token Tests', function () {
    it('Should mint tokens correctly', async function () {
      const usdcBalance = await mockUSDC.balanceOf(user1.address);
      const wethBalance = await mockWETH.balanceOf(user1.address);

      expect(usdcBalance).to.equal(ethers.parseUnits('1000', 6));
      expect(wethBalance).to.equal(ethers.parseEther('10'));
    });

    it('Should allow faucet minting', async function () {
      await mockUSDC.connect(user2).faucet();
      const balance = await mockUSDC.balanceOf(user2.address);
      expect(balance).to.equal(ethers.parseUnits('10000', 6));
    });
  });

  describe('HTLC Contract Tests', function () {
    it('Should create ETH HTLC correctly', async function () {
      const amount = ethers.parseEther('1');
      const hashlock = ethers.keccak256(ethers.toUtf8Bytes('secret123'));
      const timelock = Math.floor(Date.now() / 1000) + 7200; // 2 hours (must be > MIN_TIMELOCK)

      const contractId = await htlc.generateContractId(
        user1.address,
        user2.address,
        amount,
        hashlock,
        timelock
      );

      await expect(
        htlc
          .connect(user1)
          .newContractETH(
            contractId,
            user2.address,
            hashlock,
            timelock,
            'GABC123STELLAR456ADDRESS789',
            { value: amount }
          )
      ).to.emit(htlc, 'HTLCNew');

      const contract = await htlc.getContract(contractId);
      expect(contract.initiator).to.equal(user1.address);
      expect(contract.participant).to.equal(user2.address);
    });

    it('Should allow withdrawal with correct preimage', async function () {
      const secret = 'secret123';
      const preimage = ethers.keccak256(ethers.toUtf8Bytes(secret));
      const hashlock = ethers.keccak256(ethers.concat([preimage]));
      const amount = ethers.parseEther('1');
      const timelock = Math.floor(Date.now() / 1000) + 7200; // 2 hours

      const contractId = await htlc.generateContractId(
        user1.address,
        user2.address,
        amount,
        hashlock,
        timelock
      );

      // Create HTLC
      await htlc
        .connect(user1)
        .newContractETH(
          contractId,
          user2.address,
          hashlock,
          timelock,
          'GABC123STELLAR456ADDRESS789',
          { value: amount }
        );

      // Withdraw with preimage
      const balanceBefore = await ethers.provider.getBalance(user2.address);
      await expect(htlc.connect(user2).withdraw(contractId, preimage)).to.emit(
        htlc,
        'HTLCWithdraw'
      );

      const balanceAfter = await ethers.provider.getBalance(user2.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });

  describe('Bridge Controller Tests', function () {
    it('Should deploy with correct configuration', async function () {
      expect(await bridgeController.owner()).to.equal(owner.address);
      expect(await bridgeController.stellarBridgeBot()).to.equal(
        bridgeBot.address
      );
      expect(
        await bridgeController.supportedTokens(await mockUSDC.getAddress())
      ).to.be.true;
    });

    it('Should reject unsupported tokens', async function () {
      const UnsupportedToken = await ethers.getContractFactory('MockUSDC');
      const unsupportedToken = await UnsupportedToken.deploy();

      await expect(
        bridgeController
          .connect(user1)
          .initiateBridgeSwap(
            await unsupportedToken.getAddress(),
            await mockUSDC.getAddress(),
            ethers.parseUnits('100', 6),
            ethers.parseUnits('95', 6),
            'GABC123STELLAR456ADDRESS789',
            '0x'
          )
      ).to.be.revertedWith('Token not supported');
    });
  });

  describe('Integration Tests', function () {
    it('Should get bridge statistics', async function () {
      const stats = await bridgeController.getBridgeStats();
      expect(stats.totalSwaps).to.equal(0);
      expect(stats.totalVolume).to.equal(0);
    });

    it('Should track user swaps', async function () {
      const userSwaps = await bridgeController.getUserSwaps(user1.address);
      expect(userSwaps.length).to.equal(0);
    });
  });
});
