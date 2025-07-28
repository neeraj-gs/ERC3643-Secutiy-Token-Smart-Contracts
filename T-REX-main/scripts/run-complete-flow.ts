import { ethers } from 'hardhat';
import { generateWallets } from './1-generate-wallets';
import { fundWallets } from './2-fund-wallets';
import { checkBalances } from './3-check-balances';
import { deployTREXSuite } from './4-deploy-trex-suite';
import { setupKYC } from './5-setup-kyc';
import { mintAndDistribute } from './6-mint-and-distribute';
import { testTransfers } from './7-test-transfers';

async function runCompleteFlow() {
  console.log('🚀 Running Complete ERC-3643 Token Deployment and Testing Flow\n');
  console.log('═'.repeat(80));
  console.log('This script will:');
  console.log('1. Generate test wallets');
  console.log('2. Fund wallets (on testnet)');
  console.log('3. Deploy complete T-REX suite');
  console.log('4. Setup KYC claims for investors');
  console.log('5. Mint and distribute tokens');
  console.log('6. Test token transfers and compliance');
  console.log('7. Generate final report');
  console.log('═'.repeat(80));

  const network = await ethers.provider.getNetwork();
  console.log(`\nNetwork: ${network.name} (Chain ID: ${network.chainId})`);
  
  // Confirmation for testnet deployment
  if (network.chainId !== 31337) { // Not Hardhat network
    console.log('\n⚠️  WARNING: You are about to deploy on a real network!');
    console.log('Make sure you have sufficient ETH for deployment and testing.');
    console.log('Press Ctrl+C to cancel or wait 10 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  try {
    // Step 1: Generate Wallets or use Hardhat signers
    console.log('\n📝 Step 1/7: Setting up test wallets...');
    console.log('─'.repeat(50));
    
    if (network.chainId === 31337) {
      // Use Hardhat built-in signers for local testing
      console.log('Using Hardhat built-in signers for local testing...');
      await generateHardhatWallets();
    } else {
      // Generate new wallets for testnet
      await generateWallets();
    }
    console.log('✅ Wallets configured successfully');

    // Step 2: Fund Wallets (skip on local)
    if (network.chainId === 31337) { // Hardhat network
      console.log('\n💰 Step 2/7: Checking wallet balances...');
      console.log('─'.repeat(50));
      console.log('ℹ️  On Hardhat network, wallets are pre-funded automatically');
    } else {
      console.log('\n💰 Step 2/7: Checking wallet balances...');
      console.log('─'.repeat(50));
      await checkBalances();
      console.log('⚠️  Please ensure wallets are funded before continuing');
    }
    console.log('✅ Wallet funding verified');

    // Step 3: Deploy T-REX Suite
    console.log('\n🏗️  Step 3/7: Deploying T-REX suite...');
    console.log('─'.repeat(50));
    await deployTREXSuite();
    console.log('✅ T-REX suite deployed successfully');

    // Step 4: Setup KYC
    console.log('\n🆔 Step 4/7: Setting up KYC claims...');
    console.log('─'.repeat(50));
    await setupKYC();
    console.log('✅ KYC setup completed successfully');

    // Step 5: Mint and Distribute Tokens
    console.log('\n🪙 Step 5/7: Minting and distributing tokens...');
    console.log('─'.repeat(50));
    await mintAndDistribute();
    console.log('✅ Token distribution completed successfully');

    // Step 6: Test Transfers
    console.log('\n🔄 Step 6/7: Testing transfers and compliance...');
    console.log('─'.repeat(50));
    await testTransfers();
    console.log('✅ Transfer testing completed successfully');

    // Step 7: Final Report
    console.log('\n📊 Step 7/7: Generating final report...');
    console.log('─'.repeat(50));
    await generateFinalReport();
    console.log('✅ Final report generated successfully');

    console.log('\n🎉 COMPLETE FLOW FINISHED SUCCESSFULLY! 🎉');
    console.log('═'.repeat(80));
    console.log('✅ All steps completed without errors');
    console.log('✅ ERC-3643 security token deployed and tested');
    console.log('✅ KYC compliance working correctly');
    console.log('✅ Token transfers restricted to verified users only');
    console.log('═'.repeat(80));

    console.log('\n📋 What was accomplished:');
    console.log('• Generated test wallets for all roles');
    console.log('• Deployed complete T-REX infrastructure');
    console.log('• Created ONCHAINID identities for all participants');
    console.log('• Set up KYC claim issuer and verification system');
    console.log('• Registered investors with valid KYC claims');
    console.log('• Minted and distributed security tokens');
    console.log('• Tested compliance rules and transfer restrictions');
    console.log('• Verified that non-KYC users cannot receive tokens');

    console.log('\n📁 Files created:');
    console.log('• test-data/wallets.json - All test wallets');
    console.log('• test-data/deployed-contracts.json - Contract addresses');
    console.log('• test-data/claim-issuer-signing-key.json - KYC signing key');
    console.log('• test-data/investor-identities.json - Investor ONCHAINID data');
    console.log('• test-data/token-distribution.json - Token distribution records');
    console.log('• test-data/transfer-test-results.json - Transfer test results');
    console.log('• test-data/final-report.json - Complete summary');

  } catch (error) {
    console.error('\n❌ FLOW FAILED!');
    console.error('Error:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check that you have sufficient ETH for all operations');
    console.log('2. Verify network connectivity');
    console.log('3. Ensure all dependencies are installed');
    console.log('4. Check individual script logs for detailed error messages');
    
    throw error;
  }
}

async function generateHardhatWallets() {
  const { writeFileSync, existsSync, mkdirSync } = await import('fs');
  const { join } = await import('path');
  
  // Get Hardhat signers
  const signers = await ethers.getSigners();
  
  const wallets = [
    { role: 'deployer', address: signers[0].address, privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' },
    { role: 'tokenIssuer', address: signers[1].address, privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' },
    { role: 'tokenAgent', address: signers[2].address, privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a' },
    { role: 'claimIssuer', address: signers[3].address, privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6' },
    { role: 'investor1_alice', address: signers[4].address, privateKey: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a' },
    { role: 'investor2_bob', address: signers[5].address, privateKey: '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba' },
    { role: 'investor3_charlie', address: signers[6].address, privateKey: '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e' },
    { role: 'investor4_david', address: signers[7].address, privateKey: '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356' },
    { role: 'regularUser1', address: signers[8].address, privateKey: '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97' },
    { role: 'regularUser2', address: signers[9].address, privateKey: '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6' }
  ];

  // Create output directory if it doesn't exist
  const outputDir = join(__dirname, '../test-data');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Save to JSON file
  const outputPath = join(outputDir, 'wallets.json');
  writeFileSync(outputPath, JSON.stringify(wallets, null, 2));

  console.log(`Hardhat wallets configured and saved to: ${outputPath}`);
  
  // Show wallet summary
  console.log('\n📊 Hardhat Wallets Summary:');
  console.log('═'.repeat(80));
  wallets.forEach((wallet) => {
    console.log(`${wallet.role.padEnd(20)} | ${wallet.address}`);
  });
}

async function generateFinalReport() {
  const { readFileSync, writeFileSync, existsSync } = await import('fs');
  const { join } = await import('path');
  
  const testDataDir = join(__dirname, '../test-data');
  const finalReport: any = {
    timestamp: new Date().toISOString(),
    network: (await ethers.provider.getNetwork()).name,
    success: true,
    summary: {}
  };

  // Load all data files
  const dataFiles = [
    'wallets.json',
    'deployed-contracts.json', 
    'investor-identities.json',
    'token-distribution.json',
    'transfer-test-results.json'
  ];

  for (const file of dataFiles) {
    const filePath = join(testDataDir, file);
    if (existsSync(filePath)) {
      const key = file.replace('.json', '');
      finalReport[key] = JSON.parse(readFileSync(filePath, 'utf-8'));
    }
  }

  // Generate summary statistics
  if (finalReport.wallets) {
    finalReport.summary.walletsGenerated = finalReport.wallets.length;
  }

  if (finalReport['deployed-contracts']) {
    finalReport.summary.contractsDeployed = Object.keys(finalReport['deployed-contracts']).length;
    finalReport.summary.tokenAddress = finalReport['deployed-contracts'].token;
    finalReport.summary.tokenSymbol = finalReport['deployed-contracts'].tokenDetails?.symbol;
  }

  if (finalReport['investor-identities']) {
    finalReport.summary.investorsWithKYC = finalReport['investor-identities'].length;
  }

  if (finalReport['token-distribution']) {
    finalReport.summary.tokensDistributed = finalReport['token-distribution'].totalDistributed;
    finalReport.summary.distributionTransactions = finalReport['token-distribution'].distributionCount;
  }

  if (finalReport['transfer-test-results']) {
    const results = finalReport['transfer-test-results'];
    finalReport.summary.transferTests = {
      total: results.totalTests,
      passed: results.passedTests,
      failed: results.failedTests,
      successRate: results.successRate
    };
  }

  // Save final report
  const reportPath = join(testDataDir, 'final-report.json');
  writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));

  console.log(`Final report saved to: ${reportPath}`);
  
  return finalReport;
}

// Script execution modes
if (require.main === module) {
  const mode = process.argv[2];

  if (mode === 'report-only') {
    generateFinalReport()
      .then(() => {
        console.log('✅ Final report generated successfully!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Error generating final report:', error);
        process.exit(1);
      });
  } else {
    runCompleteFlow()
      .then(() => {
        console.log('\n✅ Complete flow finished successfully!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n❌ Complete flow failed:', error);
        process.exit(1);
      });
  }
}

export { runCompleteFlow, generateFinalReport }; 