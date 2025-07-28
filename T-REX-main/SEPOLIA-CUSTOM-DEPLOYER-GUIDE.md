# 🚀 ERC-3643 Sepolia Deployment Guide - Custom Deployer

## Overview
This guide shows you how to deploy your ERC-3643 security token on Sepolia testnet using your specific deployer address: **0x38498f498f8679c1f43A08891192e2F5e728a1bB**

## Prerequisites ✅

### 1. Your Deployer Address Setup
- **Address**: `0x38498f498f8679c1f43A08891192e2F5e728a1bB` 
- **Status**: ✅ You have added Sepolia ETH to this address
- **Requirement**: Minimum 0.5 ETH recommended for full deployment and testing

### 2. Required Information
- Private key for the deployer address above
- Internet connection for RPC calls
- Basic terminal/command line knowledge

---

## 🚀 QUICK START - One Command Deployment

### Step 1: Setup with Your Custom Deployer
```bash
# Run the custom setup script
chmod +x setup-custom-deployer.sh
./setup-custom-deployer.sh
```

### Step 2: Configure Your Private Key
```bash
# Edit the .env file
nano .env

# Replace 'YOUR_PRIVATE_KEY_HERE' with your actual private key
# The file should look like:
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161
PRIVATE_KEY=your_actual_private_key_here
DEPLOYER_PRIVATE_KEY=your_actual_private_key_here
GAS_PRICE=20000000000
GAS_LIMIT=8000000
```

### Step 3: Deploy Everything
```bash
# Run complete deployment
chmod +x deploy-sepolia-complete.sh
./deploy-sepolia-complete.sh
```

**That's it! Your token will be deployed and ready for testing.**

---

## 📋 STEP-BY-STEP DETAILED GUIDE

### Step 1: Environment Setup

#### 1.1 Generate Custom Wallet Configuration
```bash
# Generate wallets using your deployer address
npx hardhat run scripts/1-generate-wallets-custom.ts
```

**What this does:**
- Creates wallet configuration with YOUR address as deployer
- Generates 9 additional test wallets for different roles
- Saves to `test-data/wallets.json`
- Creates `.env.custom` template

#### 1.2 Configure Environment
```bash
# Copy template to .env
cp .env.custom .env

# Edit with your private key
nano .env
```

**Required changes in .env:**
```env
PRIVATE_KEY=your_actual_private_key_for_0x38498f498f8679c1f43A08891192e2F5e728a1bB
DEPLOYER_PRIVATE_KEY=your_actual_private_key_for_0x38498f498f8679c1f43A08891192e2F5e728a1bB
```

### Step 2: Verify Setup

#### 2.1 Check Deployer Balance
```bash
# Check your Sepolia ETH balance
npm run check-balances -- --network sepolia
```

**Expected output:**
```
🏦 Checking balances on sepolia network...

WALLET BALANCES:
deployer             | 0x38498f498f8679c1f43A08891192e2F5e728a1bB | 1.234 ETH | 0 SECTOK
tokenIssuer          | 0x... | 0.000 ETH | 0 SECTOK
...
```

#### 2.2 Verify Network Connection
```bash
# Test RPC connection
curl -X POST https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161 \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Step 3: Deploy T-REX Suite

#### 3.1 Deploy Core Contracts
```bash
# Deploy all T-REX contracts
npm run deploy-trex -- --network sepolia
```

**What this deploys:**
- Token contract (ERC-3643 compliant)
- Identity Registry
- Compliance module
- Claim Topics Registry
- Trusted Issuers Registry
- Token ONCHAINID
- Claim Issuer

**Expected output:**
```
🚀 Deploying complete T-REX (ERC-3643) suite...

✅ Token deployed to: 0x...
✅ Identity Registry deployed to: 0x...
✅ Compliance deployed to: 0x...
...
💾 Deployment details saved to test-data/deployed-contracts.json
```

#### 3.2 Fund Test Wallets
```bash
# Distribute ETH to test wallets from your deployer
npm run fund-wallets -- --network sepolia
```

**What this does:**
- Sends 0.1 ETH to each test wallet
- Enables gas payments for testing
- All funds come from your deployer address

### Step 4: Setup KYC System

#### 4.1 Create Investor Identities
```bash
# Setup KYC claims for test investors
npm run setup-kyc -- --network sepolia
```

**What this does:**
- Creates ONCHAINID for each investor
- Issues KYC claims (cryptographic proofs)
- Registers investors in the Identity Registry
- Makes investors eligible to receive tokens

**Expected output:**
```
🆔 Setting up KYC and investor identities...

✅ Alice ONCHAINID: 0x...
✅ Bob ONCHAINID: 0x...
✅ Charlie ONCHAINID: 0x...
...
💾 KYC setup saved to test-data/investor-identities.json
```

### Step 5: Mint and Distribute Tokens

#### 5.1 Mint Initial Supply
```bash
# Mint tokens to KYC-verified investors
npm run mint-tokens -- --network sepolia
```

**What this does:**
- Mints 1,000,000 total tokens
- Distributes to KYC-verified investors:
  - Alice: 100,000 tokens
  - Bob: 75,000 tokens  
  - Charlie: 50,000 tokens
  - David: 25,000 tokens

**Expected output:**
```
🪙 Minting and distributing tokens...

✅ Minted 100,000 tokens to Alice (0x...)
✅ Minted 75,000 tokens to Bob (0x...)
...
💾 Distribution saved to test-data/token-distribution.json
```

### Step 6: Test Transfers and Compliance

#### 6.1 Run Compliance Tests
```bash
# Test all transfer scenarios
npm run test-transfers -- --network sepolia
```

**What this tests:**
- ✅ KYC investor → KYC investor transfers (should work)
- ❌ KYC investor → non-KYC user transfers (should fail)
- ✅ Token freeze/unfreeze functionality
- ✅ Token pause/unpause functionality
- ✅ Compliance rule enforcement

**Expected output:**
```
🧪 Testing token transfers and compliance...

✅ Test 1: Alice → Bob transfer (100 tokens) - SUCCESS
❌ Test 2: Alice → Non-KYC transfer (10 tokens) - BLOCKED ✓
✅ Test 3: Freeze/unfreeze functionality - SUCCESS
...
💾 Test results saved to test-data/transfer-test-results.json
```

---

## 🔍 VERIFICATION ON SEPOLIA ETHERSCAN

### Contract Addresses
After deployment, get your contract addresses:
```bash
# View all deployed contracts
cat test-data/deployed-contracts.json
```

### Etherscan Links
```bash
# Generate Etherscan URLs for all contracts
node -e "
const contracts = require('./test-data/deployed-contracts.json');
console.log('🔗 ETHERSCAN LINKS:');
console.log('Token Contract:');
console.log('  Address:', contracts.token);
console.log('  View: https://sepolia.etherscan.io/address/' + contracts.token);
console.log('  Token Page: https://sepolia.etherscan.io/token/' + contracts.token);
console.log('');
console.log('Other Contracts:');
Object.entries(contracts).forEach(([name, address]) => {
  if (name !== 'token') {
    console.log('  ' + name + ': https://sepolia.etherscan.io/address/' + address);
  }
});
"
```

### What to Check on Etherscan

#### 1. Token Contract Page
- **URL**: `https://sepolia.etherscan.io/token/[YOUR_TOKEN_ADDRESS]`
- **Check**: Token name (SECTOK), symbol (SECTOK), decimals (18)
- **View**: All transfers between addresses
- **See**: Current token holders and balances

#### 2. Individual Transfers
```bash
# Get transaction hashes from tests
cat test-data/transfer-test-results.json | grep "transactionHash"
```
Each hash can be viewed at: `https://sepolia.etherscan.io/tx/[HASH]`

#### 3. Investor Addresses
```bash
# View investor addresses
node -e "
const wallets = require('./test-data/wallets.json');
const investors = wallets.filter(w => w.role.includes('investor'));
console.log('🧑‍💼 INVESTOR ADDRESSES:');
investors.forEach(inv => {
  console.log(inv.role + ':', inv.address);
  console.log('  View: https://sepolia.etherscan.io/address/' + inv.address);
});
"
```

---

## 🧪 INTERACTIVE TESTING

### Hardhat Console Testing
```bash
# Start interactive console
npx hardhat console --network sepolia
```

**In the console:**
```javascript
// Load deployment data
const contracts = require('./test-data/deployed-contracts.json');
const wallets = require('./test-data/wallets.json');

// Get contract instance
const token = await ethers.getContractAt('Token', contracts.token);

// Get investor wallets
const alice = wallets.find(w => w.role === 'investor1_alice');
const bob = wallets.find(w => w.role === 'investor2_bob');

// Check token info
console.log("Name:", await token.name());
console.log("Symbol:", await token.symbol());
console.log("Total Supply:", ethers.utils.formatUnits(await token.totalSupply(), 18));

// Check balances
console.log("Alice Balance:", ethers.utils.formatUnits(await token.balanceOf(alice.address), 18));
console.log("Bob Balance:", ethers.utils.formatUnits(await token.balanceOf(bob.address), 18));

// Test transfer from Alice to Bob
const aliceWallet = new ethers.Wallet(alice.privateKey, ethers.provider);
const tokenAsAlice = token.connect(aliceWallet);

// Transfer 10 tokens
const tx = await tokenAsAlice.transfer(bob.address, ethers.utils.parseUnits("10", 18));
console.log("Transfer TX:", tx.hash);
console.log("Etherscan:", `https://sepolia.etherscan.io/tx/${tx.hash}`);

// Wait for confirmation
await tx.wait();
console.log("Transfer confirmed!");

// Check new balances
console.log("New Alice Balance:", ethers.utils.formatUnits(await token.balanceOf(alice.address), 18));
console.log("New Bob Balance:", ethers.utils.formatUnits(await token.balanceOf(bob.address), 18));
```

### Advanced Testing
```javascript
// Test compliance violation (transfer to non-KYC address)
const nonKyc = wallets.find(w => w.role === 'regularUser1');

