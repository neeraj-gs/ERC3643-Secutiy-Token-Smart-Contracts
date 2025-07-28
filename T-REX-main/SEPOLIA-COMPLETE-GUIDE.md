# 🚀 ERC-3643 Sepolia Testnet Complete Guide

## 📋 Prerequisites

### 1. Environment Setup
Create `.env` file in project root:
```bash
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161
PRIVATE_KEY=YOUR_DEPLOYER_PRIVATE_KEY_FROM_WALLETS_JSON
GAS_PRICE=20000000000
GAS_LIMIT=8000000
```

### 2. Get Sepolia ETH
- Visit: https://sepoliafaucet.com/
- Visit: https://www.alchemy.com/faucets/ethereum-sepolia
- Visit: https://faucets.chain.link/sepolia
- Visit: https://sepolia-faucet.pk910.de/
- Visit: https://faucet.quicknode.com/ethereum/sepolia

**Fund the deployer address with minimum 0.5 ETH**

---

## 🚀 Complete Deployment Flow

### Step 1: Generate Wallets
```bash
npm run generate-wallets
```
- Creates `test-data/wallets.json` with all role addresses
- Copy deployer's private key to `.env` file

### Step 2: Fund Wallets
```bash
npm run fund-wallets -- --network sepolia
```
- Distributes ETH from deployer to other wallets

### Step 3: Check Initial Balances
```bash
npm run check-balances -- --network sepolia
```

### Step 4: Deploy Complete Suite
```bash
npm run deploy-trex -- --network sepolia
```
- Deploys all ERC-3643 contracts
- Creates `test-data/deployed-contracts.json`

### Step 5: Setup KYC
```bash
npm run setup-kyc -- --network sepolia
```
- Creates ONCHAINID for investors
- Issues KYC claims
- Creates `test-data/investor-identities.json`

### Step 6: Mint Tokens
```bash
npm run mint-tokens -- --network sepolia
```
- Mints tokens to KYC-verified investors
- Creates `test-data/token-distribution.json`

### Step 7: Test Transfers
```bash
npm run test-transfers -- --network sepolia
```
- Tests all transfer scenarios
- Creates `test-data/transfer-test-results.json`

### Alternative: One Command Deployment
```bash
npm run deploy:sepolia
```

---

## 🧪 Testing Commands

### Basic Status Checks
```bash
# Check all balances
npm run check-balances -- --network sepolia

# View contract addresses
cat test-data/deployed-contracts.json

# View wallet addresses
cat test-data/wallets.json

# View KYC setup
cat test-data/investor-identities.json

# View token distribution
cat test-data/token-distribution.json

# View test results
cat test-data/transfer-test-results.json
```

### Interactive Console Testing
```bash
# Start Hardhat console on Sepolia
npx hardhat console --network sepolia
```

**In Console:**
```javascript
// Load data
const contracts = require('./test-data/deployed-contracts.json');
const wallets = require('./test-data/wallets.json');

// Get contracts
const token = await ethers.getContractAt('Token', contracts.token);
const identityRegistry = await ethers.getContractAt('IdentityRegistry', contracts.identityRegistry);

// Get wallets
const alice = wallets.find(w => w.role === 'investor1_alice');
const bob = wallets.find(w => w.role === 'investor2_bob');
const nonKyc = wallets.find(w => w.role === 'regularUser1');

// Check token info
console.log("Name:", await token.name());
console.log("Symbol:", await token.symbol());
console.log("Total Supply:", ethers.utils.formatUnits(await token.totalSupply(), 18));

// Check balances
console.log("Alice Balance:", ethers.utils.formatUnits(await token.balanceOf(alice.address), 18));
console.log("Bob Balance:", ethers.utils.formatUnits(await token.balanceOf(bob.address), 18));

// Test transfer
const aliceWallet = new ethers.Wallet(alice.privateKey, ethers.provider);
const tokenAsAlice = token.connect(aliceWallet);
const tx = await tokenAsAlice.transfer(bob.address, ethers.utils.parseUnits("10", 18));
console.log("TX Hash:", tx.hash);
console.log("Etherscan:", `https://sepolia.etherscan.io/tx/${tx.hash}`);

// Wait for confirmation
await tx.wait();
console.log("New Alice Balance:", ethers.utils.formatUnits(await token.balanceOf(alice.address), 18));
console.log("New Bob Balance:", ethers.utils.formatUnits(await token.balanceOf(bob.address), 18));

