import { ethers } from 'hardhat';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface WalletInfo {
  role: string;
  address: string;
  privateKey: string;
  mnemonic?: string;
}

async function generateWalletsWithCustomDeployer() {
  console.log('🔑 Generating wallets with custom deployer for ERC-3643 token deployment...\n');

  const wallets: WalletInfo[] = [];

  // Use the specific deployer address provided by user
  // Note: You need to provide the private key for this address
  const CUSTOM_DEPLOYER_ADDRESS = '0x38498f498f8679c1f43A08891192e2F5e728a1bB';
  
  console.log('⚠️  IMPORTANT: Please provide the private key for your deployer address');
  console.log(`Deployer Address: ${CUSTOM_DEPLOYER_ADDRESS}`);
  console.log('Add DEPLOYER_PRIVATE_KEY to your .env file\n');

  // Add custom deployer (private key will come from env)
  wallets.push({
    role: 'deployer',
    address: CUSTOM_DEPLOYER_ADDRESS,
    privateKey: 'FROM_ENV_FILE', // Will be replaced with actual private key from .env
    mnemonic: 'N/A - Custom Address'
  });

  // Generate other roles with random wallets
  const otherRoles = [
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

  for (const role of otherRoles) {
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
  
  // Generate .env template with custom deployer
  const envTemplate = `# Sepolia RPC URL - Get from Infura, Alchemy, or other provider
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161

# Your custom deployer private key (for address ${CUSTOM_DEPLOYER_ADDRESS})
PRIVATE_KEY=YOUR_PRIVATE_KEY_FOR_${CUSTOM_DEPLOYER_ADDRESS}
DEPLOYER_PRIVATE_KEY=YOUR_PRIVATE_KEY_FOR_${CUSTOM_DEPLOYER_ADDRESS}

# Gas settings for Sepolia
GAS_PRICE=20000000000
GAS_LIMIT=8000000

# Etherscan API key for contract verification (optional)
ETHERSCAN_API_KEY=your_etherscan_api_key_here
`;

  const envPath = join(__dirname, '../.env.custom');
  writeFileSync(envPath, envTemplate);
  
  console.log(`📝 Custom environment template saved to: ${envPath}`);
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Copy .env.custom to .env');
  console.log(`2. Add your private key for ${CUSTOM_DEPLOYER_ADDRESS}`);
  console.log('3. Verify you have Sepolia ETH in this address');
  
  // Print summary
  console.log('\n📊 Generated Wallets Summary:');
  console.log('═'.repeat(80));
  console.log('Role                 | Address                                    | Purpose');
  console.log('═'.repeat(80));
  
  const descriptions = {
    deployer: 'YOUR CUSTOM ADDRESS - Deploys all contracts',
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
  console.log('• Your deployer address contains real Sepolia ETH');
  console.log('• Keep your private key secure and never share it');
  console.log('• Other wallets are test-only and will be funded from deployer');
  
  return wallets;
}

// Run the script
if (require.main === module) {
  generateWalletsWithCustomDeployer()
    .then(() => {
      console.log('\n✅ Custom wallet generation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error generating wallets:', error);
      process.exit(1);
    });
}

export { generateWalletsWithCustomDeployer }; 