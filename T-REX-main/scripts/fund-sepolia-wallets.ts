import { ethers } from 'hardhat';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface WalletInfo {
  role: string;
  address: string;
  privateKey: string;
  mnemonic?: string;
}

interface FundingRequirement {
  wallet: WalletInfo;
  requiredAmount: string;
  currentBalance: string;
  needsFunding: boolean;
  amountToSend: string;
}

async function fundSepoliaWallets() {
  console.log('💰 SMART SEPOLIA WALLET FUNDING SYSTEM');
  console.log('=====================================');
  console.log('🎯 Only funds wallets that need ETH\n');

  // Check if we're on Sepolia
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 11155111) {
    throw new Error(`❌ This script is for Sepolia testnet only. Current network: ${network.name} (${network.chainId})`);
  }

  // Load wallets
  const walletsPath = join(__dirname, '../test-data/wallets.json');
  if (!existsSync(walletsPath)) {
    throw new Error('❌ Wallets file not found. Run: npx hardhat run scripts/1-generate-wallets-custom.ts first');
  }

  const wallets: WalletInfo[] = JSON.parse(readFileSync(walletsPath, 'utf-8'));
  const [deployer] = await ethers.getSigners();

  console.log(`📍 Network: Sepolia Testnet (Chain ID: ${network.chainId})`);
  console.log(`🔑 Deployer: ${deployer.address}`);
  
  const deployerBalance = await deployer.getBalance();
  console.log(`💰 Deployer Balance: ${ethers.utils.formatEther(deployerBalance)} ETH\n`);

  // Define required ETH amounts for each role
  const requiredAmounts = {
    deployer: '0.5',           // Main deployer (but won't fund itself)
    tokenIssuer: '0.1',        // For token management operations
    tokenAgent: '0.1',         // For freeze/unfreeze operations
    claimIssuer: '0.1',        // For issuing KYC claims
    investor1_alice: '0.05',   // For token transfers
    investor2_bob: '0.05',     // For token transfers
    investor3_charlie: '0.05', // For token transfers
    investor4_david: '0.05',   // For token transfers
    regularUser1: '0.02',      // For failed transfer tests
    regularUser2: '0.02'       // For failed transfer tests
  };

  console.log('🔍 ANALYZING WALLET BALANCES');
  console.log('═'.repeat(100));
  console.log('Role                 | Address                                    | Current    | Required   | Status');
  console.log('═'.repeat(100));

  const fundingRequirements: FundingRequirement[] = [];
  let totalETHNeeded = ethers.BigNumber.from(0);

  // Analyze each wallet
  for (const wallet of wallets) {
    const requiredAmount = requiredAmounts[wallet.role as keyof typeof requiredAmounts] || '0.02';
    const requiredAmountWei = ethers.utils.parseEther(requiredAmount);
    const currentBalance = await ethers.provider.getBalance(wallet.address);
    const currentBalanceETH = ethers.utils.formatEther(currentBalance);

    const needsFunding = currentBalance.lt(requiredAmountWei);
    const amountToSend = needsFunding ? requiredAmountWei.sub(currentBalance) : ethers.BigNumber.from(0);
    const amountToSendETH = ethers.utils.formatEther(amountToSend);

    if (needsFunding) {
      totalETHNeeded = totalETHNeeded.add(amountToSend);
    }

    fundingRequirements.push({
      wallet,
      requiredAmount,
      currentBalance: currentBalanceETH,
      needsFunding,
      amountToSend: amountToSendETH
    });

    const status = needsFunding ? '🔴 NEEDS FUNDING' : '🟢 SUFFICIENT';
    const statusIcon = needsFunding ? '💸' : '✅';
    
    console.log(`${statusIcon} ${wallet.role.padEnd(18)} | ${wallet.address} | ${currentBalanceETH.padStart(8)} | ${requiredAmount.padStart(8)} | ${status}`);
  }

  console.log('═'.repeat(100));

  // Summary
  const walletsNeedingFunding = fundingRequirements.filter(req => req.needsFunding);
  const walletsWithSufficientFunds = fundingRequirements.filter(req => !req.needsFunding);

  console.log('\n📊 FUNDING ANALYSIS SUMMARY');
  console.log('──────────────────────────────');
  console.log(`🟢 Wallets with sufficient ETH: ${walletsWithSufficientFunds.length}`);
  console.log(`🔴 Wallets needing funding: ${walletsNeedingFunding.length}`);
  console.log(`💰 Total ETH required: ${ethers.utils.formatEther(totalETHNeeded)} ETH`);
  console.log(`💳 Deployer current balance: ${ethers.utils.formatEther(deployerBalance)} ETH`);

  // Check if any funding is needed
  if (walletsNeedingFunding.length === 0) {
    console.log('\n🎉 GREAT NEWS! All wallets already have sufficient ETH balances!');
    console.log('✅ No funding required. Ready for deployment!');
    return;
  }

  // Check if deployer has enough ETH
  const gasBuffer = ethers.utils.parseEther('0.02'); // Buffer for gas costs
  const totalRequired = totalETHNeeded.add(gasBuffer);
  
  if (deployerBalance.lt(totalRequired)) {
    console.log('\n❌ INSUFFICIENT DEPLOYER BALANCE');
    console.log(`   Required: ${ethers.utils.formatEther(totalRequired)} ETH (including gas buffer)`);
    console.log(`   Available: ${ethers.utils.formatEther(deployerBalance)} ETH`);
    console.log(`   Shortfall: ${ethers.utils.formatEther(totalRequired.sub(deployerBalance))} ETH`);
    console.log('\n🚰 Get more Sepolia ETH from faucets:');
    console.log('   • https://sepoliafaucet.com/');
    console.log('   • https://www.alchemy.com/faucets/ethereum-sepolia');
    console.log('   • https://faucets.chain.link/sepolia');
    throw new Error('Insufficient deployer balance for funding operation');
  }

  console.log('\n✅ Deployer has sufficient balance for funding operation');

  // Confirm funding operation
  console.log('\n🚀 STARTING INTELLIGENT FUNDING OPERATION');
  console.log('═'.repeat(60));

  let successfulFundings = 0;
  let failedFundings = 0;
  const fundingResults: { role: string; address: string; amount: string; success: boolean; txHash?: string; error?: string }[] = [];

  for (const requirement of walletsNeedingFunding) {
    try {
      console.log(`\n💸 Funding ${requirement.wallet.role}...`);
      console.log(`   Address: ${requirement.wallet.address}`);
      console.log(`   Current: ${requirement.currentBalance} ETH`);
      console.log(`   Sending: ${requirement.amountToSend} ETH`);
      console.log(`   Target: ${requirement.requiredAmount} ETH`);

      const amountToSendWei = ethers.utils.parseEther(requirement.amountToSend);
      
      const tx = await deployer.sendTransaction({
        to: requirement.wallet.address,
        value: amountToSendWei,
        gasLimit: 21000
      });

      console.log(`   📤 Transaction sent: ${tx.hash}`);
      console.log(`   ⏳ Waiting for confirmation...`);

      await tx.wait();
      
      console.log(`   ✅ SUCCESS! Funded ${requirement.wallet.role}`);
      
      successfulFundings++;
      fundingResults.push({
        role: requirement.wallet.role,
        address: requirement.wallet.address,
        amount: requirement.amountToSend,
        success: true,
        txHash: tx.hash
      });

    } catch (error) {
      console.log(`   ❌ FAILED to fund ${requirement.wallet.role}: ${error}`);
      
      failedFundings++;
      fundingResults.push({
        role: requirement.wallet.role,
        address: requirement.wallet.address,
        amount: requirement.amountToSend,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Final verification
  console.log('\n🔍 FINAL BALANCE VERIFICATION');
  console.log('═'.repeat(90));
  console.log('Role                 | Address                                    | Balance    | Required   | Status');
  console.log('═'.repeat(90));

  for (const requirement of fundingRequirements) {
    const finalBalance = await ethers.provider.getBalance(requirement.wallet.address);
    const finalBalanceETH = ethers.utils.formatEther(finalBalance);
    const requiredAmountWei = ethers.utils.parseEther(requirement.requiredAmount);
    const hasEnough = finalBalance.gte(requiredAmountWei);
    const status = hasEnough ? '✅ GOOD' : '⚠️  LOW';
    
    console.log(`${status} ${requirement.wallet.role.padEnd(18)} | ${requirement.wallet.address} | ${finalBalanceETH.padStart(8)} | ${requirement.requiredAmount.padStart(8)} | ${hasEnough ? 'Sufficient' : 'Still low'}`);
  }

  // Final summary
  console.log('\n🎯 FUNDING OPERATION COMPLETE');
  console.log('═'.repeat(50));
  console.log(`✅ Successful fundings: ${successfulFundings}`);
  console.log(`❌ Failed fundings: ${failedFundings}`);
  
  if (successfulFundings > 0) {
    console.log('\n📋 Successful Transactions:');
    fundingResults.filter(r => r.success).forEach(result => {
      console.log(`   • ${result.role}: ${result.amount} ETH (TX: ${result.txHash})`);
      console.log(`     🔗 https://sepolia.etherscan.io/tx/${result.txHash}`);
    });
  }

  if (failedFundings > 0) {
    console.log('\n⚠️  Failed Transactions:');
    fundingResults.filter(r => !r.success).forEach(result => {
      console.log(`   • ${result.role}: ${result.error}`);
    });
  }

  const finalDeployerBalance = await deployer.getBalance();
  console.log(`\n💰 Final deployer balance: ${ethers.utils.formatEther(finalDeployerBalance)} ETH`);
  
  if (failedFundings === 0) {
    console.log('\n🎉 ALL WALLETS SUCCESSFULLY FUNDED!');
    console.log('✅ Ready to proceed with T-REX deployment');
  } else {
    console.log('\n⚠️  Some wallets failed to fund. Check errors above.');
  }
}

// Quick balance check function
async function quickBalanceCheck() {
  console.log('🔍 QUICK SEPOLIA BALANCE CHECK\n');
  
  const walletsPath = join(__dirname, '../test-data/wallets.json');
  if (!existsSync(walletsPath)) {
    throw new Error('❌ Wallets file not found. Generate wallets first.');
  }

  const wallets: WalletInfo[] = JSON.parse(readFileSync(walletsPath, 'utf-8'));
  const requiredAmounts = {
    deployer: '0.5', tokenIssuer: '0.1', tokenAgent: '0.1', claimIssuer: '0.1',
    investor1_alice: '0.05', investor2_bob: '0.05', investor3_charlie: '0.05', investor4_david: '0.05',
    regularUser1: '0.02', regularUser2: '0.02'
  };

  let needsFunding = false;
  
  for (const wallet of wallets) {
    const balance = await ethers.provider.getBalance(wallet.address);
    const balanceETH = ethers.utils.formatEther(balance);
    const required = requiredAmounts[wallet.role as keyof typeof requiredAmounts] || '0.02';
    const hasEnough = parseFloat(balanceETH) >= parseFloat(required);
    
    if (!hasEnough) needsFunding = true;
    
    const status = hasEnough ? '✅' : '🔴';
    console.log(`${status} ${wallet.role.padEnd(18)} | ${balanceETH.padStart(8)} ETH | Required: ${required} ETH`);
  }
  
  console.log(needsFunding ? '\n🔴 Some wallets need funding' : '\n✅ All wallets have sufficient ETH');
}

// Run the script
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'check') {
    quickBalanceCheck()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('❌ Error:', error.message);
        process.exit(1);
      });
  } else {
    fundSepoliaWallets()
      .then(() => {
        console.log('\n✅ Sepolia wallet funding completed!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Error funding wallets:', error.message);
        process.exit(1);
      });
  }
}

export { fundSepoliaWallets, quickBalanceCheck }; 