// Test compliance violation (should fail)
try {
  await tokenAsAlice.transfer(nonKyc.address, ethers.utils.parseUnits("1", 18));
  console.log("❌ Transfer to non-KYC succeeded (shouldn't happen)");
} catch (error) {
  console.log("✅ Transfer to non-KYC failed correctly:", error.reason);
}

// Check KYC status
console.log("Alice KYC verified:", await identityRegistry.isVerified(alice.address));
console.log("Non-KYC verified:", await identityRegistry.isVerified(nonKyc.address));
```

### Administrative Testing
```javascript
// Test freeze functionality
const agent = wallets.find(w => w.role === 'tokenAgent');
const agentWallet = new ethers.Wallet(agent.privateKey, ethers.provider);
const registryAsAgent = identityRegistry.connect(agentWallet);

// Freeze Alice
await registryAsAgent.setAddressFrozen(alice.address, true);
console.log("Alice frozen");

// Try transfer (should fail)
try {
  await tokenAsAlice.transfer(bob.address, ethers.utils.parseUnits("1", 18));
} catch (error) {
  console.log("✅ Transfer failed while frozen:", error.reason);
}

// Unfreeze Alice
await registryAsAgent.setAddressFrozen(alice.address, false);
console.log("Alice unfrozen");

// Test pause functionality
const issuer = wallets.find(w => w.role === 'tokenIssuer');
const issuerWallet = new ethers.Wallet(issuer.privateKey, ethers.provider);
const tokenAsIssuer = token.connect(issuerWallet);

// Pause token
await tokenAsIssuer.pause();
console.log("Token paused");

// Try transfer (should fail)
try {
  await tokenAsAlice.transfer(bob.address, ethers.utils.parseUnits("1", 18));
} catch (error) {
  console.log("✅ Transfer failed while paused:", error.reason);
}

// Unpause token
await tokenAsIssuer.unpause();
console.log("Token unpaused");
```

---

## 🔍 Block Explorer Verification

### Contract Addresses
After deployment, check `test-data/deployed-contracts.json` for addresses.

### Etherscan URLs
```bash
# Get all Etherscan URLs
node -e "
const contracts = require('./test-data/deployed-contracts.json');
console.log('🔗 ETHERSCAN LINKS:');
console.log('Token:', 'https://sepolia.etherscan.io/address/' + contracts.token);
console.log('Identity Registry:', 'https://sepolia.etherscan.io/address/' + contracts.identityRegistry);
console.log('Compliance:', 'https://sepolia.etherscan.io/address/' + contracts.compliance);
console.log('Claim Topics Registry:', 'https://sepolia.etherscan.io/address/' + contracts.claimTopicsRegistry);
console.log('Trusted Issuers Registry:', 'https://sepolia.etherscan.io/address/' + contracts.trustedIssuersRegistry);
console.log('Token ONCHAINID:', 'https://sepolia.etherscan.io/address/' + contracts.tokenONCHAINID);
console.log('Claim Issuer:', 'https://sepolia.etherscan.io/address/' + contracts.claimIssuer);
"
```

### Token-Specific Verification
```bash
# Token contract verification
node -e "
const contracts = require('./test-data/deployed-contracts.json');
console.log('🪙 TOKEN VERIFICATION:');
console.log('Address:', contracts.token);
console.log('Token Page:', 'https://sepolia.etherscan.io/token/' + contracts.token);
console.log('Contract Source:', 'https://sepolia.etherscan.io/address/' + contracts.token + '#code');
console.log('Read Contract:', 'https://sepolia.etherscan.io/address/' + contracts.token + '#readContract');
console.log('Write Contract:', 'https://sepolia.etherscan.io/address/' + contracts.token + '#writeContract');
console.log('Transfers:', 'https://sepolia.etherscan.io/token/' + contracts.token + '#tokenTrades');
"
```

### What to Check on Etherscan

#### Token Contract
- **Overview**: Basic token info (name: SECTOK, symbol: SECTOK, decimals: 18)
- **Transfers**: All token movements between addresses
- **Holders**: List of token holders and balances
- **Contract**: Source code verification
- **Read Contract**: Query token data (totalSupply, balanceOf, etc.)
- **Write Contract**: Interact with token functions

#### Individual Addresses
```bash
# Get investor addresses for checking
node -e "
const wallets = require('./test-data/wallets.json');
const investors = wallets.filter(w => w.role.includes('investor'));
console.log('🧑‍💼 INVESTOR ADDRESSES:');
investors.forEach(inv => {
  console.log(inv.role + ':', inv.address);
  console.log('View: https://sepolia.etherscan.io/address/' + inv.address);
});
"
```

#### Transaction Verification
```bash
# Get recent transaction hashes
node -e "
const results = require('./test-data/transfer-test-results.json');
console.log('🔗 TRANSACTION HASHES:');
results.forEach((test, i) => {
  if (test.transactionHash) {
    console.log('Test ' + (i+1) + ':', test.description);
    console.log('Hash:', test.transactionHash);
    console.log('View: https://sepolia.etherscan.io/tx/' + test.transactionHash);
  }
});
"
```

---

## 🆔 KYC Data Verification

### Understanding KYC Storage
- **NOT stored**: Personal information, documents, plain text data
- **STORED**: Cryptographic claims, hashes, signatures
- **Location**: ONCHAINID contracts linked to investor addresses

### Check KYC Claims
```bash
# View investor ONCHAINID contracts
node -e "
const identities = require('./test-data/investor-identities.json');
const wallets = require('./test-data/wallets.json');
console.log('🆔 INVESTOR ONCHAINID CONTRACTS:');
identities.forEach(identity => {
  const wallet = wallets.find(w => w.address === identity.investorAddress);
  console.log(wallet.role + ':');
  console.log('  Investor:', identity.investorAddress);
  console.log('  ONCHAINID:', identity.identityAddress);
  console.log('  Etherscan: https://sepolia.etherscan.io/address/' + identity.identityAddress);
});
"
```

### Verify KYC Status
```javascript
// In Hardhat console
const contractsData = require('./test-data/deployed-contracts.json');
const wallets = require('./test-data/wallets.json');
const identityRegistry = await ethers.getContractAt('IdentityRegistry', contractsData.identityRegistry);

