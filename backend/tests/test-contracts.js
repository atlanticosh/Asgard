const { ethers } = require('hardhat');

async function testContracts() {
  console.log('🔧 Testing Smart Contracts...\n');

  // Get signers
  const [owner, user1, user2] = await ethers.getSigners();
  console.log('👤 Owner:', owner.address);
  console.log('👤 User1:', user1.address);
  console.log('👤 User2:', user2.address);

  // Get contract factories
  const MockUSDC = await ethers.getContractFactory('MockUSDC');
  const MockWETH = await ethers.getContractFactory('MockWETH');
  const EthereumHTLC = await ethers.getContractFactory('EthereumHTLC');
  const BridgeController = await ethers.getContractFactory('BridgeController');

  console.log('\n📋 Deploying contracts...');

  // Deploy contracts
  const mockUSDC = await MockUSDC.deploy();
  const mockWETH = await MockWETH.deploy();
  const htlc = await EthereumHTLC.deploy();
  // Deploy a mock 1inch router for testing
  const Mock1inchRouter = await ethers.getContractFactory('MockUSDC'); // Using MockUSDC as a simple mock
  const mock1inchRouter = await Mock1inchRouter.deploy();
  await mock1inchRouter.waitForDeployment();

  const bridge = await BridgeController.deploy(
    await htlc.getAddress(),
    await mock1inchRouter.getAddress(), // 1inch router address
    owner.address // bridge bot address
  );

  await mockUSDC.waitForDeployment();
  await mockWETH.waitForDeployment();
  await htlc.waitForDeployment();
  await bridge.waitForDeployment();

  console.log('✅ MockUSDC deployed to:', await mockUSDC.getAddress());
  console.log('✅ MockWETH deployed to:', await mockWETH.getAddress());
  console.log('✅ HTLC deployed to:', await htlc.getAddress());
  console.log('✅ Bridge deployed to:', await bridge.getAddress());

  // Test MockUSDC
  console.log('\n🧪 Testing MockUSDC...');
  const usdcBalance = await mockUSDC.balanceOf(owner.address);
  console.log('💰 Owner USDC balance:', ethers.formatUnits(usdcBalance, 6));

  // Mint some USDC
  await mockUSDC.mint(owner.address, ethers.parseUnits('1000', 6));
  const newBalance = await mockUSDC.balanceOf(owner.address);
  console.log('💰 New USDC balance:', ethers.formatUnits(newBalance, 6));

  // Test HTLC creation
  console.log('\n🔒 Testing HTLC creation...');
  const amount = ethers.parseEther('1.0');
  const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const hashlock = ethers.keccak256(ethers.toUtf8Bytes('test-secret'));

  const tx = await htlc.newContractETH(
    ethers.keccak256(ethers.toUtf8Bytes('contract-1')),
    user1.address,
    hashlock,
    timelock,
    'GABC123456789DEFGHIJKLMNOPQRSTUVWXYZ',
    { value: amount }
  );

  await tx.wait();
  console.log('✅ ETH HTLC created successfully');

  // Check HTLC details
  const contractId = ethers.keccak256(ethers.toUtf8Bytes('contract-1'));
  const contract = await htlc.getContract(contractId);
  console.log('📋 HTLC Details:');
  console.log('   Amount:', ethers.formatEther(contract.amount));
  console.log('   Participant:', contract.participant);
  console.log('   Timelock:', contract.timelock.toString());
  console.log('   Withdrawn:', contract.withdrawn);
  console.log('   Refunded:', contract.refunded);

  // Test Bridge Controller
  console.log('\n🌉 Testing Bridge Controller...');
  const stats = await bridge.getBridgeStats();
  console.log('📊 Bridge Stats:');
  console.log('   Total Swaps:', stats.totalSwaps.toString());
  console.log('   Total Volume:', ethers.formatEther(stats.totalVolume));

  console.log('\n🎉 All tests completed successfully!');
}

testContracts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
