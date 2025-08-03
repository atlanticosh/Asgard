const { ethers } = require('hardhat');

async function main() {
  console.log('🚀 Deploying HTLC Contract to', hre.network.name);

  const [deployer] = await ethers.getSigners();

  console.log('🔐 Deploying with account:', deployer.address);
  console.log(
    '💰 Account balance:',
    ethers.formatEther(await deployer.provider.getBalance(deployer.address)),
    'ETH'
  );

  // Deploy only the HTLC contract
  console.log('\n🔒 Deploying EthereumHTLC...');

  const EthereumHTLC = await ethers.getContractFactory('EthereumHTLC');
  const htlc = await EthereumHTLC.deploy(deployer.address); // Fee recipient
  await htlc.waitForDeployment();

  const htlcAddress = await htlc.getAddress();
  console.log('✅ EthereumHTLC deployed to:', htlcAddress);

  // ============ DEPLOYMENT SUMMARY ============
  console.log('\n🎉 HTLC DEPLOYMENT COMPLETE');
  console.log('═'.repeat(50));
  console.log('Network:', hre.network.name);
  console.log('Deployer:', deployer.address);
  console.log('HTLC Contract:', htlcAddress);
  console.log('');
  console.log('🔧 Add to your .env file:');
  console.log(`HTLC_CONTRACT_ADDRESS=${htlcAddress}`);
  console.log('');
  console.log('🚀 Ready for HTLC operations!');
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });
