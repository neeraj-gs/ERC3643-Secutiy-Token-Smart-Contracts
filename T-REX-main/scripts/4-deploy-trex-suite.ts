import { ethers } from 'hardhat';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import OnchainID from '@onchain-id/solidity';

interface WalletInfo {
  role: string;
  address: string;
  privateKey: string;
  mnemonic?: string;
}

interface DeployedContracts {
  // Implementation contracts
  tokenImplementation: string;
  identityRegistryImplementation: string;
  identityRegistryStorageImplementation: string;
  claimTopicsRegistryImplementation: string;
  trustedIssuersRegistryImplementation: string;
  modularComplianceImplementation: string;
  identityImplementation: string;
  
  // Authority contracts
  trexImplementationAuthority: string;
  identityImplementationAuthority: string;
  
  // Factory contracts
  identityFactory: string;
  trexFactory: string;
  
  // Token suite contracts
  token: string;
  identityRegistry: string;
  identityRegistryStorage: string;
  claimTopicsRegistry: string;
  trustedIssuersRegistry: string;
  compliance: string;
  
  // Identity contracts
  tokenOnchainID: string;
  claimIssuerContract: string;
  
  // Additional info
  tokenDetails: {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
  };
  
  claimTopics: string[];
  deploymentTime: string;
  network: string;
}

async function deployIdentityProxy(
  implementationAuthority: string, 
  managementKey: string, 
  signer: any
): Promise<any> {
  const identity = await new ethers.ContractFactory(
    OnchainID.contracts.IdentityProxy.abi,
    OnchainID.contracts.IdentityProxy.bytecode,
    signer
  ).deploy(implementationAuthority, managementKey);
  
  await identity.deployed();
  return ethers.getContractAt('Identity', identity.address, signer);
}

