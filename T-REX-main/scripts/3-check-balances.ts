import { ethers } from 'hardhat';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface WalletInfo {
  role: string;
  address: string;
  privateKey: string;
  mnemonic?: string;
}

async function checkBalances() {
  console.log('💰 Checking wallet balances...\n');

  // Load wallets
  const walletsPath = join(__dirname, '../test-data/wallets.json');
  if (!existsSync(walletsPath)) {
    throw new Error('Wallets file not found. Run 1-generate-wallets.ts first');
  }

  const wallets: WalletInfo[] = JSON.parse(readFileSync(walletsPath, 'utf-8'));
  const network = await ethers.provider.getNetwork();

  console.log(`📊 Network: ${network.name} (Chain ID: ${network.chainId})\n`);
  console.log('═'.repeat(90));
  console.log('Role                 | Address                                    | ETH Balance      | Token Balance');
  console.log('═'.repeat(90));

  let totalEthBalance = ethers.BigNumber.from(0);
  
  // Check if deployed contracts exist
  let tokenContract: any = null;
  const deployedContractsPath = join(__dirname, '../test-data/deployed-contracts.json');
  
  if (existsSync(deployedContractsPath)) {
    try {
      const deployedContracts = JSON.parse(readFileSync(deployedContractsPath, 'utf-8'));
      tokenContract = await ethers.getContractAt('Token', deployedContracts.token);
      console.log(`🪙 Token contract found: ${deployedContracts.token}`);
    } catch (error) {
      console.log('ℹ️  No token contract deployed yet');
    }
  }

  for (const wallet of wallets) {
    try {
      // Get ETH balance
      const ethBalance = await ethers.provider.getBalance(wallet.address);
      const ethBalanceFormatted = ethers.utils.formatEther(ethBalance);
      totalEthBalance = totalEthBalance.add(ethBalance);

      // Get token balance if token contract exists
      let tokenBalanceFormatted = 'N/A';
      if (tokenContract) {
        try {
          const tokenBalance = await tokenContract.balanceOf(wallet.address);
          tokenBalanceFormatted = ethers.utils.formatUnits(tokenBalance, await tokenContract.decimals());
        } catch (error) {
          tokenBalanceFormatted = 'Error';
        }
      }

      const status = ethBalance.gt(0) ? '✅' : '❌';
      console.log(`${status} ${wallet.role.padEnd(18)} | ${wallet.address} | ${ethBalanceFormatted.padStart(14)} | ${tokenBalanceFormatted.padStart(12)}`);
      
    } catch (error) {
      console.log(`❌ ${wallet.role.padEnd(18)} | ${wallet.address} | Error checking balance`);
    }
  }

  console.log('═'.repeat(90));
  console.log(`Total ETH across all wallets: ${ethers.utils.formatEther(totalEthBalance)} ETH`);

  // Check if any wallets need funding
  const unfundedWallets = [];
  for (const wallet of wallets) {
    const balance = await ethers.provider.getBalance(wallet.address);
    if (balance.eq(0)) {
      unfundedWallets.push(wallet.role);
    }
  }

  if (unfundedWallets.length > 0) {
    console.log(`\n⚠️  Unfunded wallets: ${unfundedWallets.join(', ')}`);
    console.log('Run: npx hardhat run scripts/2-fund-wallets.ts');
  } else {
    console.log('\n✅ All wallets are funded!');
  }

  // Show deployment status
  if (existsSync(deployedContractsPath)) {
    console.log('\n📋 Deployment Status:');
    try {
      const deployedContracts = JSON.parse(readFileSync(deployedContractsPath, 'utf-8'));
      console.log('✅ T-REX contracts deployed');
      console.log(`   Token: ${deployedContracts.token}`);
      console.log(`   Identity Registry: ${deployedContracts.identityRegistry}`);
      console.log(`   Compliance: ${deployedContracts.compliance}`);
    } catch (error) {
      console.log('❌ Error reading deployment data');
    }
  } else {
    console.log('\n📋 T-REX contracts not deployed yet');
    console.log('Run: npx hardhat run scripts/4-deploy-trex-suite.ts');
  }
}

// Quick balance check for specific address
async function checkSingleBalance(address: string) {
  console.log(`💰 Checking balance for ${address}...\n`);
  
  const ethBalance = await ethers.provider.getBalance(address);
  console.log(`ETH Balance: ${ethers.utils.formatEther(ethBalance)} ETH`);
  
  // Check if it's a deployed token
  const deployedContractsPath = join(__dirname, '../test-data/deployed-contracts.json');
  if (existsSync(deployedContractsPath)) {
    try {
      const deployedContracts = JSON.parse(readFileSync(deployedContractsPath, 'utf-8'));
      const tokenContract = await ethers.getContractAt('Token', deployedContracts.token);
      const tokenBalance = await tokenContract.balanceOf(address);
      const tokenSymbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();
      
      console.log(`${tokenSymbol} Balance: ${ethers.utils.formatUnits(tokenBalance, decimals)} ${tokenSymbol}`);
    } catch (error) {
      console.log('Token balance: N/A');
    }
  }
}

// Run the script
if (require.main === module) {
  const targetAddress = process.argv[2];
  
  if (targetAddress) {
    checkSingleBalance(targetAddress)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('❌ Error checking balance:', error);
        process.exit(1);
      });
  } else {
    checkBalances()
      .then(() => {
        console.log('\n✅ Balance check completed successfully!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Error checking balances:', error);
        process.exit(1);
      });
  }
}

export { checkBalances, checkSingleBalance }; 