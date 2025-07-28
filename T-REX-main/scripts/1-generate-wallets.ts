import { ethers } from 'hardhat';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface WalletInfo {
  role: string;
  address: string;
  privateKey: string;
  mnemonic?: string;
}

async function generateWallets() {
  console.log('🔑 Generating wallets for ERC-3643 token deployment and testing...\n');

  const wallets: WalletInfo[] = [];

  // Generate wallets for different roles
  const roles = [
    'deployer',
    'tokenIssuer', 
    'tokenAgent',
    'claimIssuer',
    'investor1_alice',
    'investor2_bob',
    'investor3_charlie',
    'investor4_david',
    'regularUser1',
    'regularUser2'
  ];

  for (const role of roles) {
    const wallet = ethers.Wallet.createRandom();
    
    wallets.push({
      role,
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase
    });

    console.log(`${role.padEnd(20)} | ${wallet.address} | ${wallet.privateKey}`);
  }

  // Create output directory if it doesn't exist
  const outputDir = join(__dirname, '../test-data');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Save to JSON file
  const outputPath = join(outputDir, 'wallets.json');
  writeFileSync(outputPath, JSON.stringify(wallets, null, 2));

  console.log(`\n💾 Wallets saved to: ${outputPath}`);
  
  // Generate .env template
  const envTemplate = `# Sepolia RPC URL - Get from Infura, Alchemy, or other provider
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR-PROJECT-ID

# Main deployer private key (${wallets[0].role})
PRIVATE_KEY=${wallets[0].privateKey}

# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here
`;

  const envPath = join(__dirname, '../.env.template');
  writeFileSync(envPath, envTemplate);
  
  console.log(`📝 Environment template saved to: ${envPath}`);
  console.log('\n📋 Copy .env.template to .env and update with your actual values');
  
  // Print summary
  console.log('\n📊 Generated Wallets Summary:');
  console.log('═'.repeat(80));
  console.log('Role                 | Address                                    | Purpose');
  console.log('═'.repeat(80));
  
  const descriptions = {
    deployer: 'Deploys all contracts and factory',
    tokenIssuer: 'Issues and manages the security token',
    tokenAgent: 'Agent for token operations (mint/burn)',
    claimIssuer: 'Issues KYC claims for investors',
    investor1_alice: 'Test investor 1 (will receive tokens)',
    investor2_bob: 'Test investor 2 (will receive tokens)',
    investor3_charlie: 'Test investor 3 (for transfer testing)',
    investor4_david: 'Test investor 4 (for compliance testing)',
    regularUser1: 'Non-KYC user (should fail to receive tokens)',
    regularUser2: 'Non-KYC user (for negative testing)'
  };

  wallets.forEach((wallet) => {
    console.log(`${wallet.role.padEnd(20)} | ${wallet.address} | ${descriptions[wallet.role as keyof typeof descriptions] || 'General testing'}`);
  });

  console.log('\n⚠️  SECURITY WARNING:');
  console.log('• These are test wallets only - DO NOT use for mainnet');
  console.log('• Keep private keys secure');
  console.log('• Fund only the deployer wallet with Sepolia ETH for deployment');
  
  return wallets;
}

// Run the script
if (require.main === module) {
  generateWallets()
    .then(() => {
      console.log('\n✅ Wallet generation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error generating wallets:', error);
      process.exit(1);
    });
}

export { generateWallets }; 