# 🔧 Command Explanations - ERC-3643 Sepolia Deployment

This guide explains what each command does during the T-REX (ERC-3643) token deployment and testing process.

---

## 🚀 SETUP COMMANDS

### `./setup-custom-deployer.sh`
**Purpose**: Initial setup for your custom deployer address  
**What it does**:
- Installs npm dependencies if needed
- Runs the custom wallet generation script
- Creates `.env` configuration file
- Sets up your deployer address: `0x38498f498f8679c1f43A08891192e2F5e728a1bB`
- Generates 9 additional test wallets for different roles
- Creates templates and instructions for next steps

**Output Files**:
- `test-data/wallets.json` - All wallet addresses and private keys
- `.env` - Environment configuration (you must edit this with your private key)

---

### `npx hardhat run scripts/1-generate-wallets-custom.ts`
**Purpose**: Generate wallet configuration with your custom deployer  
**What it does**:
- Creates a wallet configuration where YOUR address is the deployer
- Generates random wallets for other roles (issuer, agent, investors, etc.)
- Saves all wallet information to `test-data/wallets.json`
- Creates `.env.custom` template with your deployer address

**Roles Generated**:
- `deployer`: Your custom address (0x38498f498f8679c1f43A08891192e2F5e728a1bB)
- `tokenIssuer`: Issues and manages the security token
- `tokenAgent`: Agent for token operations (mint/burn/freeze)
- `claimIssuer`: Issues KYC claims for investors
- `investor1_alice`: Test investor 1 (will receive tokens)
- `investor2_bob`: Test investor 2 (will receive tokens)
- `investor3_charlie`: Test investor 3 (for transfer testing)
- `investor4_david`: Test investor 4 (for compliance testing)
- `regularUser1`: Non-KYC user (should fail to receive tokens)
- `regularUser2`: Non-KYC user (for negative testing)

---

## 🚀 DEPLOYMENT COMMANDS

### `./deploy-sepolia-complete.sh`
**Purpose**: Complete one-command deployment of entire T-REX suite  
**What it does**:
1. Validates environment configuration
2. Runs all deployment steps in sequence
3. Checks for errors and stops if any step fails
4. Shows final contract addresses and Etherscan links
5. Provides status summary and next steps

**Steps Executed**:
1. Check initial balances
2. Deploy T-REX Suite
3. Fund test wallets
4. Setup KYC system
5. Mint and distribute tokens
6. Test transfers and compliance

---

### `npm run check-balances -- --network sepolia`
**Purpose**: Check ETH and token balances for all wallets  
**What it does**:
- Connects to Sepolia network
- Reads wallet addresses from `test-data/wallets.json`
- Checks ETH balance for each wallet
- If token is deployed, checks token balances too
- Shows which wallets need funding

**Example Output**:
```
🏦 Checking balances on sepolia network...

WALLET BALANCES:
deployer             | 0x38498f498f8679c1f43A08891192e2F5e728a1bB | 1.234 ETH | 0 SECTOK
tokenIssuer          | 0x... | 0.100 ETH | 0 SECTOK
investor1_alice      | 0x... | 0.100 ETH | 100000 SECTOK
...
```

---

### `npm run deploy-trex -- --network sepolia`
**Purpose**: Deploy the complete T-REX (ERC-3643) contract suite  
**What it does**:
- Deploys implementation contracts first
- Deploys factory contracts
- Creates token ONCHAINID (identity for the token itself)
- Deploys claim issuer (for KYC claims)
- Uses factory to deploy the complete T-REX suite:
  - Token contract (ERC-3643 compliant)
  - Identity Registry
  - Compliance module
  - Claim Topics Registry
  - Trusted Issuers Registry
- Configures all contracts to work together
- Unpauses the token (makes it ready for transfers)
- Saves contract addresses to `test-data/deployed-contracts.json`

**Smart Contracts Deployed**:
1. **Token**: The main ERC-3643 security token
2. **Identity Registry**: Manages investor identities and KYC status
3. **Compliance**: Enforces transfer rules and regulations
4. **Claim Topics Registry**: Defines what types of claims are required
5. **Trusted Issuers Registry**: Manages who can issue valid KYC claims
6. **Token ONCHAINID**: Digital identity for the token itself
7. **Claim Issuer**: Service that issues KYC claims to investors

---

