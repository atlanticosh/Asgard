const { ethers } = require('hardhat');

async function testExistingContracts() {
  console.log('🔧 Testing Existing Smart Contracts...\n');

  // Get signers
  const [owner, user1, user2] = await ethers.getSigners();
  console.log('👤 Owner:', owner.address);
  console.log('👤 User1:', user1.address);
  console.log('👤 User2:', user2.address);

  // Get deployed contract addresses (from our deployment)
  const mockUSDCAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const mockWETHAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
  const htlcAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
  const bridgeAddress = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';

  console.log('📋 Using deployed contracts:');
  console.log('   MockUSDC:', mockUSDCAddress);
  console.log('   MockWETH:', mockWETHAddress);
  console.log('   HTLC:', htlcAddress);
  console.log('   Bridge:', bridgeAddress);

  // Get contract instances
  const MockUSDC = await ethers.getContractFactory('MockUSDC');
  const MockWETH = await ethers.getContractFactory('MockWETH');
  const EthereumHTLC = await ethers.getContractFactory('EthereumHTLC');

  const mockUSDC = MockUSDC.attach(mockUSDCAddress);
  const mockWETH = MockWETH.attach(mockWETHAddress);
  const htlc = EthereumHTLC.attach(htlcAddress);

  // Test MockUSDC
  console.log('\n🧪 Testing MockUSDC...');
  const usdcBalance = await mockUSDC.balanceOf(owner.address);
  console.log('💰 Owner USDC balance:', ethers.formatUnits(usdcBalance, 6));

  // Test faucet
  console.log('🚰 Testing faucet...');
  await mockUSDC.faucet();
  const newBalance = await mockUSDC.balanceOf(owner.address);
  console.log('💰 New USDC balance:', ethers.formatUnits(newBalance, 6));

  // Test MockWETH
  console.log('\n🧪 Testing MockWETH...');
  const wethBalance = await mockWETH.balanceOf(owner.address);
  console.log('💰 Owner WETH balance:', ethers.formatUnits(wethBalance, 18));

  // Test WETH faucet
  await mockWETH.faucet();
  const newWethBalance = await mockWETH.balanceOf(owner.address);
  console.log('💰 New WETH balance:', ethers.formatUnits(newWethBalance, 18));

  // Test HTLC creation
  console.log('\n🔒 Testing HTLC creation...');
  const amount = ethers.parseEther('0.1'); // Smaller amount for testing
  const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const hashlock = ethers.keccak256(
    ethers.toUtf8Bytes('test-secret-' + Date.now())
  );

  const tx = await htlc.newContractETH(
    ethers.keccak256(ethers.toUtf8Bytes('contract-test-' + Date.now())),
    user1.address,
    hashlock,
    timelock,
    'GABC123456789DEFGHIJKLMNOPQRSTUVWXYZ',
    { value: amount }
  );

  await tx.wait();
  console.log('✅ ETH HTLC created successfully');

  // Check total swaps
  const totalSwaps = await htlc.totalSwaps();
  console.log('📊 Total HTLC swaps:', totalSwaps.toString());

  // Test HTLC with ERC20 token
  console.log('\n🔒 Testing ERC20 HTLC...');

  // First approve HTLC to spend USDC
  await mockUSDC.approve(htlcAddress, ethers.parseUnits('100', 6));

  const erc20Amount = ethers.parseUnits('50', 6);
  const erc20Timelock = Math.floor(Date.now() / 1000) + 3600;
  const erc20Hashlock = ethers.keccak256(
    ethers.toUtf8Bytes('erc20-secret-' + Date.now())
  );

  const erc20Tx = await htlc.newContract(
    ethers.keccak256(ethers.toUtf8Bytes('erc20-contract-' + Date.now())),
    user2.address,
    mockUSDCAddress,
    erc20Amount,
    erc20Hashlock,
    erc20Timelock,
    'GXYZ987654321ABCDEFGHIJKLMNOPQRSTUV'
  );

  await erc20Tx.wait();
  console.log('✅ ERC20 HTLC created successfully');

  // Check final total swaps
  const finalTotalSwaps = await htlc.totalSwaps();
  console.log('📊 Final total HTLC swaps:', finalTotalSwaps.toString());

  console.log('\n🎉 All tests completed successfully!');
}

testExistingContracts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
