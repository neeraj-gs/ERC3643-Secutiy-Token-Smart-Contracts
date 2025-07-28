#!/bin/bash

# ERC-3643 Custom Deployer Setup Script for Sepolia

echo "🚀 Setting up ERC-3643 with CUSTOM DEPLOYER for Sepolia deployment"
echo "📍 Custom Deployer Address: 0x38498f498f8679c1f43A08891192e2F5e728a1bB"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Generate wallets with custom deployer
echo "📝 Generating wallets with your custom deployer address..."
npx hardhat run scripts/1-generate-wallets-custom.ts

# Create .env file with custom settings
echo "⚙️  Creating .env configuration..."
cat > .env << 'EOF'
# Sepolia Testnet Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161

# Your custom deployer private key (for address 0x38498f498f8679c1f43A08891192e2F5e728a1bB)
# ⚠️ REPLACE WITH YOUR ACTUAL PRIVATE KEY ⚠️
PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
DEPLOYER_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE

# Gas settings for Sepolia
GAS_PRICE=20000000000
GAS_LIMIT=8000000

# Optional: Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here
EOF

echo "✅ Created .env file template"
echo ""
echo "🔑 IMPORTANT - YOU MUST UPDATE THE .env FILE:"
echo "   Edit .env and replace 'YOUR_PRIVATE_KEY_HERE' with your actual private key"
echo "   for address 0x38498f498f8679c1f43A08891192e2F5e728a1bB"
echo ""

# Check if the private key is set
if grep -q "YOUR_PRIVATE_KEY_HERE" .env; then
    echo "⚠️  WARNING: .env file still contains placeholder private key"
    echo "   Please edit .env file before proceeding with deployment"
    echo ""
    echo "📝 To edit: nano .env"
    echo "   OR use your preferred text editor"
else
    echo "✅ Private key appears to be configured"
fi

echo ""
echo "📋 DEPLOYMENT CHECKLIST:"
echo "   ✅ Dependencies installed"
echo "   ✅ Custom wallets generated"
echo "   ✅ .env file created"
echo "   ⏳ Edit .env with your private key"
echo "   ⏳ Verify Sepolia ETH balance (need ~0.5 ETH minimum)"
echo ""
echo "🎯 NEXT STEPS:"
echo "   1. Edit .env file with your private key"
echo "   2. Check your Sepolia ETH balance:"
echo "      curl -X POST https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161 \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_getBalance\",\"params\":[\"0x38498f498f8679c1f43A08891192e2F5e728a1bB\",\"latest\"],\"id\":1}'"
echo ""
echo "   3. Run full deployment:"
echo "      ./deploy-sepolia-complete.sh"
echo ""
echo "   4. OR run step by step:"
echo "      npm run check-balances -- --network sepolia"
echo "      npm run deploy-trex -- --network sepolia"
echo "      npm run setup-kyc -- --network sepolia"
echo "      npm run mint-tokens -- --network sepolia"
echo "      npm run test-transfers -- --network sepolia"

# Make script executable
chmod +x deploy-sepolia-complete.sh 2>/dev/null || true 