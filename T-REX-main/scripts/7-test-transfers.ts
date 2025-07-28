import { ethers } from 'hardhat';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

interface WalletInfo {
  role: string;
  address: string;
  privateKey: string;
  mnemonic?: string;
}

interface DeployedContracts {
  token: string;
  tokenDetails: {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
  };
  network: string;
}

interface TransferTest {
  testName: string;
  fromRole: string;
  toRole: string;
  amount: string;
  expectedResult: 'SUCCESS' | 'FAIL';
  actualResult?: 'SUCCESS' | 'FAIL';
  transactionHash?: string;
  errorMessage?: string;
  gasUsed?: string;
}

async function testTransfers() {
  console.log('🔄 Testing ERC-3643 token transfers and compliance...\n');

  // Load required data files
  const walletsPath = join(__dirname, '../test-data/wallets.json');
  const contractsPath = join(__dirname, '../test-data/deployed-contracts.json');

  if (!existsSync(walletsPath)) {
    throw new Error('Wallets file not found. Run 1-generate-wallets.ts first');
  }
  if (!existsSync(contractsPath)) {
    throw new Error('Deployed contracts not found. Run 4-deploy-trex-suite.ts first');
  }

  const wallets: WalletInfo[] = JSON.parse(readFileSync(walletsPath, 'utf-8'));
  const deployedContracts: DeployedContracts = JSON.parse(readFileSync(contractsPath, 'utf-8'));

  const walletMap = Object.fromEntries(wallets.map(w => [w.role, w]));

  // Get token contract
  const token = await ethers.getContractAt('Token', deployedContracts.token);
  const decimals = await token.decimals();

  console.log(`Token Contract: ${deployedContracts.token}`);
  console.log(`Token Symbol: ${deployedContracts.tokenDetails.symbol}`);
  console.log(`Network: ${deployedContracts.network}\n`);

  // Define test scenarios
  const transferTests: TransferTest[] = [
    {
      testName: 'Valid transfer between KYC users',
      fromRole: 'investor1_alice',
      toRole: 'investor2_bob',
      amount: '50',
      expectedResult: 'SUCCESS'
    },
    {
      testName: 'Valid transfer from Bob back to Alice',
      fromRole: 'investor2_bob',
      toRole: 'investor1_alice', 
      amount: '25',
      expectedResult: 'SUCCESS'
    },
    {
      testName: 'Transfer to non-KYC user (should fail)',
      fromRole: 'investor1_alice',
      toRole: 'regularUser1',
      amount: '10',
      expectedResult: 'FAIL'
    },
    {
      testName: 'Transfer from non-KYC user (should fail)',
      fromRole: 'regularUser1',
      toRole: 'investor2_bob',
      amount: '5',
      expectedResult: 'FAIL'
    },
    {
      testName: 'Large transfer between KYC users',
      fromRole: 'investor3_charlie',
      toRole: 'investor4_david',
      amount: '100',
      expectedResult: 'SUCCESS'
    }
  ];

  console.log('📊 Initial Balances:');
  console.log('═'.repeat(80));
  await displayBalances(token, decimals, [
    'investor1_alice',
    'investor2_bob', 
    'investor3_charlie',
    'investor4_david',
    'regularUser1',
    'regularUser2'
  ], walletMap, deployedContracts.tokenDetails.symbol);

  console.log('\n🧪 Running Transfer Tests:');
  console.log('═'.repeat(120));
  console.log('Test                              | From                | To                  | Amount | Expected | Actual   | Status');
  console.log('═'.repeat(120));

  for (const test of transferTests) {
    try {
      const fromWallet = new ethers.Wallet(walletMap[test.fromRole].privateKey, ethers.provider);
      const toAddress = walletMap[test.toRole].address;
      const amountWei = ethers.utils.parseUnits(test.amount, decimals);

      const tokenAsFrom = token.connect(fromWallet);

      // Check initial balance
      const initialBalance = await token.balanceOf(fromWallet.address);
      if (initialBalance.lt(amountWei) && test.expectedResult === 'SUCCESS') {
        test.actualResult = 'FAIL';
        test.errorMessage = 'Insufficient balance';
        console.log(`❌ ${test.testName.padEnd(30)} | ${test.fromRole.padEnd(17)} | ${test.toRole.padEnd(17)} | ${test.amount.padStart(6)} | ${test.expectedResult.padEnd(8)} | FAIL     | INSUFFICIENT_BALANCE`);
        continue;
      }

      // Attempt the transfer
      const transferTx = await tokenAsFrom.transfer(toAddress, amountWei);
      const receipt = await transferTx.wait();

      test.actualResult = 'SUCCESS';
      test.transactionHash = transferTx.hash;
      test.gasUsed = receipt.gasUsed.toString();

      const status = test.actualResult === test.expectedResult ? '✅ PASS' : '❌ UNEXPECTED';
      console.log(`${status} ${test.testName.padEnd(30)} | ${test.fromRole.padEnd(17)} | ${test.toRole.padEnd(17)} | ${test.amount.padStart(6)} | ${test.expectedResult.padEnd(8)} | SUCCESS  | TX: ${transferTx.hash.substring(0, 10)}...`);

    } catch (error: any) {
      test.actualResult = 'FAIL';
      test.errorMessage = error.reason || error.message || 'Unknown error';

      const status = test.actualResult === test.expectedResult ? '✅ PASS' : '❌ UNEXPECTED';
      const errorDisplay = test.errorMessage.substring(0, 30);
      console.log(`${status} ${test.testName.padEnd(30)} | ${test.fromRole.padEnd(17)} | ${test.toRole.padEnd(17)} | ${test.amount.padStart(6)} | ${test.expectedResult.padEnd(8)} | FAIL     | ${errorDisplay}`);
    }
  }

  console.log('═'.repeat(120));

  // Display final balances
  console.log('\n💰 Final Balances:');
  console.log('═'.repeat(80));
  await displayBalances(token, decimals, [
    'investor1_alice',
    'investor2_bob',
    'investor3_charlie', 
    'investor4_david',
    'regularUser1',
    'regularUser2'
  ], walletMap, deployedContracts.tokenDetails.symbol);

  // Test summary
  const totalTests = transferTests.length;
  const passedTests = transferTests.filter(t => t.actualResult === t.expectedResult).length;
  const failedTests = totalTests - passedTests;

  console.log('\n📈 Test Summary:');
  console.log('═'.repeat(50));
  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (failedTests > 0) {
    console.log('\n❌ Failed Tests:');
    transferTests
      .filter(t => t.actualResult !== t.expectedResult)
      .forEach(test => {
        console.log(`   • ${test.testName}: Expected ${test.expectedResult}, got ${test.actualResult}`);
        if (test.errorMessage) {
          console.log(`     Error: ${test.errorMessage}`);
        }
      });
  }

  // Test additional compliance features
  console.log('\n🔒 Testing Additional Compliance Features:');
  await testComplianceFeatures(token, walletMap);

  // Save test results
  console.log('\n💾 Saving test results...');
  const resultsPath = join(__dirname, '../test-data/transfer-test-results.json');
  const testResults = {
    timestamp: new Date().toISOString(),
    network: deployedContracts.network,
    tokenAddress: deployedContracts.token,
    totalTests,
    passedTests,
    failedTests,
    successRate: (passedTests / totalTests) * 100,
    tests: transferTests
  };

  writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  console.log(`   Test results saved to: ${resultsPath}`);

  console.log('\n🎉 Transfer Testing Complete!');
  console.log('═'.repeat(60));
  console.log(`All tests completed with ${passedTests}/${totalTests} passing`);
  console.log(`ERC-3643 compliance: ${failedTests === 0 ? 'Working correctly' : 'Issues detected'}`);
  console.log('═'.repeat(60));

  return testResults;
}

async function displayBalances(
  token: any,
  decimals: number,
  roles: string[],
  walletMap: { [key: string]: WalletInfo },
  symbol: string
) {
  console.log('Role                 | Address                                    | Balance');
  console.log('═'.repeat(80));

  for (const role of roles) {
    try {
      const wallet = walletMap[role];
      if (!wallet) {
        console.log(`${role.padEnd(18)} | Address not found                          | N/A`);
        continue;
      }

      const balance = await token.balanceOf(wallet.address);
      const formattedBalance = ethers.utils.formatUnits(balance, decimals);
      
      console.log(`${role.padEnd(18)} | ${wallet.address} | ${formattedBalance.padStart(12)} ${symbol}`);
    } catch (error) {
      console.log(`${role.padEnd(18)} | Error reading balance                      | ERROR`);
    }
  }
}

async function testComplianceFeatures(token: any, walletMap: { [key: string]: WalletInfo }) {
  try {
    console.log('   Testing freeze functionality...');
    
    const tokenAgent = new ethers.Wallet(walletMap.tokenAgent.privateKey, ethers.provider);
    const alice = walletMap.investor1_alice.address;
    
    // Check if Alice is frozen
    const isFrozenBefore = await token.isFrozen(alice);
    console.log(`   Alice frozen status before: ${isFrozenBefore}`);
    
    if (!isFrozenBefore) {
      console.log('   Freezing Alice\'s address...');
      await token.connect(tokenAgent).setAddressFrozen(alice, true);
      
      const isFrozenAfter = await token.isFrozen(alice);
      console.log(`   Alice frozen status after: ${isFrozenAfter}`);
      
      // Try to transfer while frozen (should fail)
      try {
        const aliceWallet = new ethers.Wallet(walletMap.investor1_alice.privateKey, ethers.provider);
        const amount = ethers.utils.parseUnits('1', await token.decimals());
        await token.connect(aliceWallet).transfer(walletMap.investor2_bob.address, amount);
        console.log('   ❌ Transfer from frozen address succeeded (should fail)');
      } catch (error) {
        console.log('   ✅ Transfer from frozen address failed as expected');
      }
      
      // Unfreeze Alice
      console.log('   Unfreezing Alice\'s address...');
      await token.connect(tokenAgent).setAddressFrozen(alice, false);
      
      const isFrozenFinal = await token.isFrozen(alice);
      console.log(`   Alice frozen status final: ${isFrozenFinal}`);
    }

    // Test pause functionality
    console.log('\n   Testing pause functionality...');
    const isPausedBefore = await token.paused();
    console.log(`   Token paused status before: ${isPausedBefore}`);
    
    if (!isPausedBefore) {
      console.log('   Pausing token...');
      await token.connect(tokenAgent).pause();
      
      const isPausedAfter = await token.paused();
      console.log(`   Token paused status after: ${isPausedAfter}`);
      
      // Try to transfer while paused (should fail)
      try {
        const aliceWallet = new ethers.Wallet(walletMap.investor1_alice.privateKey, ethers.provider);
        const amount = ethers.utils.parseUnits('1', await token.decimals());
        await token.connect(aliceWallet).transfer(walletMap.investor2_bob.address, amount);
        console.log('   ❌ Transfer while paused succeeded (should fail)');
      } catch (error) {
        console.log('   ✅ Transfer while paused failed as expected');
      }
      
      // Unpause token
      console.log('   Unpausing token...');
      await token.connect(tokenAgent).unpause();
      
      const isPausedFinal = await token.paused();
      console.log(`   Token paused status final: ${isPausedFinal}`);
    }

  } catch (error) {
    console.error('   Error testing compliance features:', error);
  }
}

// Function to test a single transfer
async function testSingleTransfer(fromRole: string, toRole: string, amount: string) {
  console.log(`🔄 Testing single transfer: ${fromRole} → ${toRole} (${amount} tokens)\n`);

  const walletsPath = join(__dirname, '../test-data/wallets.json');
  const contractsPath = join(__dirname, '../test-data/deployed-contracts.json');

  const wallets: WalletInfo[] = JSON.parse(readFileSync(walletsPath, 'utf-8'));
  const deployedContracts: DeployedContracts = JSON.parse(readFileSync(contractsPath, 'utf-8'));

  const walletMap = Object.fromEntries(wallets.map(w => [w.role, w]));
  const token = await ethers.getContractAt('Token', deployedContracts.token);

  try {
    const fromWallet = new ethers.Wallet(walletMap[fromRole].privateKey, ethers.provider);
    const toAddress = walletMap[toRole].address;
    const amountWei = ethers.utils.parseUnits(amount, await token.decimals());

    console.log(`From: ${fromWallet.address} (${fromRole})`);
    console.log(`To: ${toAddress} (${toRole})`);
    console.log(`Amount: ${amount} tokens\n`);

    const balanceBefore = await token.balanceOf(fromWallet.address);
    console.log(`Balance before: ${ethers.utils.formatUnits(balanceBefore, await token.decimals())}`);

    const transferTx = await token.connect(fromWallet).transfer(toAddress, amountWei);
    const receipt = await transferTx.wait();

    const balanceAfter = await token.balanceOf(fromWallet.address);
    console.log(`Balance after: ${ethers.utils.formatUnits(balanceAfter, await token.decimals())}`);
    console.log(`Transaction: ${transferTx.hash}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);
    console.log('✅ Transfer successful!');

  } catch (error: any) {
    console.log('❌ Transfer failed:');
    console.log(`Error: ${error.reason || error.message}`);
  }
}

// Run the script
if (require.main === module) {
  const mode = process.argv[2];
  
  if (mode === 'single') {
    const fromRole = process.argv[3];
    const toRole = process.argv[4];
    const amount = process.argv[5] || '10';
    
    if (!fromRole || !toRole) {
      console.error('Usage: npm run transfer single <fromRole> <toRole> [amount]');
      process.exit(1);
    }
    
    testSingleTransfer(fromRole, toRole, amount)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('❌ Error testing transfer:', error);
        process.exit(1);
      });
  } else {
    testTransfers()
      .then(() => {
        console.log('\n✅ Transfer testing completed successfully!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Error during transfer testing:', error);
        process.exit(1);
      });
  }
}

export { testTransfers, testSingleTransfer }; 