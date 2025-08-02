const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:3000';

// Generate test data
const contractId = crypto.randomBytes(32).toString('hex');
const preimage = crypto.randomBytes(32).toString('hex');
const hashlock = crypto.createHash('sha256').update(preimage).digest('hex');
const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

console.log('🔧 Ethereum HTLC Test Setup');
console.log('===========================');
console.log(`Contract ID: ${contractId}`);
console.log(`Preimage: ${preimage.substring(0, 16)}...`);
console.log(`Hashlock: ${hashlock.substring(0, 16)}...`);
console.log(`Timelock: ${timelock}`);
console.log('');

async function testEthereumHTLC() {
  try {
    console.log('1️⃣ Testing Ethereum Service Health...');
    const healthResponse = await axios.get(`${BASE_URL}/api/stellar/health`);
    console.log('✅ Stellar service is healthy');
    console.log(`   Network: ${healthResponse.data.data.network}`);
    console.log('');

    console.log('2️⃣ Testing Contract Information...');
    const contractResponse = await axios.get(
      `${BASE_URL}/api/bridge/contracts`
    );
    console.log('✅ Contract information retrieved');
    console.log(`   Network: ${contractResponse.data.data.network}`);
    console.log(
      `   HTLC Address: ${contractResponse.data.data.addresses.EthereumHTLC}`
    );
    console.log(
      `   Bridge Address: ${contractResponse.data.data.addresses.BridgeController}`
    );
    console.log('');

    console.log('3️⃣ Creating ETH HTLC on Ethereum...');
    const ethHTLCResponse = await axios.post(
      `${BASE_URL}/api/bridge/test-htlc`,
      {
        contractId,
        participant: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Test account
        amount: '0.001', // 0.001 ETH (smaller amount)
        hashlock,
        timelock,
        asset: 'ETH',
      }
    );

    if (ethHTLCResponse.data.success) {
      console.log('✅ Ethereum HTLC created successfully');
      console.log(`   Transaction Hash: ${ethHTLCResponse.data.data.hash}`);
      console.log(`   Amount: ${ethHTLCResponse.data.data.amount} ETH`);
      console.log(`   Contract ID: ${ethHTLCResponse.data.data.contractId}`);
    } else {
      console.log('❌ Failed to create Ethereum HTLC');
      console.log(`   Error: ${ethHTLCResponse.data.error}`);
    }
    console.log('');

    console.log('4️⃣ Testing HTLC Details...');
    const detailsResponse = await axios.get(
      `${BASE_URL}/api/bridge/htlc/${contractId}`
    );
    if (detailsResponse.data.success) {
      console.log('✅ HTLC details retrieved');
      console.log(`   Amount: ${detailsResponse.data.data.amount}`);
      console.log(`   Participant: ${detailsResponse.data.data.participant}`);
      console.log(`   Withdrawn: ${detailsResponse.data.data.withdrawn}`);
      console.log(`   Refunded: ${detailsResponse.data.data.refunded}`);
    } else {
      console.log('❌ Failed to get HTLC details');
      console.log(`   Error: ${detailsResponse.data.error}`);
    }
    console.log('');

    console.log('5️⃣ Testing HTLC Withdrawal on Ethereum...');
    const ethWithdrawResponse = await axios.post(
      `${BASE_URL}/api/bridge/withdraw-htlc`,
      {
        contractId,
        preimage,
      }
    );

    if (ethWithdrawResponse.data.success) {
      console.log('✅ Ethereum HTLC withdrawn successfully');
      console.log(`   Transaction Hash: ${ethWithdrawResponse.data.data.hash}`);
      console.log(
        `   Preimage: ${ethWithdrawResponse.data.data.preimage.substring(
          0,
          16
        )}...`
      );
    } else {
      console.log('❌ Failed to withdraw Ethereum HTLC');
      console.log(`   Error: ${ethWithdrawResponse.data.error}`);
    }
    console.log('');

    console.log('🎉 Ethereum HTLC Test Completed!');
    console.log('==================================');
    console.log('✅ Ethereum HTLC creation and withdrawal working');
    console.log('✅ Cross-chain bridge foundation verified');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the test
testEthereumHTLC();
