import { ethers } from 'hardhat';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface WalletInfo {
  role: string;
  address: string;
  privateKey: string;
  mnemonic?: string;
}

async function fundWallets(networkName: string = 'hardhat') {
  console.log(`💰 Funding wallets on ${networkName} network...\n`);

  // Load wallets
  const walletsPath = join(__dirname, '../test-data/wallets.json');
  if (!existsSync(walletsPath)) {
    throw new Error('Wallets file not found. Run 1-generate-wallets.ts first');
  }

  const wallets: WalletInfo[] = JSON.parse(readFileSync(walletsPath, 'utf-8'));
  const [deployer] = await ethers.getSigners();

  console.log(`Deployer address: ${deployer.address}`);
  console.log(`Deployer balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH\n`);

  if (networkName === 'hardhat') {
    console.log('ℹ️  On Hardhat network, wallets are pre-funded automatically');
    return;
  }

  // Define funding amounts based on role
  const fundingAmounts = {
    deployer: '0.5',      // Main deployer needs more for contract deployments
    tokenIssuer: '0.1',   // Needs ETH for token operations
    tokenAgent: '0.1',    // Needs ETH for agent operations
    claimIssuer: '0.1',   // Needs ETH for claim issuance
    investor1_alice: '0.05',   // Minimal ETH for transaction fees
    investor2_bob: '0.05',     // Minimal ETH for transaction fees
    investor3_charlie: '0.05', // Minimal ETH for transaction fees
    investor4_david: '0.05',   // Minimal ETH for transaction fees
    regularUser1: '0.02',      // Very minimal for testing
    regularUser2: '0.02'       // Very minimal for testing
  };

  // Check current balances and determine what needs funding
  console.log('📊 Checking current wallet balances...\n');
  
  const walletsToFund: { wallet: WalletInfo; amount: string; currentBalance: string }[] = [];
  const walletsToSkip: { wallet: WalletInfo; amount: string; currentBalance: string }[] = [];
  
  for (const wallet of wallets) {
    const requiredAmount = fundingAmounts[wallet.role as keyof typeof fundingAmounts] || '0.02';
    const requiredAmountWei = ethers.utils.parseEther(requiredAmount);
    const currentBalance = await ethers.provider.getBalance(wallet.address);
    const currentBalanceEth = ethers.utils.formatEther(currentBalance);
    
    if (currentBalance.lt(requiredAmountWei)) {
      // Needs funding
      walletsToFund.push({
        wallet,
        amount: requiredAmount,
        currentBalance: currentBalanceEth
      });
      console.log(`💸 ${wallet.role.padEnd(20)} | ${wallet.address} | Current: ${currentBalanceEth} ETH | Needs: ${requiredAmount} ETH`);
    } else {
      // Already has enough
      walletsToSkip.push({
        wallet,
        amount: requiredAmount,
        currentBalance: currentBalanceEth
      });
      console.log(`✅ ${wallet.role.padEnd(20)} | ${wallet.address} | Current: ${currentBalanceEth} ETH | Required: ${requiredAmount} ETH | SKIP`);
    }
  }

  if (walletsToFund.length === 0) {
    console.log('\n🎉 All wallets already have sufficient ETH balances!');
    console.log('No funding needed.');
    return;
  }

  // Calculate actual total required (only for wallets that need funding)
  let actualTotalRequired = ethers.BigNumber.from(0);
  for (const item of walletsToFund) {
    const currentBalance = ethers.utils.parseEther(item.currentBalance);
    const requiredAmount = ethers.utils.parseEther(item.amount);
    const amountToSend = requiredAmount.sub(currentBalance);
    actualTotalRequired = actualTotalRequired.add(amountToSend);
  }

  console.log(`\n📋 FUNDING SUMMARY:`);
  console.log(`Wallets to fund: ${walletsToFund.length}`);
  console.log(`Wallets to skip: ${walletsToSkip.length}`);
  console.log(`Actual ETH required: ${ethers.utils.formatEther(actualTotalRequired)} ETH`);
  
  const deployerBalance = await deployer.getBalance();
  if (deployerBalance.lt(actualTotalRequired)) {
    throw new Error(`Insufficient deployer balance. Need ${ethers.utils.formatEther(actualTotalRequired)} ETH but have ${ethers.utils.formatEther(deployerBalance)} ETH`);
  }

  console.log('\n🚀 Starting smart wallet funding...\n');

  for (const item of walletsToFund) {
    try {
      const currentBalance = ethers.utils.parseEther(item.currentBalance);
      const requiredAmount = ethers.utils.parseEther(item.amount);
      const amountToSend = requiredAmount.sub(currentBalance);

      if (amountToSend.lte(0)) {
        console.log(`⏭️  ${item.wallet.role.padEnd(20)} | Already sufficient balance`);
        continue;
      }

      const tx = await deployer.sendTransaction({
        to: item.wallet.address,
        value: amountToSend,
        gasLimit: 21000
      });

      await tx.wait();

      console.log(`✅ ${item.wallet.role.padEnd(20)} | ${item.wallet.address} | +${ethers.utils.formatEther(amountToSend)} ETH | TX: ${tx.hash}`);
    } catch (error) {
      console.error(`❌ Failed to fund ${item.wallet.role}: ${error}`);
    }
  }

  console.log('\n💰 Smart wallet funding completed!');
  
  // Verify final balances
  console.log('\n📊 Final balances verification:');
  console.log('═'.repeat(90));
  
  for (const wallet of wallets) {
    const balance = await ethers.provider.getBalance(wallet.address);
    const balanceEth = ethers.utils.formatEther(balance);
    const requiredAmount = fundingAmounts[wallet.role as keyof typeof fundingAmounts] || '0.02';
    const hasEnough = parseFloat(balanceEth) >= parseFloat(requiredAmount);
    const status = hasEnough ? '✅' : '⚠️';
    
    console.log(`${status} ${wallet.role.padEnd(20)} | ${wallet.address} | ${balanceEth} ETH | Required: ${requiredAmount} ETH`);
  }
}

// For Sepolia testnet, provide instructions
async function provideFundingInstructions() {
  console.log('\n🚰 Sepolia Testnet Funding Instructions:');
  console.log('═'.repeat(60));
  console.log('1. Get Sepolia ETH from faucets:');
  console.log('   • https://sepoliafaucet.com/');
  console.log('   • https://faucet.sepolia.dev/');
  console.log('   • https://sepolia-faucet.pk910.de/');
  console.log('   • https://www.alchemy.com/faucets/ethereum-sepolia');
  console.log('\n2. Send ETH to your deployer address first');
  console.log('3. Then run this script to distribute to other wallets');
  console.log('\n⚠️  You need at least 1 ETH in deployer wallet for all operations');
}

// Run the script
if (require.main === module) {
  const networkName = process.argv[2] || 'hardhat';
  
  if (networkName === 'sepolia') {
    provideFundingInstructions();
  }
  
  fundWallets(networkName)
    .then(() => {
      console.log('\n✅ Funding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error funding wallets:', error);
      process.exit(1);
    });
}

export { fundWallets }; 