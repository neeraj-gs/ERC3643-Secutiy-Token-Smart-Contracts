# 🌐 Sepolia Testnet Deployment & Testing Guide

## Overview
This guide shows you how to deploy your ERC-3643 security token on Sepolia testnet and verify it on the blockchain explorer.

## Current Status
✅ **Local Deployment**: Your token is successfully deployed on Hardhat local network  
🎯 **Next Step**: Deploy to Sepolia testnet for public blockchain testing

## Prerequisites for Sepolia Deployment

### 1. Get Sepolia ETH
You need ETH for deployment costs (~0.5-1 ETH recommended):

**Sepolia Faucets:**
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
- [Chainlink Faucet](https://faucets.chain.link/sepolia)
- [Infura Faucet](https://www.infura.io/faucet/sepolia)

### 2. Get RPC Provider
Sign up for a free account:
- **Infura**: [infura.io](https://infura.io/) 
- **Alchemy**: [alchemy.com](https://alchemy.com/)
- **QuickNode**: [quicknode.com](https://quicknode.com/)

### 3. Get Etherscan API Key (Optional)
For contract verification: [etherscan.io/apis](https://etherscan.io/apis)

## Step-by-Step Sepolia Deployment

### Step 1: Configure Environment

Create your `.env` file:
```bash
cp .env.template .env
```

Edit `.env` with your details:
```env
# Your Infura/Alchemy Sepolia RPC URL
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR-PROJECT-ID

# Your wallet private key (the one with Sepolia ETH)
PRIVATE_KEY=your_private_key_without_0x_prefix

# Optional: For contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Step 2: Deploy to Sepolia

**Option A: Complete Automated Deployment**
```bash
npm run run-complete-flow -- --network sepolia
```

**Option B: Step-by-Step Deployment**
```bash
# 1. Generate new wallets for Sepolia
npm run generate-wallets

# 2. Fund the deployer wallet manually with Sepolia ETH from faucets

# 3. Deploy T-REX suite
npm run deploy-trex -- --network sepolia

# 4. Setup KYC system
npm run setup-kyc -- --network sepolia

# 5. Mint and distribute tokens
npm run mint-tokens -- --network sepolia

# 6. Test compliance
npm run test-transfers -- --network sepolia
```

### Step 3: Verify Deployment Success

After deployment, you'll see output like:
```
🎉 T-REX Suite Deployment Complete!
Token Address: 0x1234567890abcdef1234567890abcdef12345678
Network: sepolia (Chain ID: 11155111)
```

## How to Check Your Token on Sepolia Blockchain

### Method 1: Using Sepolia Etherscan

1. **Open Sepolia Etherscan**: [sepolia.etherscan.io](https://sepolia.etherscan.io/)

2. **Search Your Token Address**: 
   - Paste your token contract address in the search box
   - Press Enter

3. **Verify Token Information**:
   - Check contract creation transaction
   - View token holders
   - See transaction history

### Method 2: Using Our Check Script

```bash
# Check all balances and contract info
npm run check-balances -- --network sepolia

# Check specific address
npm run check-balances -- --network sepolia 0xYourTokenAddress
```

### Method 3: Contract Verification (Optional)

Verify your contracts on Etherscan:
```bash
# Verify token contract (get address from deployment output)
npx hardhat verify --network sepolia 0xYourTokenAddress

# Verify other contracts
npx hardhat verify --network sepolia 0xIdentityRegistryAddress
npx hardhat verify --network sepolia 0xComplianceAddress
```

## Testing Your Token on Sepolia

### 1. Basic Token Information Test

```bash
# Check deployed contracts and balances
npm run check-balances -- --network sepolia
```

**What to verify:**
- ✅ Token contract exists
- ✅ Correct symbol (SECTOK)
- ✅ Correct decimals (18)
- ✅ Initial supply distributed correctly

### 2. KYC Compliance Test

```bash
# Verify KYC setup
npm run setup-kyc -- --network sepolia verify 0xInvestorAddress
```

**What to verify:**
- ✅ Investors have ONCHAINID contracts
- ✅ KYC claims are properly set
- ✅ Identity Registry recognizes verified users

### 3. Transfer Compliance Test

```bash
# Run full compliance testing
npm run test-transfers -- --network sepolia
```

**What to verify:**
- ✅ KYC users can transfer to each other
- ❌ Non-KYC users cannot receive tokens
- ✅ Freeze/pause functionality works

### 4. Single Transfer Test

```bash
# Test specific transfer
npm run test-transfers -- --network sepolia single investor1_alice investor2_bob 10
```

### 5. Manual Blockchain Verification

**On Sepolia Etherscan:**

1. **Check Token Contract**:
   - Go to your token address
   - Verify "Contract" tab shows verified code
   - Check "Read Contract" for token info
   - Check "Write Contract" for admin functions

2. **Check Token Holders**:
   - Go to "Token" tab → "Holders"
   - Verify your test investors have tokens
   - Verify non-KYC users have 0 tokens

3. **Check Transaction History**:
   - Review mint transactions
   - Check transfer attempts (success/failure)
   - Verify compliance rejections

## What You Should See on Sepolia

### Token Contract Page
```
Contract Address: 0x1234...5678
Token Name: Security Token Example
Token Symbol: SECTOK
Decimals: 18
Total Supply: 2,500 SECTOK
```

### Token Holders
```
Holder                                      Balance
0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65  1,000 SECTOK  (Alice)
0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc    750 SECTOK  (Bob)
0x976EA74026E726554dB657fA54763abd0C3a0aa9    500 SECTOK  (Charlie)
0x14dC79964da2C08b23698B3D3cc7Ca32193d9955    250 SECTOK  (David)
```

### Recent Transactions
```
Mint    1,000 SECTOK to Alice     ✅ Success
Mint      750 SECTOK to Bob       ✅ Success
Transfer   50 SECTOK Alice→Bob    ✅ Success
Transfer   10 SECTOK Alice→NonKYC ❌ Failed (Compliance)
```

## Troubleshooting Sepolia Deployment

### Common Issues:

1. **"Insufficient funds" Error**
   ```bash
   # Check your deployer balance
   npm run check-balances -- --network sepolia
   ```
   - Get more Sepolia ETH from faucets
   - Wait for faucet cooldown periods

2. **"Network connection" Error**
   - Verify your RPC URL in `.env`
   - Try different RPC provider
   - Check internet connection

3. **"Transaction failed" Error**
   - Check gas prices are not too low
   - Verify contract addresses are correct
   - Ensure sufficient ETH for gas

### Debug Commands:

```bash
# Test network connection
npx hardhat run scripts/3-check-balances.ts --network sepolia

# Check specific transaction
# (Get transaction hash from deployment output)
# View on Sepolia Etherscan: sepolia.etherscan.io/tx/0xTxHash
```

## Post-Deployment Checklist

After successful Sepolia deployment:

### ✅ Verification Checklist
- [ ] Token contract visible on Sepolia Etherscan
- [ ] Contract is verified (green checkmark)
- [ ] Token holders show correct balances
- [ ] KYC compliance tests pass
- [ ] Transfer restrictions working
- [ ] Freeze/pause functionality works

### ✅ Documentation Checklist
- [ ] Save all contract addresses
- [ ] Record deployment transaction hashes
- [ ] Document test results
- [ ] Keep private keys secure

### ✅ Sharing Information
Your deployed token info to share:
```
Token Name: Security Token Example
Symbol: SECTOK
Network: Sepolia Testnet
Contract: 0xYourTokenAddress
Explorer: https://sepolia.etherscan.io/token/0xYourTokenAddress
Standard: ERC-3643 (Security Token)
Features: KYC Compliance, Transfer Restrictions
```

## Next Steps After Sepolia

1. **Test with Real Users**: Share token address for testing
2. **Frontend Development**: Build UI for token interactions
3. **Production Planning**: Prepare for mainnet deployment
4. **Legal Review**: Ensure regulatory compliance
5. **Security Audit**: Professional contract audit

## Quick Reference Commands

```bash
# Deploy to Sepolia
npm run run-complete-flow -- --network sepolia

# Check status
npm run check-balances -- --network sepolia

# Test transfers
npm run test-transfers -- --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia 0xTokenAddress

# View on Explorer
# https://sepolia.etherscan.io/address/0xYourTokenAddress
```

---

**Ready to deploy on Sepolia? Follow the steps above and your ERC-3643 security token will be live on the public testnet!** 