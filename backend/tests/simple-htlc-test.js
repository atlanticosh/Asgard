const { ethers } = require('hardhat');

async function simpleHTLCTest() {
  console.log('🔧 Simple HTLC Test');
  console.log('===================');

  try {
    // Get signers
    const [owner, user1] = await ethers.getSigners();
    console.log('👤 Owner:', owner.address);
    console.log('👤 User1:', user1.address);

    // Get contract factories
    const EthereumHTLC = await ethers.getContractFactory('EthereumHTLC');
    const MockUSDC = await ethers.getContractFactory('MockUSDC');

    // Deploy contracts
    console.log('\n📋 Deploying contracts...');
    const htlc = await EthereumHTLC.deploy(owner.address); // fee recipient
    const mockUSDC = await MockUSDC.deploy();

    await htlc.waitForDeployment();
    await mockUSDC.waitForDeployment();

    console.log('✅ HTLC deployed to:', await htlc.getAddress());
    console.log('✅ MockUSDC deployed to:', await mockUSDC.getAddress());

    // Test parameters
    const contractId = ethers.keccak256(ethers.toUtf8Bytes('test-contract'));
    const amount = ethers.parseEther('0.1');
    const timelock = Math.floor(Date.now() / 1000) + 7200; // 2 hours from now (within 1-48 hour range)
    const secret = ethers.keccak256(ethers.toUtf8Bytes('test-secret')); // Use bytes32 as secret
    const hashlock = ethers.keccak256(
      ethers.solidityPacked(['bytes32'], [secret])
    );

    console.log('\n🔒 Creating ETH HTLC...');
    const tx = await htlc.newContractETH(
      contractId,
      user1.address,
      hashlock,
      timelock,
      'GCLTXZ72C6SXZT73NW4SAMHE7RJXOY2B7N66UMX7MMIUEAJBDW752JTN',
      { value: amount }
    );

    await tx.wait();
    console.log('✅ ETH HTLC created successfully');

    // Check HTLC details
    const contract = await htlc.getContract(contractId);
    console.log('\n📋 HTLC Details:');
    console.log('   Amount:', ethers.formatEther(contract.amount));
    console.log('   Participant:', contract.participant);
    console.log('   Timelock:', contract.timelock.toString());
    console.log('   Withdrawn:', contract.withdrawn);
    console.log('   Refunded:', contract.refunded);

    // Test withdrawal
    console.log('\n💰 Testing withdrawal...');
    const withdrawTx = await htlc.connect(user1).withdraw(contractId, secret);
    await withdrawTx.wait();
    console.log('✅ HTLC withdrawn successfully');

    // Check final state
    const finalContract = await htlc.getContract(contractId);
    console.log('\n📋 Final HTLC State:');
    console.log('   Withdrawn:', finalContract.withdrawn);
    console.log('   Refunded:', finalContract.refunded);

    console.log('\n🎉 HTLC Test Completed Successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

simpleHTLCTest()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