### `npm run fund-wallets -- --network sepolia`
**Purpose**: Distribute ETH from deployer to test wallets  
**What it does**:
- Takes ETH from your deployer address
- Sends 0.1 ETH to each test wallet
- Enables test wallets to pay gas fees for transactions
- Required for wallets to perform token operations

**ETH Distribution**:
- Each test wallet receives: 0.1 ETH
- Total cost: ~0.9 ETH (9 wallets × 0.1 ETH)
- Source: Your deployer address

---

## 🆔 KYC SETUP COMMANDS

### `npm run setup-kyc -- --network sepolia`
**Purpose**: Setup KYC (Know Your Customer) system for investors  
**What it does**:
- Creates ONCHAINID contracts for each investor
- Issues KYC claims (cryptographic proofs of identity verification)
- Registers investors in the Identity Registry
- Makes investors eligible to receive and transfer tokens
- Saves identity information to `test-data/investor-identities.json`

**For Each Investor**:
1. Deploy individual ONCHAINID contract
2. Issue KYC claim with specific topic (country verification)
3. Register in the token's Identity Registry
4. Verify the investor can now pass compliance checks

**KYC Claims Issued**:
- Alice: Country code 840 (USA)
- Bob: Country code 124 (Canada)  
- Charlie: Country code 826 (UK)
- David: Country code 276 (Germany)

**Important**: No personal data is stored on-chain, only cryptographic proofs

---

## 🪙 TOKEN OPERATIONS COMMANDS

### `npm run mint-tokens -- --network sepolia`
**Purpose**: Mint initial token supply and distribute to investors  
**What it does**:
- Connects as the token issuer
- Mints tokens directly to KYC-verified investor addresses
- Only works for addresses that have valid KYC claims
- Saves distribution details to `test-data/token-distribution.json`

**Token Distribution**:
- Alice: 100,000 SECTOK tokens
- Bob: 75,000 SECTOK tokens
- Charlie: 50,000 SECTOK tokens
- David: 25,000 SECTOK tokens
- Total: 250,000 tokens minted

**Token Details**:
- Name: "Security Token"
- Symbol: "SECTOK"
- Decimals: 18
- Standard: ERC-3643 (compliance-enabled)

---

## 🧪 TESTING COMMANDS

### `npm run test-transfers -- --network sepolia`
**Purpose**: Test all transfer scenarios and compliance rules  
**What it does**:
- Tests successful transfers between KYC investors
- Tests blocked transfers to non-KYC addresses
- Tests administrative functions (freeze/unfreeze)
- Tests token pause/unpause functionality
- Saves detailed results to `test-data/transfer-test-results.json`

**Test Scenarios**:
1. ✅ Alice → Bob transfer (should succeed)
2. ❌ Alice → Non-KYC user transfer (should fail)
3. ✅ Agent freezes Alice's account
4. ❌ Alice tries to transfer while frozen (should fail)
5. ✅ Agent unfreezes Alice's account
6. ✅ Issuer pauses the entire token
7. ❌ Any transfer while paused (should fail)
8. ✅ Issuer unpauses the token
9. ✅ Normal transfers resume

**Each Test Records**:
- Description of what was tested
- Expected result vs actual result
- Transaction hash (if successful)
- Error message (if failed as expected)
- Gas used and costs

---

## 🔍 VERIFICATION COMMANDS

### `cat test-data/deployed-contracts.json`
**Purpose**: View all deployed contract addresses  
**What it shows**:
```json
{
  "token": "0x...",
  "identityRegistry": "0x...",
  "compliance": "0x...",
  "claimTopicsRegistry": "0x...",
  "trustedIssuersRegistry": "0x...",
  "tokenONCHAINID": "0x...",
  "claimIssuer": "0x..."
}
```

### `cat test-data/wallets.json`
**Purpose**: View all wallet addresses and roles  
**What it shows**: Complete list of all generated wallets with addresses, private keys, and roles

### `cat test-data/investor-identities.json`
**Purpose**: View KYC setup information  
**What it shows**: ONCHAINID addresses and claim details for each investor

### `cat test-data/token-distribution.json`
**Purpose**: View token distribution details  
**What it shows**: How many tokens were minted to each investor

### `cat test-data/transfer-test-results.json`
**Purpose**: View transfer test results  
**What it shows**: Detailed results of all transfer tests with success/failure status

---

## 🌐 ETHERSCAN VERIFICATION COMMANDS

