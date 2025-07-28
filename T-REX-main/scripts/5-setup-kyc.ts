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
  identityRegistry: string;
  identityRegistryStorage: string;
  claimTopicsRegistry: string;
  trustedIssuersRegistry: string;
  compliance: string;
  tokenOnchainID: string;
  claimIssuerContract: string;
  identityImplementationAuthority: string;
  claimTopics: string[];
  network: string;
}

interface InvestorIdentity {
  investorAddress: string;
  investorRole: string;
  identityAddress: string;
  country: number;
  claims: Array<{
    topic: string;
    signature: string;
    data: string;
  }>;
}

async function deployIdentityProxy(
  implementationAuthority: string,
  managementKey: string,
  signer: any
): Promise<any> {
  const OnchainID = require('@onchain-id/solidity');
  const identity = await new ethers.ContractFactory(
    OnchainID.contracts.IdentityProxy.abi,
    OnchainID.contracts.IdentityProxy.bytecode,
    signer
  ).deploy(implementationAuthority, managementKey);
  
  await identity.deployed();
  return ethers.getContractAt('Identity', identity.address, signer);
}

async function setupKYC() {
  console.log('🆔 Setting up KYC claims for investors...\n');

  // Load wallets
  const walletsPath = join(__dirname, '../test-data/wallets.json');
  if (!existsSync(walletsPath)) {
    throw new Error('Wallets file not found. Run 1-generate-wallets.ts first');
  }

  // Load deployed contracts
  const contractsPath = join(__dirname, '../test-data/deployed-contracts.json');
  if (!existsSync(contractsPath)) {
    throw new Error('Deployed contracts not found. Run 4-deploy-trex-suite.ts first');
  }

  // Load claim issuer signing key
  const signingKeyPath = join(__dirname, '../test-data/claim-issuer-signing-key.json');
  if (!existsSync(signingKeyPath)) {
    throw new Error('Claim issuer signing key not found. Run 4-deploy-trex-suite.ts first');
  }

  const wallets: WalletInfo[] = JSON.parse(readFileSync(walletsPath, 'utf-8'));
  const deployedContracts: DeployedContracts = JSON.parse(readFileSync(contractsPath, 'utf-8'));
  const signingKeyData = JSON.parse(readFileSync(signingKeyPath, 'utf-8'));

  const walletMap = Object.fromEntries(wallets.map(w => [w.role, w]));

  // Get signers
  const claimIssuer = new ethers.Wallet(walletMap.claimIssuer.privateKey, ethers.provider);
  const claimIssuerSigningKey = new ethers.Wallet(signingKeyData.privateKey, ethers.provider);
  const tokenAgent = new ethers.Wallet(walletMap.tokenAgent.privateKey, ethers.provider);

  // Get contracts
  const identityRegistry = await ethers.getContractAt('IdentityRegistry', deployedContracts.identityRegistry);
  const claimIssuerContract = await ethers.getContractAt('ClaimIssuer', deployedContracts.claimIssuerContract);

  console.log(`Claim Issuer: ${claimIssuer.address}`);
  console.log(`Token Agent: ${tokenAgent.address}`);
  console.log(`Identity Registry: ${deployedContracts.identityRegistry}\n`);

  // Investors to set up KYC for
  const investors = [
    { role: 'investor1_alice', country: 840 },   // USA
    { role: 'investor2_bob', country: 826 },     // UK
    { role: 'investor3_charlie', country: 250 }, // France
    { role: 'investor4_david', country: 276 }    // Germany
  ];

  const investorIdentities: InvestorIdentity[] = [];

  console.log('🚀 Setting up identities and KYC claims...\n');

  for (const investor of investors) {
    try {
      console.log(`📋 Processing ${investor.role}...`);
      
      const investorWallet = new ethers.Wallet(walletMap[investor.role].privateKey, ethers.provider);
      
      // 1. Deploy ONCHAINID for investor
      console.log(`   Deploying ONCHAINID for ${investor.role}...`);
      const investorIdentity = await deployIdentityProxy(
        deployedContracts.identityImplementationAuthority,
        investorWallet.address,
        investorWallet
      );

      // 2. Create KYC claim
      console.log(`   Creating KYC claim for ${investor.role}...`);
      const claimTopic = deployedContracts.claimTopics[0]; // KYC_CLAIM topic
      
      const claimData = ethers.utils.hexlify(
        ethers.utils.toUtf8Bytes(
          JSON.stringify({
            type: 'KYC',
            country: investor.country,
            verified: true,
            timestamp: Math.floor(Date.now() / 1000),
            issuer: 'T-REX Test KYC Provider'
          })
        )
      );

      // Sign the claim
      const claimSignature = await claimIssuerSigningKey.signMessage(
        ethers.utils.arrayify(
          ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
              ['address', 'uint256', 'bytes'],
              [investorIdentity.address, claimTopic, claimData]
            )
          )
        )
      );

      // 3. Add claim to investor's ONCHAINID
      console.log(`   Adding claim to ${investor.role}'s ONCHAINID...`);
      await investorIdentity
        .connect(investorWallet)
        .addClaim(
          claimTopic,
          1, // ECDSA signature scheme
          claimIssuerContract.address,
          claimSignature,
          claimData,
          ''
        );

      // 4. Register identity in the registry
      console.log(`   Registering ${investor.role} in Identity Registry...`);
      await identityRegistry
        .connect(tokenAgent)
        .registerIdentity(
          investorWallet.address,
          investorIdentity.address,
          investor.country
        );

      console.log(`   ✅ ${investor.role} KYC setup complete`);
      console.log(`      Address: ${investorWallet.address}`);
      console.log(`      Identity: ${investorIdentity.address}`);
      console.log(`      Country: ${investor.country}\n`);

      investorIdentities.push({
        investorAddress: investorWallet.address,
        investorRole: investor.role,
        identityAddress: investorIdentity.address,
        country: investor.country,
        claims: [{
          topic: claimTopic.toString(),
          signature: claimSignature,
          data: claimData
        }]
      });

    } catch (error) {
      console.error(`   ❌ Failed to setup KYC for ${investor.role}:`, error);
    }
  }

  // 5. Save investor identities data
  console.log('💾 Saving investor identities data...');
  const identitiesPath = join(__dirname, '../test-data/investor-identities.json');
  writeFileSync(identitiesPath, JSON.stringify(investorIdentities, null, 2));
  console.log(`   Investor identities saved to: ${identitiesPath}`);

  // 6. Verify all identities are registered
  console.log('\n🔍 Verifying identity registrations...');
  console.log('═'.repeat(90));
  console.log('Role                 | Address                                    | Registered | Country');
  console.log('═'.repeat(90));

  for (const investorIdentity of investorIdentities) {
    try {
      const isRegistered = await identityRegistry.contains(investorIdentity.investorAddress);
      const identity = await identityRegistry.identity(investorIdentity.investorAddress);
      const country = await identityRegistry.investorCountry(investorIdentity.investorAddress);
      
      const status = isRegistered ? '✅' : '❌';
      console.log(
        `${status} ${investorIdentity.investorRole.padEnd(18)} | ${investorIdentity.investorAddress} | ${isRegistered ? 'YES' : 'NO'.padStart(8)} | ${country.toString().padStart(7)}`
      );
    } catch (error) {
      console.log(`❌ ${investorIdentity.investorRole.padEnd(18)} | ${investorIdentity.investorAddress} | ERROR    | ERROR`);
    }
  }

  console.log('\n🎉 KYC Setup Complete!');
  console.log('═'.repeat(50));
  console.log(`Total investors with KYC: ${investorIdentities.length}`);
  console.log(`Claim issuer: ${claimIssuer.address}`);
  console.log(`KYC claim topic: ${deployedContracts.claimTopics[0]}`);
  console.log('═'.repeat(50));

  console.log('\n📋 Next Steps:');
  console.log('1. Run: npx hardhat run scripts/6-mint-and-distribute.ts --network <network>');
  console.log('2. Run: npx hardhat run scripts/7-test-transfers.ts --network <network>');

  return investorIdentities;
}

