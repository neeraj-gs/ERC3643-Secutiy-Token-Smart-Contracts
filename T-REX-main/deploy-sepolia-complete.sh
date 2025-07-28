#!/bin/bash

# Complete ERC-3643 Sepolia Deployment Script
# For custom deployer: 0x38498f498f8679c1f43A08891192e2F5e728a1bB

set -e  # Exit on any error

echo "🚀 COMPLETE ERC-3643 SEPOLIA DEPLOYMENT"
echo "======================================="
echo "📍 Deployer: 0x38498f498f8679c1f43A08891192e2F5e728a1bB"
echo ""

# Check if .env exists and has been configured
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "   Run: ./setup-custom-deployer.sh first"
    exit 1
fi

if grep -q "YOUR_PRIVATE_KEY_HERE" .env; then
    echo "❌ .env file not configured!"
    echo "   Edit .env and add your private key for 0x38498f498f8679c1f43A08891192e2F5e728a1bB"
    exit 1
fi

echo "✅ Environment configured"

# Function to run command and check success
run_step() {
    local step_name="$1"
    local command="$2"
    
    echo ""
    echo "🔄 $step_name"
    echo "   Command: $command"
    echo ""
    
    if eval $command; then
        echo "✅ $step_name - SUCCESS"
    else
        echo "❌ $step_name - FAILED"
        echo "   Check logs above for details"
        exit 1
    fi
}

# Step 1: Check balances
run_step "STEP 1: Checking initial balances" \
    "npm run check-balances -- --network sepolia"

# Step 2: Deploy T-REX Suite
run_step "STEP 2: Deploying T-REX Suite" \
    "npm run deploy-trex -- --network sepolia"

# Step 3: Fund other wallets from deployer
run_step "STEP 3: Funding test wallets" \
    "npm run fund-wallets -- --network sepolia"

# Step 4: Setup KYC system
run_step "STEP 4: Setting up KYC system" \
    "npm run setup-kyc -- --network sepolia"

# Step 5: Mint and distribute tokens
run_step "STEP 5: Minting and distributing tokens" \
    "npm run mint-tokens -- --network sepolia"

# Step 6: Test transfers and compliance
run_step "STEP 6: Testing transfers and compliance" \
    "npm run test-transfers -- --network sepolia"

# Final status
echo ""
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "====================================="
echo ""

# Show contract addresses
if [ -f "test-data/deployed-contracts.json" ]; then
    echo "📋 DEPLOYED CONTRACTS:"
    echo ""
    node -e "
    const contracts = require('./test-data/deployed-contracts.json');
    console.log('Token Contract:', contracts.token);
    console.log('Identity Registry:', contracts.identityRegistry);
    console.log('Compliance:', contracts.compliance);
    console.log('Claim Topics Registry:', contracts.claimTopicsRegistry);
    console.log('Trusted Issuers Registry:', contracts.trustedIssuersRegistry);
    console.log('Token ONCHAINID:', contracts.tokenONCHAINID);
    console.log('Claim Issuer:', contracts.claimIssuer);
    "
    echo ""
fi

# Show Etherscan links
echo "🔗 ETHERSCAN LINKS (Sepolia Testnet):"
echo ""
node -e "
const contracts = require('./test-data/deployed-contracts.json');
console.log('Token Contract:');
console.log('  https://sepolia.etherscan.io/address/' + contracts.token);
console.log('');
console.log('Token Page (view transfers, holders):');
console.log('  https://sepolia.etherscan.io/token/' + contracts.token);
console.log('');
console.log('All Contracts:');
Object.entries(contracts).forEach(([name, address]) => {
  console.log('  ' + name + ': https://sepolia.etherscan.io/address/' + address);
});
"

echo ""
echo "📊 QUICK STATUS CHECK:"
echo ""
node -e "
async function quickStatus() {
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
  
  console.log('Token Info:');
  console.log('  Name:', await token.name());
  console.log('  Symbol:', await token.symbol());
  console.log('  Total Supply:', ethers.utils.formatUnits(await token.totalSupply(), 18));
  console.log('');
  
  console.log('Investor Balances:');
  const investors = wallets.filter(w => w.role.includes('investor'));
  for (const investor of investors) {
    const balance = await token.balanceOf(investor.address);
    console.log('  ' + investor.role + ':', ethers.utils.formatUnits(balance, 18), 'tokens');
  }
}
quickStatus().catch(console.error);
"

echo ""
echo "🧪 NEXT: TEST YOUR TOKEN"
echo "========================"
echo ""
echo "1. INTERACTIVE TESTING:"
echo "   npx hardhat console --network sepolia"
echo "   (Use commands from the guide below)"
echo ""
echo "2. VIEW ON ETHERSCAN:"
echo "   Open the token page and explore transfers, holders, etc."
echo ""
echo "3. RUN ADDITIONAL TESTS:"
echo "   npm run test-transfers -- --network sepolia"
echo ""
echo "4. CHECK STATUS ANYTIME:"
echo "   npm run check-balances -- --network sepolia"
echo ""
echo "📁 All deployment data saved in test-data/ directory"
echo "✅ Ready for testing and transfers!" 