# 🚀 COMPLETE ERC-3643 SEPOLIA DEPLOYMENT GUIDE
## For Custom Deployer: 0x38498f498f8679c1f43A08891192e2F5e728a1bB

---

## 📋 OVERVIEW

This guide will help you deploy a complete ERC-3643 (T-REX) security token system on Sepolia testnet using your specific deployer address that already has Sepolia ETH.

**Your Setup:**
- **Deployer Address**: `0x38498f498f8679c1f43A08891192e2F5e728a1bB`
- **Network**: Sepolia Testnet
- **Status**: ✅ Address has Sepolia ETH ready for deployment

---

## 🚀 QUICK START (3 Commands)

### 1. Setup Environment
```bash
./setup-custom-deployer.sh
```

### 2. Add Your Private Key
```bash
nano .env
# Replace 'YOUR_PRIVATE_KEY_HERE' with your actual private key
```

### 3. Deploy Everything
```bash
./deploy-sepolia-complete.sh
```

**That's it! Your ERC-3643 token will be deployed and tested.**

---

## 📖 STEP-BY-STEP DETAILED GUIDE

### STEP 1: Environment Setup

#### 1.1 Run Setup Script
```bash
chmod +x setup-custom-deployer.sh
./setup-custom-deployer.sh
```

**What this does:**
- Installs dependencies if needed
- Generates wallets with YOUR address as deployer
- Creates `.env` configuration file
- Sets up 9 additional test wallets for different roles

**Output:**
```
🚀 Setting up ERC-3643 with CUSTOM DEPLOYER for Sepolia deployment
📍 Custom Deployer Address: 0x38498f498f8679c1f43A08891192e2F5e728a1bB

✅ Dependencies installed
✅ Custom wallets generated
✅ .env file created
```

#### 1.2 Configure Your Private Key
```bash
nano .env
```

**Edit the .env file to replace placeholders:**
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161
PRIVATE_KEY=your_actual_private_key_here
DEPLOYER_PRIVATE_KEY=your_actual_private_key_here
GAS_PRICE=20000000000
GAS_LIMIT=8000000
```

**⚠️ IMPORTANT:**
- Use your actual private key (no 0x prefix)
- Keep this file secure and never share it
- This private key must match address: 0x38498f498f8679c1f43A08891192e2F5e728a1bB

---

### STEP 2: Deploy Everything

#### 2.1 Complete Deployment
```bash
chmod +x deploy-sepolia-complete.sh
./deploy-sepolia-complete.sh
```

**What this runs automatically:**
1. ✅ Check initial balances
2. ✅ Deploy T-REX Suite (7 contracts)
3. ✅ Fund test wallets
4. ✅ Setup KYC system
5. ✅ Mint tokens to investors
6. ✅ Test transfers and compliance

**Expected Output:**
```
🚀 COMPLETE ERC-3643 SEPOLIA DEPLOYMENT
=======================================
📍 Deployer: 0x38498f498f8679c1f43A08891192e2F5e728a1bB

✅ STEP 1: Checking initial balances - SUCCESS
✅ STEP 2: Deploying T-REX Suite - SUCCESS
✅ STEP 3: Funding test wallets - SUCCESS
✅ STEP 4: Setting up KYC system - SUCCESS
✅ STEP 5: Minting and distributing tokens - SUCCESS
✅ STEP 6: Testing transfers and compliance - SUCCESS

🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!
```

#### 2.2 View Contract Addresses
```bash
cat test-data/deployed-contracts.json
```

**Example output:**
```json
{
  "token": "0x1234...abcd",
  "identityRegistry": "0x5678...efgh",
  "compliance": "0x9abc...ijkl",
  "claimTopicsRegistry": "0xdef0...mnop",
  "trustedIssuersRegistry": "0x1111...qrst",
  "tokenONCHAINID": "0x2222...uvwx",
  "claimIssuer": "0x3333...yzab"
}
```

---

### STEP 3: Verify on Etherscan

#### 3.1 Generate Etherscan Links
```bash
node -e "
const contracts = require('./test-data/deployed-contracts.json');
console.log('🔗 ETHERSCAN LINKS:');
console.log('Token Contract: https://sepolia.etherscan.io/address/' + contracts.token);
console.log('Token Page: https://sepolia.etherscan.io/token/' + contracts.token);
console.log('Identity Registry: https://sepolia.etherscan.io/address/' + contracts.identityRegistry);
console.log('Compliance: https://sepolia.etherscan.io/address/' + contracts.compliance);
"
```

#### 3.2 View Token Details on Etherscan
Visit your token page: `https://sepolia.etherscan.io/token/[YOUR_TOKEN_ADDRESS]`

**What to verify:**
- ✅ Token Name: "Security Token"
- ✅ Token Symbol: "SECTOK"
- ✅ Decimals: 18
- ✅ Total Supply: 250,000 tokens
- ✅ Token holders: 4 investors with balances
- ✅ Transfer history showing test transactions

#### 3.3 Check Investor Addresses
```bash
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

### STEP 4: Interactive Testing

#### 4.1 Start Hardhat Console
```bash
npx hardhat console --network sepolia
```

#### 4.2 Basic Token Testing
```javascript
// Load deployment data
const contracts = require('./test-data/deployed-contracts.json');
const wallets = require('./test-data/wallets.json');

// Get contract instances
const token = await ethers.getContractAt('Token', contracts.token);
const identityRegistry = await ethers.getContractAt('IdentityRegistry', contracts.identityRegistry);

// Check token info
console.log("Name:", await token.name());
console.log("Symbol:", await token.symbol());
console.log("Total Supply:", ethers.utils.formatUnits(await token.totalSupply(), 18));

// Get investor wallets
const alice = wallets.find(w => w.role === 'investor1_alice');
const bob = wallets.find(w => w.role === 'investor2_bob');

// Check balances
console.log("Alice Balance:", ethers.utils.formatUnits(await token.balanceOf(alice.address), 18));
console.log("Bob Balance:", ethers.utils.formatUnits(await token.balanceOf(bob.address), 18));
```

#### 4.3 Test Token Transfer
```javascript
// Connect Alice's wallet
const aliceWallet = new ethers.Wallet(alice.privateKey, ethers.provider);
const tokenAsAlice = token.connect(aliceWallet);

// Transfer 10 tokens from Alice to Bob
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

#### 4.4 Test Compliance (Should Fail)
```javascript
// Try to transfer to non-KYC address (should fail)
const nonKyc = wallets.find(w => w.role === 'regularUser1');

try {
  await tokenAsAlice.transfer(nonKyc.address, ethers.utils.parseUnits("1", 18));
  console.log("❌ Transfer to non-KYC should have failed!");
} catch (error) {
  console.log("✅ Transfer to non-KYC correctly blocked:", error.reason);
}
```

#### 4.5 Test Administrative Functions
```javascript
// Test freeze functionality
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

### Check Token Status
```bash
npm run check-balances -- --network sepolia
```

### View Deployment Files
```bash
# Contract addresses
cat test-data/deployed-contracts.json

# Wallet information
cat test-data/wallets.json

# KYC setup
cat test-data/investor-identities.json

# Token distribution
cat test-data/token-distribution.json

