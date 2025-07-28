#!/bin/bash

# ERC-3643 Sepolia Setup Script

echo "🚀 Setting up ERC-3643 for Sepolia deployment"

# Create .env file template
cat > .env << 'EOF'
# Sepolia Testnet Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161
PRIVATE_KEY=YOUR_DEPLOYER_PRIVATE_KEY_FROM_WALLETS_JSON
GAS_PRICE=20000000000
GAS_LIMIT=8000000
EOF

echo "✅ Created .env file template"

# Generate wallets first
echo "📝 Generating wallets..."
npm run generate-wallets

# Get deployer private key
DEPLOYER_KEY=$(node -e "
const wallets = require('./test-data/wallets.json');
const deployer = wallets.find(w => w.role === 'deployer');
console.log(deployer.privateKey);
")

# Update .env with actual private key
sed -i "s/YOUR_DEPLOYER_PRIVATE_KEY_FROM_WALLETS_JSON/$DEPLOYER_KEY/" .env

echo "✅ Updated .env with deployer private key"
echo "📍 Deployer address to fund:"
node -e "
const wallets = require('./test-data/wallets.json');
const deployer = wallets.find(w => w.role === 'deployer');
console.log('Address:', deployer.address);
console.log('Fund at: https://sepoliafaucet.com/');
"

echo ""
echo "🎯 Next steps:"
echo "1. Fund deployer address with Sepolia ETH (minimum 0.5 ETH)"
echo "2. Run: npm run deploy:sepolia"
echo "3. Check deployment with: cat test-data/deployed-contracts.json" 