### Generate Etherscan Links
```bash
node -e "
const contracts = require('./test-data/deployed-contracts.json');
console.log('Token:', 'https://sepolia.etherscan.io/token/' + contracts.token);
console.log('Contract:', 'https://sepolia.etherscan.io/address/' + contracts.token);
"
```

**Purpose**: Generate URLs to view contracts on Sepolia Etherscan  
**What you can verify**:
- Token transfers and holders
- Contract source code
- Transaction history
- Admin operations (freeze/pause)
- KYC claims (cryptographic hashes only)

---

## 🖥️ INTERACTIVE TESTING COMMANDS

### `npx hardhat console --network sepolia`
**Purpose**: Start interactive JavaScript console connected to Sepolia  
**What you can do**:
- Load deployed contracts
- Execute functions manually
- Test specific scenarios
- Query token and identity data
- Perform administrative actions

**Common Console Commands**:
```javascript
// Load contracts
const contracts = require('./test-data/deployed-contracts.json');
const token = await ethers.getContractAt('Token', contracts.token);

// Check token info
await token.name();                    // "Security Token"
await token.symbol();                  // "SECTOK"
await token.totalSupply();             // Total tokens minted

// Check balances
await token.balanceOf('0x...');        // Check specific address balance

// Transfer tokens (need to connect wallet first)
const wallet = new ethers.Wallet('private_key', ethers.provider);
const tokenAsWallet = token.connect(wallet);
await tokenAsWallet.transfer('0x...', ethers.utils.parseUnits('10', 18));
```

---

## 💰 BALANCE AND STATUS MONITORING

### Quick Status Check
```bash
node -e "
async function status() {
  const ethers = require('ethers');
  const fs = require('fs');
  require('dotenv').config();
  
  const contracts = JSON.parse(fs.readFileSync('test-data/deployed-contracts.json'));
  const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const token = new ethers.Contract(contracts.token, ['function totalSupply() view returns (uint256)'], provider);
  
  console.log('Total Supply:', ethers.utils.formatUnits(await token.totalSupply(), 18));
}
status().catch(console.error);
"
```

**Purpose**: Quick check of token status without full deployment scripts

---

## 🔧 UTILITY COMMANDS

### Test RPC Connection
```bash
curl -X POST https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161 \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```
**Purpose**: Verify network connectivity and RPC endpoint

### Check ETH Balance
```bash
curl -X POST https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161 \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x38498f498f8679c1f43A08891192e2F5e728a1bB","latest"],"id":1}'
```
**Purpose**: Check your deployer's ETH balance directly

---

## 📊 DATA FILES EXPLAINED

### `test-data/wallets.json`
- Contains all wallet addresses, private keys, and roles
- Generated by wallet generation script
- Used by all other scripts to know which address has which role

### `test-data/deployed-contracts.json`
- Contains addresses of all deployed contracts
- Generated by deployment script
- Used by testing and verification scripts

### `test-data/investor-identities.json`
- Contains ONCHAINID addresses for each investor
- Maps investor addresses to their identity contracts
- Generated by KYC setup script

### `test-data/token-distribution.json`
- Contains details of token minting and distribution
- Shows which investor received how many tokens
- Generated by minting script

### `test-data/transfer-test-results.json`
- Contains detailed results of all transfer tests
- Shows success/failure status and transaction hashes
- Generated by transfer testing script

### `.env`
- Contains your private key and RPC configuration
- **NEVER commit this file to version control**
- Required for all network operations

---

## 🚨 IMPORTANT SECURITY NOTES

1. **Private Keys**: Your `.env` file contains real private keys. Keep it secure.
2. **Test Wallets**: Other wallets are for testing only. Don't send real funds.
3. **Sepolia Only**: This setup is for Sepolia testnet. Don't use on mainnet without modifications.
4. **Gas Costs**: All operations cost Sepolia ETH. Make sure your deployer has enough funds.
5. **Data Persistence**: All test data is saved locally. Back up important files.

---

## 🎯 SUCCESS INDICATORS

You know everything is working when:
- ✅ All commands execute without errors
- ✅ Contract addresses are generated and saved
- ✅ Tokens are minted to investor addresses
- ✅ Transfers work between KYC investors
- ✅ Non-KYC transfers are properly blocked
- ✅ All activity is visible on Sepolia Etherscan
- ✅ Administrative functions (freeze/pause) work correctly

**Your ERC-3643 security token is ready for use! 🎉** 