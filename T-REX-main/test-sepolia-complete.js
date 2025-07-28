const { ethers } = require('hardhat');
const fs = require('fs');

async function testSepoliaComplete() {
    console.log('🧪 COMPREHENSIVE SEPOLIA TESTING');
    console.log('=================================');
    
    // Load deployment data
    const contracts = JSON.parse(fs.readFileSync('test-data/deployed-contracts.json'));
    const wallets = JSON.parse(fs.readFileSync('test-data/wallets.json'));
    
    // Get contract instances
    const token = await ethers.getContractAt('Token', contracts.token);
    const identityRegistry = await ethers.getContractAt('IdentityRegistry', contracts.identityRegistry);
    const compliance = await ethers.getContractAt('DefaultCompliance', contracts.compliance);
    
    // Get wallet instances
    const alice = wallets.find(w => w.role === 'investor1_alice');
    const bob = wallets.find(w => w.role === 'investor2_bob');
    const charlie = wallets.find(w => w.role === 'investor3_charlie');
    const nonKyc = wallets.find(w => w.role === 'regularUser1');
    const agent = wallets.find(w => w.role === 'tokenAgent');
    const issuer = wallets.find(w => w.role === 'tokenIssuer');
    
    const aliceWallet = new ethers.Wallet(alice.privateKey, ethers.provider);
    const bobWallet = new ethers.Wallet(bob.privateKey, ethers.provider);
    const agentWallet = new ethers.Wallet(agent.privateKey, ethers.provider);
    const issuerWallet = new ethers.Wallet(issuer.privateKey, ethers.provider);
    
    const tokenAsAlice = token.connect(aliceWallet);
    const tokenAsBob = token.connect(bobWallet);
    const registryAsAgent = identityRegistry.connect(agentWallet);
    const tokenAsIssuer = token.connect(issuerWallet);
    
    const testResults = [];
    
    // Test 1: Basic Token Info
    console.log('\n📋 TEST 1: Token Information');
    try {
        const name = await token.name();
        const symbol = await token.symbol();
        const totalSupply = await token.totalSupply();
        const decimals = await token.decimals();
        
        console.log(`✅ Name: ${name}`);
        console.log(`✅ Symbol: ${symbol}`);
        console.log(`✅ Total Supply: ${ethers.utils.formatUnits(totalSupply, 18)}`);
        console.log(`✅ Decimals: ${decimals}`);
        
        testResults.push({
            test: 'Token Information',
            status: 'PASS',
            details: `${name} (${symbol}) - ${ethers.utils.formatUnits(totalSupply, 18)} tokens`
        });
    } catch (error) {
        console.log(`❌ Token info failed: ${error.message}`);
        testResults.push({ test: 'Token Information', status: 'FAIL', error: error.message });
    }
    
    // Test 2: Initial Balances
    console.log('\n💰 TEST 2: Initial Balances');
    try {
        const aliceBalance = await token.balanceOf(alice.address);
        const bobBalance = await token.balanceOf(bob.address);
        const charlieBalance = await token.balanceOf(charlie.address);
        
        console.log(`✅ Alice: ${ethers.utils.formatUnits(aliceBalance, 18)} SECTOK`);
        console.log(`✅ Bob: ${ethers.utils.formatUnits(bobBalance, 18)} SECTOK`);
        console.log(`✅ Charlie: ${ethers.utils.formatUnits(charlieBalance, 18)} SECTOK`);
        
        testResults.push({
            test: 'Initial Balances',
            status: 'PASS',
            details: `Alice: ${ethers.utils.formatUnits(aliceBalance, 18)}, Bob: ${ethers.utils.formatUnits(bobBalance, 18)}`
        });
    } catch (error) {
        console.log(`❌ Balance check failed: ${error.message}`);
        testResults.push({ test: 'Initial Balances', status: 'FAIL', error: error.message });
    }
    
    // Test 3: KYC Verification
    console.log('\n🆔 TEST 3: KYC Verification');
    try {
        const aliceVerified = await identityRegistry.isVerified(alice.address);
        const bobVerified = await identityRegistry.isVerified(bob.address);
        const nonKycVerified = await identityRegistry.isVerified(nonKyc.address);
        
        console.log(`✅ Alice KYC: ${aliceVerified}`);
        console.log(`✅ Bob KYC: ${bobVerified}`);
        console.log(`✅ Non-KYC: ${nonKycVerified} (should be false)`);
        
        if (aliceVerified && bobVerified && !nonKycVerified) {
            testResults.push({ test: 'KYC Verification', status: 'PASS', details: 'All KYC statuses correct' });
        } else {
            testResults.push({ test: 'KYC Verification', status: 'FAIL', details: 'Incorrect KYC statuses' });
        }
    } catch (error) {
        console.log(`❌ KYC check failed: ${error.message}`);
        testResults.push({ test: 'KYC Verification', status: 'FAIL', error: error.message });
    }
    
    // Test 4: Valid Transfer
    console.log('\n🔄 TEST 4: Valid Transfer (Alice → Bob)');
    try {
        const initialAlice = await token.balanceOf(alice.address);
        const initialBob = await token.balanceOf(bob.address);
        const transferAmount = ethers.utils.parseUnits("25", 18);
        
        const tx = await tokenAsAlice.transfer(bob.address, transferAmount);
        const receipt = await tx.wait();
        
        const finalAlice = await token.balanceOf(alice.address);
        const finalBob = await token.balanceOf(bob.address);
        
        console.log(`✅ Transaction: https://sepolia.etherscan.io/tx/${tx.hash}`);
        console.log(`✅ Alice: ${ethers.utils.formatUnits(initialAlice, 18)} → ${ethers.utils.formatUnits(finalAlice, 18)}`);
        console.log(`✅ Bob: ${ethers.utils.formatUnits(initialBob, 18)} → ${ethers.utils.formatUnits(finalBob, 18)}`);
        
        testResults.push({
            test: 'Valid Transfer',
            status: 'PASS',
            transactionHash: tx.hash,
            details: `25 tokens transferred from Alice to Bob`
        });
    } catch (error) {
        console.log(`❌ Valid transfer failed: ${error.message}`);
        testResults.push({ test: 'Valid Transfer', status: 'FAIL', error: error.message });
    }
    
    // Test 5: Invalid Transfer (to non-KYC)
    console.log('\n🚫 TEST 5: Invalid Transfer (Alice → Non-KYC)');
    try {
        const transferAmount = ethers.utils.parseUnits("1", 18);
        await tokenAsAlice.transfer(nonKyc.address, transferAmount);
        
        console.log(`❌ Transfer succeeded (should have failed)`);
        testResults.push({ test: 'Invalid Transfer Block', status: 'FAIL', details: 'Transfer to non-KYC succeeded' });
    } catch (error) {
        console.log(`✅ Transfer correctly blocked: ${error.reason || error.message}`);
        testResults.push({
            test: 'Invalid Transfer Block',
            status: 'PASS',
            details: 'Transfer to non-KYC correctly blocked'
        });
    }
    
    // Test 6: Freeze Functionality
    console.log('\n🧊 TEST 6: Address Freeze');
    try {
        // Freeze Alice
        const freezeTx = await registryAsAgent.setAddressFrozen(alice.address, true);
        await freezeTx.wait();
        console.log(`✅ Alice frozen: https://sepolia.etherscan.io/tx/${freezeTx.hash}`);
        
        // Try transfer while frozen
        try {
            await tokenAsAlice.transfer(bob.address, ethers.utils.parseUnits("1", 18));
            console.log(`❌ Transfer succeeded while frozen`);
            testResults.push({ test: 'Freeze Functionality', status: 'FAIL', details: 'Transfer worked while frozen' });
        } catch (error) {
            console.log(`✅ Transfer blocked while frozen: ${error.reason || error.message}`);
            
            // Unfreeze Alice
            const unfreezeTx = await registryAsAgent.setAddressFrozen(alice.address, false);
            await unfreezeTx.wait();
            console.log(`✅ Alice unfrozen: https://sepolia.etherscan.io/tx/${unfreezeTx.hash}`);
            
            testResults.push({
                test: 'Freeze Functionality',
                status: 'PASS',
                details: 'Freeze and unfreeze worked correctly'
            });
        }
    } catch (error) {
        console.log(`❌ Freeze test failed: ${error.message}`);
        testResults.push({ test: 'Freeze Functionality', status: 'FAIL', error: error.message });
    }
    
    // Test 7: Pause Functionality
    console.log('\n⏸️ TEST 7: Token Pause');
    try {
        // Pause token
        const pauseTx = await tokenAsIssuer.pause();
        await pauseTx.wait();
        console.log(`✅ Token paused: https://sepolia.etherscan.io/tx/${pauseTx.hash}`);
        
        // Try transfer while paused
        try {
            await tokenAsAlice.transfer(bob.address, ethers.utils.parseUnits("1", 18));
            console.log(`❌ Transfer succeeded while paused`);
            testResults.push({ test: 'Pause Functionality', status: 'FAIL', details: 'Transfer worked while paused' });
        } catch (error) {
            console.log(`✅ Transfer blocked while paused: ${error.reason || error.message}`);
            
            // Unpause token
            const unpauseTx = await tokenAsIssuer.unpause();
            await unpauseTx.wait();
            console.log(`✅ Token unpaused: https://sepolia.etherscan.io/tx/${unpauseTx.hash}`);
            
            testResults.push({
                test: 'Pause Functionality',
                status: 'PASS',
                details: 'Pause and unpause worked correctly'
            });
        }
    } catch (error) {
        console.log(`❌ Pause test failed: ${error.message}`);
        testResults.push({ test: 'Pause Functionality', status: 'FAIL', error: error.message });
    }
    
    // Test 8: Compliance Check
    console.log('\n⚖️ TEST 8: Compliance Verification');
    try {
        const amount = ethers.utils.parseUnits("10", 18);
        
        const canTransferValid = await compliance.canTransfer(alice.address, bob.address, amount);
        const canTransferInvalid = await compliance.canTransfer(alice.address, nonKyc.address, amount);
        
        console.log(`✅ Alice → Bob allowed: ${canTransferValid}`);
        console.log(`✅ Alice → Non-KYC allowed: ${canTransferInvalid} (should be false)`);
        
        if (canTransferValid && !canTransferInvalid) {
            testResults.push({ test: 'Compliance Check', status: 'PASS', details: 'Compliance rules working correctly' });
        } else {
            testResults.push({ test: 'Compliance Check', status: 'FAIL', details: 'Compliance rules not working' });
        }
    } catch (error) {
        console.log(`❌ Compliance check failed: ${error.message}`);
        testResults.push({ test: 'Compliance Check', status: 'FAIL', error: error.message });
    }
    
    // Final Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    
    const passedTests = testResults.filter(t => t.status === 'PASS').length;
    const totalTests = testResults.length;
    
    testResults.forEach((result, i) => {
        const status = result.status === 'PASS' ? '✅' : '❌';
        console.log(`${status} Test ${i+1}: ${result.test}`);
        if (result.details) console.log(`   ${result.details}`);
        if (result.transactionHash) console.log(`   TX: https://sepolia.etherscan.io/tx/${result.transactionHash}`);
        if (result.error) console.log(`   Error: ${result.error}`);
    });
    
    console.log(`\n🎯 Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 ALL TESTS PASSED! Your ERC-3643 token is working perfectly on Sepolia!');
    } else {
        console.log('⚠️ Some tests failed. Check the errors above.');
    }
    
    // Save results
    const timestamp = new Date().toISOString();
    const fullResults = {
        timestamp,
        network: 'sepolia',
        tokenAddress: contracts.token,
        totalTests,
        passedTests,
        results: testResults
    };
    
    fs.writeFileSync('test-data/sepolia-test-results.json', JSON.stringify(fullResults, null, 2));
    console.log('\n💾 Results saved to: test-data/sepolia-test-results.json');
    
    return testResults;
}

// Run if called directly
if (require.main === module) {
    testSepoliaComplete()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { testSepoliaComplete }; 