# Test results
cat test-data/transfer-test-results.json
```

### Quick Status Check
```bash
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
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)'
  ], provider);
  
  console.log('📊 TOKEN STATUS:');
  console.log('Name:', await token.name());
  console.log('Total Supply:', ethers.utils.formatUnits(await token.totalSupply(), 18));
  console.log('Contract:', contracts.token);
  console.log('Etherscan: https://sepolia.etherscan.io/token/' + contracts.token);
  
  console.log('\\n💰 INVESTOR BALANCES:');
  const investors = wallets.filter(w => w.role.includes('investor'));
  for (const investor of investors) {
    const balance = await token.balanceOf(investor.address);
    console.log(investor.role + ':', ethers.utils.formatUnits(balance, 18), 'tokens');
  }
}
status().catch(console.error);
"
```

---

## 🔧 INDIVIDUAL COMMANDS (Alternative to Full Deployment)

If you prefer to run steps individually:

### 1. Generate Wallets
```bash
npx hardhat run scripts/1-generate-wallets-custom.ts
```

### 2. Check Initial Balances
```bash
npm run check-balances -- --network sepolia
```

### 3. Deploy Contracts
```bash
npm run deploy-trex -- --network sepolia
```

### 4. Fund Test Wallets
```bash
npm run fund-wallets -- --network sepolia
```

### 5. Setup KYC
```bash
npm run setup-kyc -- --network sepolia
```

### 6. Mint Tokens
```bash
npm run mint-tokens -- --network sepolia
```

### 7. Test Transfers
```bash
npm run test-transfers -- --network sepolia
```

---

## 🎯 WHAT YOU GET

### Deployed Contracts
1. **Token Contract**: ERC-3643 compliant security token
2. **Identity Registry**: Manages investor KYC status
3. **Compliance Module**: Enforces transfer rules
4. **Claim Registries**: Manage KYC requirements
5. **ONCHAINID Contracts**: Digital identities for token and investors
6. **Claim Issuer**: Service for issuing KYC claims

### Test Setup
- **4 KYC-verified investors** with token balances
- **2 non-KYC users** for compliance testing
- **Administrative roles** (issuer, agent) for token management
- **Complete test suite** demonstrating all functionality

### Token Details
- **Name**: "Security Token"
- **Symbol**: "SECTOK"
- **Decimals**: 18
- **Total Supply**: 250,000 tokens
- **Standard**: ERC-3643 (security token standard)

### Compliance Features
- ✅ Only KYC-verified investors can receive tokens
- ✅ Non-KYC transfers are automatically blocked
- ✅ Administrative freeze/unfreeze functionality
- ✅ Token pause/unpause capability
- ✅ Country-based compliance rules

---

## 🚨 TROUBLESHOOTING

### Common Issues

#### 1. Private Key Error
```
Error: private key length is invalid
```
**Solution**: Ensure private key has no `0x` prefix in .env file

#### 2. Insufficient Funds
```
Error: insufficient funds for gas
```
**Solution**: Check deployer balance and add more Sepolia ETH

#### 3. RPC Connection Error
```
Error: could not detect network
```
**Solution**: Check RPC URL in .env file and internet connection

#### 4. Deployment Fails
**Solution**: Run individual steps to identify the issue:
```bash
npm run check-balances -- --network sepolia
npm run deploy-trex -- --network sepolia
```

### Getting Help
- Check `COMMAND-EXPLANATIONS.md` for detailed command descriptions
- Review console output for specific error messages
- Verify all files in `test-data/` directory are created correctly

---

## 🔐 SECURITY CHECKLIST

- ✅ Private key is secure and not shared
- ✅ .env file is not committed to version control
- ✅ Only using Sepolia testnet (not mainnet)
- ✅ Test wallets are funded only for testing
- ✅ All transactions are visible on Etherscan

---

## 🎉 SUCCESS CRITERIA

Your deployment is successful when:

1. ✅ All contracts deployed without errors
2. ✅ Contract addresses saved to `test-data/deployed-contracts.json`
3. ✅ KYC investors have token balances
4. ✅ Token transfers work between KYC investors
5. ✅ Non-KYC transfers are properly blocked
6. ✅ All activity visible on Sepolia Etherscan
7. ✅ Administrative functions work correctly

**When all criteria are met, your ERC-3643 security token is ready for use! 🚀**

---

## 📞 NEXT STEPS

1. **Explore on Etherscan**: Visit your token page and explore all functions
2. **Test More Scenarios**: Use the interactive console for custom testing
3. **Integrate with Applications**: Your token is now ready for dApp integration
4. **Share and Collaborate**: Share your token address with others for testing
5. **Prepare for Production**: When ready, adapt the setup for mainnet deployment

**Your ERC-3643 security token is now live on Sepolia Testnet! 🎊** 