// Check each investor
const investors = wallets.filter(w => w.role.includes('investor'));
for (const investor of investors) {
  const isVerified = await identityRegistry.isVerified(investor.address);
  const identityAddress = await identityRegistry.identity(investor.address);
  const country = await identityRegistry.investorCountry(investor.address);
  
  console.log(`${investor.role}:`);
  console.log(`  Verified: ${isVerified}`);
  console.log(`  ONCHAINID: ${identityAddress}`);
  console.log(`  Country: ${country}`);
}
```

---

## 📊 Monitoring & Status

### Quick Status Script
```bash
# Create monitoring script
cat > sepolia-status.js << 'EOF'
const ethers = require('ethers');
const fs = require('fs');

async function checkStatus() {
    const contracts = JSON.parse(fs.readFileSync('test-data/deployed-contracts.json'));
    const wallets = JSON.parse(fs.readFileSync('test-data/wallets.json'));
    
    const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const token = new ethers.Contract(contracts.token, [
        'function balanceOf(address) view returns (uint256)',
        'function totalSupply() view returns (uint256)',
        'function name() view returns (string)',
        'function symbol() view returns (string)'
    ], provider);
    
    console.log('📊 SEPOLIA STATUS');
    console.log('Token:', contracts.token);
    console.log('Name:', await token.name());
    console.log('Symbol:', await token.symbol());
    console.log('Total Supply:', ethers.utils.formatUnits(await token.totalSupply(), 18));
    console.log('Etherscan: https://sepolia.etherscan.io/token/' + contracts.token);
    
    const investors = wallets.filter(w => w.role.includes('investor'));
    for (const investor of investors) {
        const balance = await token.balanceOf(investor.address);
        console.log(`${investor.role}: ${ethers.utils.formatUnits(balance, 18)} tokens`);
    }
}

checkStatus().catch(console.error);
EOF

# Run status check
node sepolia-status.js
```

### Automated Testing
```bash
# Run all tests periodically
npm run test-transfers -- --network sepolia

# Check results
cat test-data/transfer-test-results.json | grep -E "description|actualResult"
```

---

## 🎯 Complete Flow Summary

1. **Setup**: Create `.env`, get Sepolia ETH
2. **Deploy**: `npm run deploy:sepolia`
3. **Verify**: Check contracts on Etherscan
4. **Test**: Use console commands for transfers
5. **Monitor**: Check balances and transaction history

**Key Files Generated:**
- `test-data/wallets.json` - All wallet addresses
- `test-data/deployed-contracts.json` - Contract addresses
- `test-data/investor-identities.json` - KYC setup data
- `test-data/token-distribution.json` - Initial token distribution
- `test-data/transfer-test-results.json` - Test results

**Etherscan Verification:**
- Token transfers and holders
- Contract interactions
- KYC claims (cryptographic only)
- Administrative actions

**Success Indicators:**
- ✅ KYC investors can transfer tokens
- ✅ Non-KYC addresses are blocked
- ✅ Admin controls work (freeze/pause)
- ✅ All events visible on Etherscan 