try {
  await tokenAsAlice.transfer(nonKyc.address, ethers.utils.parseUnits("1", 18));
  console.log("❌ Transfer to non-KYC should have failed!");
} catch (error) {
  console.log("✅ Transfer to non-KYC correctly blocked:", error.reason);
}

// Test administrative functions
const identityRegistry = await ethers.getContractAt('IdentityRegistry', contracts.identityRegistry);
const agent = wallets.find(w => w.role === 'tokenAgent');
const agentWallet = new ethers.Wallet(agent.privateKey, ethers.provider);
const registryAsAgent = identityRegistry.connect(agentWallet);

// Freeze Alice's account
await registryAsAgent.setAddressFrozen(alice.address, true);
console.log("Alice account frozen");

// Try transfer while frozen (should fail)
try {
  await tokenAsAlice.transfer(bob.address, ethers.utils.parseUnits("1", 18));
} catch (error) {
  console.log("✅ Transfer blocked while frozen:", error.reason);
}

// Unfreeze Alice
await registryAsAgent.setAddressFrozen(alice.address, false);
console.log("Alice account unfrozen");
```

---

## 📊 MONITORING AND STATUS

### Quick Status Check
```bash
# Check current status
node -e "
async function status() {
  const ethers = require('ethers');
  const fs = require('fs');
  require('dotenv').config();
  
  const contracts = JSON.parse(fs.readFileSync('test-data/deployed-contracts.json'));
  const wallets = JSON.parse(fs.readFileSync('test-data/wallets.json'));
  
  const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const token = new ethers.Contract(contracts.token, [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)'
  ], provider);
  
  console.log('📊 TOKEN STATUS:');
  console.log('Name:', await token.name());
  console.log('Symbol:', await token.symbol());
  console.log('Total Supply:', ethers.utils.formatUnits(await token.totalSupply(), 18));
  console.log('Contract:', contracts.token);
  console.log('Etherscan: https://sepolia.etherscan.io/token/' + contracts.token);
  
  console.log('\\n💰 BALANCES:');
  const investors = wallets.filter(w => w.role.includes('investor'));
  for (const investor of investors) {
    const balance = await token.balanceOf(investor.address);
    console.log(investor.role + ':', ethers.utils.formatUnits(balance, 18), 'tokens');
  }
}
status().catch(console.error);
"
```

### Regular Balance Checks
```bash
# Check all balances
npm run check-balances -- --network sepolia

# View deployment summary
cat test-data/deployed-contracts.json | jq .

# View test results
cat test-data/transfer-test-results.json | jq .
```

---

## ⚠️ TROUBLESHOOTING

### Common Issues

#### 1. Insufficient Gas
```bash
# If deployment fails due to gas, increase gas price in .env
GAS_PRICE=30000000000  # 30 gwei instead of 20
```

#### 2. RPC Connection Issues
```bash
# Test RPC connection
curl -X POST $SEPOLIA_RPC_URL \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

#### 3. Private Key Issues
- Ensure no `0x` prefix in .env file
- Verify the private key matches your funded address
- Check that the address has sufficient Sepolia ETH

#### 4. Re-run Failed Steps
```bash
# If a step fails, you can re-run individual steps:
npm run deploy-trex -- --network sepolia      # Re-deploy contracts
npm run setup-kyc -- --network sepolia        # Re-setup KYC
npm run mint-tokens -- --network sepolia      # Re-mint tokens
npm run test-transfers -- --network sepolia   # Re-run tests
```

---

## 🎯 SUCCESS CRITERIA

Your deployment is successful when:

✅ **Contracts Deployed**: All contracts deployed to Sepolia  
✅ **KYC Setup**: Investors have verified identities  
✅ **Tokens Minted**: Tokens distributed to KYC investors  
✅ **Transfers Work**: KYC investors can transfer tokens  
✅ **Compliance Works**: Non-KYC transfers are blocked  
✅ **Visible on Etherscan**: All activity visible on block explorer  

---

## 📁 GENERATED FILES

After successful deployment, you'll have:

- `test-data/wallets.json` - All wallet addresses and keys
- `test-data/deployed-contracts.json` - Contract addresses
- `test-data/investor-identities.json` - KYC setup data
- `test-data/token-distribution.json` - Token allocation
- `test-data/transfer-test-results.json` - Test results
- `.env` - Your environment configuration

**🔒 Security Note**: Keep your `.env` file secure and never commit it to version control!

---

## 🏁 NEXT STEPS

1. **Explore on Etherscan**: Use the generated links to view your token
2. **Test More Scenarios**: Use the console commands for additional testing
3. **Share Token Address**: Your token is now live on Sepolia testnet
4. **Build Applications**: Integrate with wallets and dApps
5. **Prepare for Mainnet**: When ready, adapt for mainnet deployment

**Congratulations! Your ERC-3643 security token is live on Sepolia! 🎉** 