// Function to verify a specific claim
async function verifyClaim(investorAddress: string, claimTopic: string) {
  console.log(`🔍 Verifying claim for ${investorAddress}...`);
  
  const contractsPath = join(__dirname, '../test-data/deployed-contracts.json');
  if (!existsSync(contractsPath)) {
    throw new Error('Deployed contracts not found');
  }

  const deployedContracts: DeployedContracts = JSON.parse(readFileSync(contractsPath, 'utf-8'));
  const identityRegistry = await ethers.getContractAt('IdentityRegistry', deployedContracts.identityRegistry);
  
  try {
    const isRegistered = await identityRegistry.contains(investorAddress);
    console.log(`Registered: ${isRegistered}`);
    
    if (isRegistered) {
      const identity = await identityRegistry.identity(investorAddress);
      const country = await identityRegistry.investorCountry(investorAddress);
      console.log(`Identity contract: ${identity}`);
      console.log(`Country: ${country}`);
      
      // Check if investor can receive tokens
      const isVerified = await identityRegistry.isVerified(investorAddress);
      console.log(`KYC verified: ${isVerified}`);
    }
  } catch (error) {
    console.error('Error verifying claim:', error);
  }
}

// Run the script
if (require.main === module) {
  const mode = process.argv[2];
  const targetAddress = process.argv[3];
  const claimTopic = process.argv[4];

  if (mode === 'verify' && targetAddress) {
    verifyClaim(targetAddress, claimTopic || '')
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('❌ Error verifying claim:', error);
        process.exit(1);
      });
  } else {
    setupKYC()
      .then(() => {
        console.log('\n✅ KYC setup completed successfully!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Error setting up KYC:', error);
        process.exit(1);
      });
  }
}

export { setupKYC, verifyClaim }; 