async function deployTREXSuite() {
  console.log('🚀 Deploying complete T-REX (ERC-3643) suite...\n');

  // Load wallets
  const walletsPath = join(__dirname, '../test-data/wallets.json');
  if (!existsSync(walletsPath)) {
    throw new Error('Wallets file not found. Run 1-generate-wallets.ts first');
  }

  const wallets: WalletInfo[] = JSON.parse(readFileSync(walletsPath, 'utf-8'));
  const walletMap = Object.fromEntries(wallets.map(w => [w.role, w]));

  // Get deployer private key - handle custom deployer case
  let deployerPrivateKey: string = walletMap.deployer.privateKey;
  if (deployerPrivateKey === 'FROM_ENV_FILE') {
    const envPrivateKey = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
    if (!envPrivateKey) {
      throw new Error('❌ PRIVATE_KEY not found in .env file. Please add your deployer private key to .env');
    }
    deployerPrivateKey = envPrivateKey;
    console.log('✅ Using deployer private key from .env file');
  }

  // Get signers
  const deployer = new ethers.Wallet(deployerPrivateKey, ethers.provider);
  const tokenIssuer = new ethers.Wallet(walletMap.tokenIssuer.privateKey, ethers.provider);
  const tokenAgent = new ethers.Wallet(walletMap.tokenAgent.privateKey, ethers.provider);
  const claimIssuer = new ethers.Wallet(walletMap.claimIssuer.privateKey, ethers.provider);

  console.log(`Deployer: ${deployer.address}`);
  console.log(`Token Issuer: ${tokenIssuer.address}`);
  console.log(`Token Agent: ${tokenAgent.address}`);
  console.log(`Claim Issuer: ${claimIssuer.address}\n`);

  const network = await ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})\n`);

  const deployedContracts: Partial<DeployedContracts> = {
    network: network.name,
    deploymentTime: new Date().toISOString()
  };

  // 1. Deploy Implementation Contracts
  console.log('📦 1/8 Deploying implementation contracts...');
  
  console.log('   Deploying ClaimTopicsRegistry implementation...');
  const claimTopicsRegistryImplementation = await ethers.deployContract('ClaimTopicsRegistry', [], deployer);
  await claimTopicsRegistryImplementation.deployed();
  deployedContracts.claimTopicsRegistryImplementation = claimTopicsRegistryImplementation.address;

  console.log('   Deploying TrustedIssuersRegistry implementation...');
  const trustedIssuersRegistryImplementation = await ethers.deployContract('TrustedIssuersRegistry', [], deployer);
  await trustedIssuersRegistryImplementation.deployed();
  deployedContracts.trustedIssuersRegistryImplementation = trustedIssuersRegistryImplementation.address;

  console.log('   Deploying IdentityRegistryStorage implementation...');
  const identityRegistryStorageImplementation = await ethers.deployContract('IdentityRegistryStorage', [], deployer);
  await identityRegistryStorageImplementation.deployed();
  deployedContracts.identityRegistryStorageImplementation = identityRegistryStorageImplementation.address;

  console.log('   Deploying IdentityRegistry implementation...');
  const identityRegistryImplementation = await ethers.deployContract('IdentityRegistry', [], deployer);
  await identityRegistryImplementation.deployed();
  deployedContracts.identityRegistryImplementation = identityRegistryImplementation.address;

  console.log('   Deploying ModularCompliance implementation...');
  const modularComplianceImplementation = await ethers.deployContract('ModularCompliance', [], deployer);
  await modularComplianceImplementation.deployed();
  deployedContracts.modularComplianceImplementation = modularComplianceImplementation.address;

  console.log('   Deploying Token implementation...');
  const tokenImplementation = await ethers.deployContract('Token', [], deployer);
  await tokenImplementation.deployed();
  deployedContracts.tokenImplementation = tokenImplementation.address;

  console.log('   Deploying Identity implementation...');
  const identityImplementation = await new ethers.ContractFactory(
    OnchainID.contracts.Identity.abi,
    OnchainID.contracts.Identity.bytecode,
    deployer
  ).deploy(deployer.address, true);
  await identityImplementation.deployed();
  deployedContracts.identityImplementation = identityImplementation.address;

  // 2. Deploy Implementation Authorities
  console.log('\n🏛️  2/8 Deploying implementation authorities...');
  
  console.log('   Deploying Identity Implementation Authority...');
  const identityImplementationAuthority = await new ethers.ContractFactory(
    OnchainID.contracts.ImplementationAuthority.abi,
    OnchainID.contracts.ImplementationAuthority.bytecode,
    deployer
  ).deploy(identityImplementation.address);
  await identityImplementationAuthority.deployed();
  deployedContracts.identityImplementationAuthority = identityImplementationAuthority.address;

  console.log('   Deploying T-REX Implementation Authority...');
  const trexImplementationAuthority = await ethers.deployContract(
    'TREXImplementationAuthority',
    [true, ethers.constants.AddressZero, ethers.constants.AddressZero],
    deployer
  );
  await trexImplementationAuthority.deployed();
  deployedContracts.trexImplementationAuthority = trexImplementationAuthority.address;

  // Add T-REX version
  const versionStruct = {
    major: 4,
    minor: 1,
    patch: 6
  };
  const contractsStruct = {
    tokenImplementation: tokenImplementation.address,
    ctrImplementation: claimTopicsRegistryImplementation.address,
    irImplementation: identityRegistryImplementation.address,
    irsImplementation: identityRegistryStorageImplementation.address,
    tirImplementation: trustedIssuersRegistryImplementation.address,
    mcImplementation: modularComplianceImplementation.address
  };
  
  console.log('   Adding T-REX version to implementation authority...');
  await trexImplementationAuthority.connect(deployer).addAndUseTREXVersion(versionStruct, contractsStruct);

  // 3. Deploy Factory Contracts
  console.log('\n🏭 3/8 Deploying factory contracts...');
  
  console.log('   Deploying Identity Factory...');
  const identityFactory = await new ethers.ContractFactory(
    OnchainID.contracts.Factory.abi,
    OnchainID.contracts.Factory.bytecode,
    deployer
  ).deploy(identityImplementationAuthority.address);
  await identityFactory.deployed();
  deployedContracts.identityFactory = identityFactory.address;

  console.log('   Deploying T-REX Factory...');
  const trexFactory = await ethers.deployContract(
    'TREXFactory',
    [trexImplementationAuthority.address, identityFactory.address],
    deployer
  );
  await trexFactory.deployed();
  deployedContracts.trexFactory = trexFactory.address;

  // Link factories
  console.log('   Linking factories...');
  await identityFactory.connect(deployer).addTokenFactory(trexFactory.address);

  // 4. Deploy Token ONCHAINID
  console.log('\n🆔 4/8 Deploying token ONCHAINID...');
  const tokenOnchainID = await deployIdentityProxy(
    identityImplementationAuthority.address,
    tokenIssuer.address,
    deployer
  );
  deployedContracts.tokenOnchainID = tokenOnchainID.address;
  console.log(`   Token ONCHAINID: ${tokenOnchainID.address}`);

  // 5. Deploy Claim Issuer
  console.log('\n📜 5/8 Deploying claim issuer...');
  const claimIssuerSigningKey = ethers.Wallet.createRandom();
  
  console.log('   Deploying ClaimIssuer contract...');
  const claimIssuerContract = await ethers.deployContract('ClaimIssuer', [claimIssuer.address], claimIssuer);
  await claimIssuerContract.deployed();
  deployedContracts.claimIssuerContract = claimIssuerContract.address;

  console.log('   Adding signing key to claim issuer...');
  await claimIssuerContract
    .connect(claimIssuer)
    .addKey(
      ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['address'], [claimIssuerSigningKey.address])),
      3,
      1
    );

  // 6. Deploy T-REX Suite using Factory
  console.log('\n🎯 6/8 Deploying T-REX suite using factory...');
  
  const tokenDetails = {
    owner: tokenIssuer.address,
    name: 'Security Token Example',
    symbol: 'SECTOK',
    decimals: 18,
    irs: ethers.constants.AddressZero, // Deploy new IRS
    ONCHAINID: tokenOnchainID.address,
    irAgents: [tokenAgent.address],
    tokenAgents: [tokenAgent.address],
    complianceModules: [],
    complianceSettings: []
  };

  const claimTopics = [ethers.utils.id('KYC_CLAIM')];
  const claimDetails = {
    claimTopics: claimTopics,
    issuers: [claimIssuerContract.address],
    issuerClaims: [claimTopics]
  };

  console.log('   Deploying T-REX suite...');
  const salt = `trex-${Date.now()}`;
  const deployTx = await trexFactory.connect(deployer).deployTREXSuite(
    salt,
    tokenDetails,
    claimDetails
  );
  
  const receipt = await deployTx.wait();
  
  // Extract deployed addresses from events
  const suiteDeployedEvent = receipt.events?.find((e: any) => e.event === 'TREXSuiteDeployed');
  if (!suiteDeployedEvent) {
    throw new Error('TREXSuiteDeployed event not found');
  }

  const [tokenAddress, irAddress, irsAddress, tirAddress, ctrAddress, mcAddress] = suiteDeployedEvent.args;
  
  deployedContracts.token = tokenAddress;
  deployedContracts.identityRegistry = irAddress;
  deployedContracts.identityRegistryStorage = irsAddress;
  deployedContracts.trustedIssuersRegistry = tirAddress;
  deployedContracts.claimTopicsRegistry = ctrAddress;
  deployedContracts.compliance = mcAddress;

  console.log(`   Token: ${tokenAddress}`);
  console.log(`   Identity Registry: ${irAddress}`);
  console.log(`   Identity Registry Storage: ${irsAddress}`);
  console.log(`   Trusted Issuers Registry: ${tirAddress}`);
  console.log(`   Claim Topics Registry: ${ctrAddress}`);
  console.log(`   Compliance: ${mcAddress}`);

  // 7. Configure Token
  console.log('\n⚙️  7/8 Configuring token...');
  
  const token = await ethers.getContractAt('Token', tokenAddress, tokenIssuer);
  
  console.log('   Unpausing token...');
  await token.connect(tokenAgent).unpause();
  
  console.log('   Setting token details...');
  deployedContracts.tokenDetails = {
    name: tokenDetails.name,
    symbol: tokenDetails.symbol,
    decimals: tokenDetails.decimals,
    totalSupply: '0' // Initial supply is 0
  };

  deployedContracts.claimTopics = claimTopics.map(topic => topic.toString());

  // 8. Save deployment data
  console.log('\n💾 8/8 Saving deployment data...');
  
  const outputDir = join(__dirname, '../test-data');
  if (!existsSync(outputDir)) {
    throw new Error('test-data directory not found');
  }

  const outputPath = join(outputDir, 'deployed-contracts.json');
  writeFileSync(outputPath, JSON.stringify(deployedContracts, null, 2));

  // Save claim issuer signing key
  const signingKeyPath = join(outputDir, 'claim-issuer-signing-key.json');
  writeFileSync(signingKeyPath, JSON.stringify({
    address: claimIssuerSigningKey.address,
    privateKey: claimIssuerSigningKey.privateKey
  }, null, 2));

  console.log(`   Deployment data saved to: ${outputPath}`);
  console.log(`   Claim issuer signing key saved to: ${signingKeyPath}`);

  // Print summary
  console.log('\n🎉 T-REX Suite Deployment Complete!');
  console.log('═'.repeat(80));
  console.log(`Token Name: ${tokenDetails.name}`);
  console.log(`Token Symbol: ${tokenDetails.symbol}`);
  console.log(`Token Address: ${tokenAddress}`);
  console.log(`Token Issuer: ${tokenIssuer.address}`);
  console.log(`Token Agent: ${tokenAgent.address}`);
  console.log(`Claim Issuer: ${claimIssuer.address}`);
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log('═'.repeat(80));
  
  console.log('\n📋 Next Steps:');
  console.log('1. Run: npx hardhat run scripts/5-setup-kyc.ts --network <network>');
  console.log('2. Run: npx hardhat run scripts/6-mint-and-distribute.ts --network <network>');
  console.log('3. Run: npx hardhat run scripts/7-test-transfers.ts --network <network>');

  return deployedContracts as DeployedContracts;
}

// Run the script
if (require.main === module) {
  deployTREXSuite()
    .then(() => {
      console.log('\n✅ Deployment completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error deploying T-REX suite:', error);
      process.exit(1);
    });
}

export { deployTREXSuite }; 