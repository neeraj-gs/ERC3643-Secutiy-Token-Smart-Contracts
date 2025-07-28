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

interface InvestorIdentity {
  investorAddress: string;
  investorRole: string;
  identityAddress: string;
  country: number;
}

interface TokenDistribution {
  investorAddress: string;
  investorRole: string;
  amountMinted: string;
  transactionHash: string;
  timestamp: string;
}

async function mintAndDistribute() {
  console.log('🪙 Minting and distributing security tokens...\n');

  // Load required data files
  const walletsPath = join(__dirname, '../test-data/wallets.json');
  const contractsPath = join(__dirname, '../test-data/deployed-contracts.json');
  const identitiesPath = join(__dirname, '../test-data/investor-identities.json');

  if (!existsSync(walletsPath)) {
    throw new Error('Wallets file not found. Run 1-generate-wallets.ts first');
  }
  if (!existsSync(contractsPath)) {
    throw new Error('Deployed contracts not found. Run 4-deploy-trex-suite.ts first');
  }
  if (!existsSync(identitiesPath)) {
    throw new Error('Investor identities not found. Run 5-setup-kyc.ts first');
  }

  const wallets: WalletInfo[] = JSON.parse(readFileSync(walletsPath, 'utf-8'));
  const deployedContracts: DeployedContracts = JSON.parse(readFileSync(contractsPath, 'utf-8'));
  const investorIdentities: InvestorIdentity[] = JSON.parse(readFileSync(identitiesPath, 'utf-8'));

  const walletMap = Object.fromEntries(wallets.map(w => [w.role, w]));

  // Get signers
  const tokenAgent = new ethers.Wallet(walletMap.tokenAgent.privateKey, ethers.provider);
  const tokenIssuer = new ethers.Wallet(walletMap.tokenIssuer.privateKey, ethers.provider);

  // Get token contract
  const token = await ethers.getContractAt('Token', deployedContracts.token, tokenAgent);

  console.log(`Token Agent: ${tokenAgent.address}`);
  console.log(`Token Issuer: ${tokenIssuer.address}`);
  console.log(`Token Contract: ${deployedContracts.token}`);
  console.log(`Token Symbol: ${deployedContracts.tokenDetails.symbol}\n`);

  // Check token status
  const isPaused = await token.paused();
  const totalSupply = await token.totalSupply();
  const decimals = await token.decimals();

  console.log(`Token Status: ${isPaused ? 'PAUSED' : 'ACTIVE'}`);
  console.log(`Current Total Supply: ${ethers.utils.formatUnits(totalSupply, decimals)} ${deployedContracts.tokenDetails.symbol}\n`);

  if (isPaused) {
    throw new Error('Token is paused. Cannot mint tokens.');
  }

  // Define distribution amounts (in tokens)
  const distributionPlan = [
    { role: 'investor1_alice', amount: '1000' },   // 1,000 tokens
    { role: 'investor2_bob', amount: '750' },      // 750 tokens  
    { role: 'investor3_charlie', amount: '500' },  // 500 tokens
    { role: 'investor4_david', amount: '250' }     // 250 tokens
  ];

  const distributions: TokenDistribution[] = [];

  console.log('🚀 Starting token distribution...\n');
  console.log('═'.repeat(100));
  console.log('Investor             | Address                                    | Amount         | Status');
  console.log('═'.repeat(100));

  for (const plan of distributionPlan) {
    try {
      // Find investor identity
      const investorIdentity = investorIdentities.find(inv => inv.investorRole === plan.role);
      if (!investorIdentity) {
        console.log(`❌ ${plan.role.padEnd(18)} | Identity not found                         | ${plan.amount.padStart(12)} | SKIPPED`);
        continue;
      }

      const investorAddress = investorIdentity.investorAddress;
      const amountWei = ethers.utils.parseUnits(plan.amount, decimals);

      // Check if investor is eligible (has valid KYC)
      console.log(`   Checking eligibility for ${plan.role}...`);
      const identityRegistry = await ethers.getContractAt('IdentityRegistry', await token.identityRegistry());
      const isVerified = await identityRegistry.isVerified(investorAddress);
      
      if (!isVerified) {
        console.log(`❌ ${plan.role.padEnd(18)} | ${investorAddress} | ${plan.amount.padStart(12)} | NOT_VERIFIED`);
        continue;
      }

      // Mint tokens to investor
      console.log(`   Minting ${plan.amount} tokens to ${plan.role}...`);
      const mintTx = await token.connect(tokenAgent).mint(investorAddress, amountWei);
      const receipt = await mintTx.wait();

      console.log(`✅ ${plan.role.padEnd(18)} | ${investorAddress} | ${plan.amount.padStart(12)} | SUCCESS`);
      console.log(`   Transaction: ${mintTx.hash}`);
      console.log(`   Gas used: ${receipt.gasUsed.toString()}\n`);

      distributions.push({
        investorAddress,
        investorRole: plan.role,
        amountMinted: plan.amount,
        transactionHash: mintTx.hash,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.log(`❌ ${plan.role.padEnd(18)} | Error minting tokens                       | ${plan.amount.padStart(12)} | ERROR`);
      console.error(`   Error details:`, error);
    }
  }

  console.log('═'.repeat(100));

  // Get final token statistics
  const finalTotalSupply = await token.totalSupply();
  const formattedTotalSupply = ethers.utils.formatUnits(finalTotalSupply, decimals);

  console.log('\n📊 Distribution Summary:');
  console.log('═'.repeat(60));
  console.log(`Total tokens distributed: ${distributions.length}`);
  console.log(`Total supply after minting: ${formattedTotalSupply} ${deployedContracts.tokenDetails.symbol}`);
  console.log(`Network: ${deployedContracts.network}`);

  // Show individual balances
  console.log('\n💰 Final Token Balances:');
  console.log('═'.repeat(90));
  console.log('Investor             | Address                                    | Balance');
  console.log('═'.repeat(90));

  for (const distribution of distributions) {
    try {
      const balance = await token.balanceOf(distribution.investorAddress);
      const formattedBalance = ethers.utils.formatUnits(balance, decimals);
      console.log(`${distribution.investorRole.padEnd(18)} | ${distribution.investorAddress} | ${formattedBalance.padStart(12)} ${deployedContracts.tokenDetails.symbol}`);
    } catch (error) {
      console.log(`${distribution.investorRole.padEnd(18)} | ${distribution.investorAddress} | ERROR`);
    }
  }

  // Save distribution data
  console.log('\n💾 Saving distribution data...');
  const distributionPath = join(__dirname, '../test-data/token-distribution.json');
  const distributionData = {
    tokenAddress: deployedContracts.token,
    tokenSymbol: deployedContracts.tokenDetails.symbol,
    totalDistributed: distributions.reduce((sum, d) => sum + parseFloat(d.amountMinted), 0).toString(),
    distributionCount: distributions.length,
    timestamp: new Date().toISOString(),
    network: deployedContracts.network,
    distributions
  };

  writeFileSync(distributionPath, JSON.stringify(distributionData, null, 2));
  console.log(`   Distribution data saved to: ${distributionPath}`);

  // Test a failed transfer (to non-KYC address)
  console.log('\n🧪 Testing compliance: Attempting transfer to non-KYC address...');
  try {
    const nonKycAddress = walletMap.regularUser1.address;
    const testAmount = ethers.utils.parseUnits('10', decimals);
    
    // This should fail due to compliance rules
    const aliceWallet = new ethers.Wallet(walletMap.investor1_alice.privateKey, ethers.provider);
    const tokenAsAlice = token.connect(aliceWallet);
    
    console.log(`   Trying to transfer 10 tokens from Alice to ${nonKycAddress}...`);
    await tokenAsAlice.transfer(nonKycAddress, testAmount);
    console.log('   ❌ Transfer succeeded (this should not happen!)');
  } catch (error) {
    console.log('   ✅ Transfer failed as expected (compliance working)');
    console.log(`   Error: ${error.reason || 'Transaction reverted'}`);
  }

  console.log('\n🎉 Token Distribution Complete!');
  console.log('═'.repeat(60));
  console.log(`Successfully distributed tokens to ${distributions.length} investors`);
  console.log(`Total supply: ${formattedTotalSupply} ${deployedContracts.tokenDetails.symbol}`);
  console.log(`Token contract: ${deployedContracts.token}`);
  console.log('═'.repeat(60));

  console.log('\n📋 Next Steps:');
  console.log('1. Run: npx hardhat run scripts/7-test-transfers.ts --network <network>');
  console.log('2. Run: npx hardhat run scripts/3-check-balances.ts --network <network>');

  return distributions;
}

// Function to check if an address can receive tokens
async function checkTransferEligibility(fromAddress: string, toAddress: string, amount: string) {
  console.log(`🔍 Checking transfer eligibility...`);
  console.log(`From: ${fromAddress}`);
  console.log(`To: ${toAddress}`);
  console.log(`Amount: ${amount}`);

  const contractsPath = join(__dirname, '../test-data/deployed-contracts.json');
  if (!existsSync(contractsPath)) {
    throw new Error('Deployed contracts not found');
  }

  const deployedContracts: DeployedContracts = JSON.parse(readFileSync(contractsPath, 'utf-8'));
  const token = await ethers.getContractAt('Token', deployedContracts.token);
  const identityRegistry = await ethers.getContractAt('IdentityRegistry', await token.identityRegistry());
  const compliance = await ethers.getContractAt('ModularCompliance', await token.compliance());

  try {
    // Check if both addresses are verified
    const fromVerified = await identityRegistry.isVerified(fromAddress);
    const toVerified = await identityRegistry.isVerified(toAddress);
    
    console.log(`From address verified: ${fromVerified}`);
    console.log(`To address verified: ${toVerified}`);

    if (!fromVerified || !toVerified) {
      console.log('❌ Transfer not allowed: One or both parties not KYC verified');
      return false;
    }

    // Check compliance
    const amountWei = ethers.utils.parseUnits(amount, await token.decimals());
    const canTransfer = await compliance.canTransfer(fromAddress, toAddress, amountWei);
    
    console.log(`Compliance check: ${canTransfer ? 'PASS' : 'FAIL'}`);
    return canTransfer;

  } catch (error) {
    console.error('Error checking eligibility:', error);
    return false;
  }
}

// Run the script
if (require.main === module) {
  const mode = process.argv[2];
  
  if (mode === 'check') {
    const fromAddress = process.argv[3];
    const toAddress = process.argv[4];
    const amount = process.argv[5] || '10';
    
    if (!fromAddress || !toAddress) {
      console.error('Usage: npm run mint check <fromAddress> <toAddress> [amount]');
      process.exit(1);
    }
    
    checkTransferEligibility(fromAddress, toAddress, amount)
      .then((canTransfer) => {
        console.log(`\nResult: ${canTransfer ? 'Transfer allowed' : 'Transfer blocked'}`);
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Error checking transfer eligibility:', error);
        process.exit(1);
      });
  } else {
    mintAndDistribute()
      .then(() => {
        console.log('\n✅ Minting and distribution completed successfully!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Error during minting and distribution:', error);
        process.exit(1);
      });
  }
}

export { mintAndDistribute, checkTransferEligibility }; 