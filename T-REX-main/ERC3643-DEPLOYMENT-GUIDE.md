# ERC-3643 Security Token Deployment Guide

This guide provides step-by-step instructions for deploying ERC-3643 compliant security tokens using the T-REX protocol on Sepolia testnet or Hardhat local network.

## Table of Contents

1. [What is ERC-3643?](#what-is-erc-3643)
2. [KYC Data Storage and Usage](#kyc-data-storage-and-usage)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Network Setup](#network-setup)
6. [Deployment Methods](#deployment-methods)
7. [Step-by-Step Manual Deployment](#step-by-step-manual-deployment)
8. [Testing and Verification](#testing-and-verification)
9. [Understanding the Output](#understanding-the-output)
10. [Troubleshooting](#troubleshooting)

## What is ERC-3643?

ERC-3643 is a token standard specifically designed for security tokens (real-world assets tokenized on blockchain). Unlike regular ERC-20 tokens, ERC-3643 tokens include:

### Key Features:
- **Built-in Compliance**: Only KYC-verified users can hold and transfer tokens
- **On-chain Identity**: Each participant has an ONCHAINID with verifiable claims
- **Modular Compliance**: Flexible rules for different jurisdictions and regulations
- **Agent System**: Authorized agents can manage token operations
- **Pause/Freeze**: Emergency controls for regulatory compliance

### Architecture Components:
1. **Token Contract**: The ERC-3643 compliant token
2. **Identity Registry**: Manages eligible token holders
3. **ONCHAINID**: Decentralized identity for each participant
4. **Claim Issuers**: Entities that provide KYC verification
5. **Compliance Module**: Enforces regulatory rules
6. **Trusted Issuers Registry**: Manages authorized KYC providers
7. **Claim Topics Registry**: Defines required verification types

## KYC Data Storage and Usage

### How KYC Works in ERC-3643:

1. **Identity Creation**: Each user gets an ONCHAINID (smart contract identity)
2. **Claim Issuance**: KYC providers add encrypted claims to user identities  
3. **On-chain Verification**: The Identity Registry verifies claims before allowing transfers
4. **Privacy Protection**: KYC data is hashed/encrypted, not stored in plain text
5. **Compliance Enforcement**: Only verified users can hold/transfer tokens

### KYC Data Flow:
```
User → KYC Provider → ONCHAINID Claims → Identity Registry → Token Transfers
```

### Where KYC Data is Stored:
- **ONCHAINID Contract**: Contains user's identity and claims
- **Identity Registry**: Maps user addresses to their ONCHAINID
- **Trusted Issuers Registry**: Lists authorized KYC providers
- **Claims**: Encrypted/hashed KYC data attached to identities

## Prerequisites

### Required Software:
- Node.js (v16 or higher)
- npm or yarn
- Git

### Required Accounts:
- Ethereum wallet with private key
- Sepolia testnet ETH (for testnet deployment)
- Infura/Alchemy API key (for Sepolia)

### Knowledge Requirements:
- Basic understanding of Ethereum and smart contracts
- Familiarity with command line operations
- Understanding of KYC/AML compliance requirements

## Installation

1. **Clone the repository:**
```bash
git clone https://github.com/TokenySolutions/T-REX.git
cd T-REX
```

2. **Install dependencies:**
```bash
npm install
```

3. **Compile contracts:**
```bash
npx hardhat compile
```

## Network Setup

### For Hardhat Local Network:
No additional setup required. The scripts will automatically use pre-funded accounts.

### For Sepolia Testnet:

1. **Create environment file:**
```bash
cp .env.template .env
```

2. **Configure `.env` file:**
```env
# Sepolia RPC URL - Get from Infura, Alchemy, or other provider
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR-PROJECT-ID

# Main deployer private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

3. **Get Sepolia ETH:**
- Visit faucets: [Sepolia Faucet](https://sepoliafaucet.com/), [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
- You need at least 1 ETH for complete deployment and testing

## Deployment Methods

### Method 1: Complete Automated Flow (Recommended)

**For Hardhat (Local Testing):**
```bash
npm run deploy:hardhat
```

**For Sepolia (Testnet):**
```bash
npm run run-complete-flow -- --network sepolia
```

This runs all steps automatically:
1. Generate wallets
2. Deploy T-REX suite
3. Setup KYC claims
4. Mint and distribute tokens
5. Test transfers and compliance
6. Generate final report

### Method 2: Step-by-Step Manual Deployment

For more control over the process, run each step individually:

## Step-by-Step Manual Deployment

### Step 1: Generate Test Wallets
```bash
npm run generate-wallets
```

**What this does:**
- Creates 10 test wallets for different roles
- Saves wallet data to `test-data/wallets.json`
- Generates `.env.template` with deployer private key

**Output:**
- `test-data/wallets.json`: All wallet information
- `.env.template`: Environment variables template

### Step 2: Fund Wallets (Sepolia only)
```bash
npm run fund-wallets -- --network sepolia
```

**What this does:**
- Distributes ETH to all test wallets
- Amounts based on role requirements
- Deployer gets most ETH for contract deployment

**Note:** For Hardhat network, wallets are pre-funded automatically.

### Step 3: Check Balances
```bash
npm run check-balances -- --network sepolia
```

**What this does:**
- Shows ETH balances for all wallets
- Displays token balances if contracts are deployed
- Indicates which wallets need funding

### Step 4: Deploy T-REX Suite
```bash
npm run deploy-trex -- --network sepolia
```

**What this does:**
- Deploys all implementation contracts
- Sets up implementation authorities
- Deploys factory contracts
- Creates token ONCHAINID
- Deploys claim issuer
- Deploys complete T-REX suite using factory
- Configures token (unpauses)

**Output:**
- `test-data/deployed-contracts.json`: All contract addresses
- `test-data/claim-issuer-signing-key.json`: KYC signing key

### Step 5: Setup KYC Claims
```bash
npm run setup-kyc -- --network sepolia
```

**What this does:**
- Creates ONCHAINID for each investor
- Issues KYC claims for each investor
- Registers investors in Identity Registry
- Verifies all registrations

**Output:**
- `test-data/investor-identities.json`: Investor identity data

### Step 6: Mint and Distribute Tokens
```bash
npm run mint-tokens -- --network sepolia
```

**What this does:**
- Checks investor eligibility (KYC verification)
- Mints tokens to verified investors
- Tests compliance by attempting transfer to non-KYC user
- Records all distributions

**Distribution Plan:**
- Alice: 1,000 tokens
- Bob: 750 tokens  
- Charlie: 500 tokens
- David: 250 tokens

**Output:**
- `test-data/token-distribution.json`: Distribution records

### Step 7: Test Transfers and Compliance
```bash
npm run test-transfers -- --network sepolia
```

**What this does:**
- Tests valid transfers between KYC users
- Tests invalid transfers to non-KYC users
- Tests freeze functionality
- Tests pause functionality
- Generates comprehensive test report

**Output:**
- `test-data/transfer-test-results.json`: Test results

## Testing and Verification

### Individual Script Testing:

**Test single transfer:**
```bash
npm run test-transfers -- --network sepolia single investor1_alice investor2_bob 25
```

**Check transfer eligibility:**
```bash
npm run mint-tokens -- --network sepolia check 0xFromAddress 0xToAddress 10
```

**Verify specific claim:**
```bash
npm run setup-kyc -- --network sepolia verify 0xInvestorAddress
```

### Understanding Test Results:

The transfer tests verify:
- ✅ KYC-verified users can transfer to each other
- ❌ Transfers to non-KYC users are blocked
- ❌ Transfers from non-KYC users are blocked
- ✅ Freeze functionality works correctly
- ✅ Pause functionality works correctly

## Understanding the Output

### Generated Files:

1. **`test-data/wallets.json`**
   - All test wallet addresses and private keys
   - Role assignments for testing

2. **`test-data/deployed-contracts.json`**
   - All deployed contract addresses
   - Token details (name, symbol, decimals)
   - Network information

3. **`test-data/claim-issuer-signing-key.json`**
   - KYC claim issuer's signing key
   - Used to create and verify KYC claims

4. **`test-data/investor-identities.json`**
   - ONCHAINID addresses for each investor
   - Country codes and claim data
   - Identity registry status

5. **`test-data/token-distribution.json`**
   - Token minting transactions
   - Distribution amounts per investor
   - Timestamp and network info

6. **`test-data/transfer-test-results.json`**
   - Complete test results
   - Success/failure status for each test
   - Compliance verification results

7. **`test-data/final-report.json`**
   - Summary of entire deployment
   - Statistics and key metrics
   - Links to all other data files

### Key Contract Addresses:

After deployment, you'll have these main contracts:
- **Token**: Your ERC-3643 security token
- **Identity Registry**: Manages eligible holders
- **Compliance**: Enforces regulatory rules
- **Claim Issuer**: Issues KYC verifications
- **Factory**: Deploys new T-REX suites

## Troubleshooting

### Common Issues:

1. **"Insufficient balance" Error:**
   - Ensure deployer wallet has enough ETH
   - For Sepolia, get more ETH from faucets
   - Check gas prices and adjust accordingly

2. **"Wallets file not found" Error:**
   - Run `npm run generate-wallets` first
   - Ensure `test-data` directory exists

3. **"Cannot find module" Errors:**
   - Run `npm install` to install dependencies
   - Ensure all packages are installed correctly

4. **"Network connection" Errors:**
   - Check your internet connection
   - Verify RPC URL in `.env` file
   - Try different RPC provider

5. **"Transaction reverted" Errors:**
   - Usually indicates compliance rules working correctly
   - Check if addresses have valid KYC claims
   - Verify contract permissions and roles

### Debug Commands:

**Check specific balance:**
```bash
npm run check-balances -- --network sepolia 0xSpecificAddress
```

**Verify contract deployment:**
```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS [constructor args]
```

**Test network connection:**
```bash
npx hardhat run scripts/3-check-balances.ts --network sepolia
```

### Getting Help:

1. Check the console output for detailed error messages
2. Review the generated JSON files for deployment status
3. Verify all prerequisites are met
4. Ensure sufficient ETH for all operations
5. Check T-REX documentation for additional details

## Security Warnings

⚠️ **IMPORTANT SECURITY NOTES:**

1. **Test Networks Only**: These scripts are for testing. Never use generated wallets on mainnet.
2. **Private Key Security**: Keep all private keys secure and never share them.
3. **Environment Variables**: Never commit `.env` files to version control.
4. **Production Deployment**: For production, use secure key management and audited contracts.
5. **Compliance**: Ensure all regulatory requirements are met before production deployment.

## Next Steps

After successful deployment and testing:

1. **Audit Contracts**: Have contracts audited by security professionals
2. **Legal Review**: Ensure compliance with local regulations
3. **Production Setup**: Use secure infrastructure for production deployment
4. **User Onboarding**: Implement proper KYC process for real users
5. **Monitoring**: Set up monitoring and alerting systems

## Additional Resources

- [ERC-3643 Standard](https://eips.ethereum.org/EIPS/eip-3643)
- [T-REX Documentation](https://docs.erc3643.org/)
- [ONCHAINID Documentation](https://github.com/onchain-id/solidity)
- [Hardhat Documentation](https://hardhat.org/docs/)
- [Sepolia Testnet Info](https://sepolia.etherscan.io/)

## Support

For technical support and questions:
- GitHub Issues: [T-REX Repository](https://github.com/TokenySolutions/T-REX)
- Documentation: [ERC-3643 Docs](https://docs.erc3643.org/)
- Community: Join the ERC-3643 community discussions 