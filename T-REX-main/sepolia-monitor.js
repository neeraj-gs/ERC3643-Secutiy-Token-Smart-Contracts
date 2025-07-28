const ethers = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function monitorSepolia() {
    try {
        console.log('📊 SEPOLIA DEPLOYMENT MONITOR');
        console.log('==============================');
        
        // Check if deployment files exist
        if (!fs.existsSync('test-data/deployed-contracts.json')) {
            console.log('❌ No deployment found. Run: npm run deploy:sepolia');
            return;
        }
        
        const contracts = JSON.parse(fs.readFileSync('test-data/deployed-contracts.json'));
        const wallets = JSON.parse(fs.readFileSync('test-data/wallets.json'));
        
        // Connect to Sepolia
        const provider = new ethers.providers.JsonRpcProvider(
            process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
        );
        
        const token = new ethers.Contract(contracts.token, [
            'function balanceOf(address) view returns (uint256)',
            'function totalSupply() view returns (uint256)',
            'function name() view returns (string)',
            'function symbol() view returns (string)',
            'function decimals() view returns (uint8)',
            'function paused() view returns (bool)'
        ], provider);
        
        // Basic token info
        console.log('🪙 TOKEN INFO:');
        console.log('Name:', await token.name());
        console.log('Symbol:', await token.symbol());
        console.log('Decimals:', await token.decimals());
        console.log('Total Supply:', ethers.utils.formatUnits(await token.totalSupply(), 18));
        console.log('Paused:', await token.paused());
        console.log('Address:', contracts.token);
        console.log('Etherscan: https://sepolia.etherscan.io/token/' + contracts.token);
        console.log('');
        
        // Contract addresses
        console.log('🏗️ CONTRACT ADDRESSES:');
        Object.entries(contracts).forEach(([name, address]) => {
            console.log(`${name}: ${address}`);
            console.log(`  View: https://sepolia.etherscan.io/address/${address}`);
        });
        console.log('');
        
        // Investor balances
        console.log('💰 INVESTOR BALANCES:');
        const investors = wallets.filter(w => w.role.includes('investor'));
        let totalDistributed = ethers.BigNumber.from(0);
        
        for (const investor of investors) {
            const balance = await token.balanceOf(investor.address);
            const ethBalance = await provider.getBalance(investor.address);
            totalDistributed = totalDistributed.add(balance);
            
            console.log(`${investor.role}:`);
            console.log(`  Address: ${investor.address}`);
            console.log(`  Tokens: ${ethers.utils.formatUnits(balance, 18)} SECTOK`);
            console.log(`  ETH: ${ethers.utils.formatEther(ethBalance)}`);
            console.log(`  View: https://sepolia.etherscan.io/address/${investor.address}`);
            console.log('');
        }
        
        console.log('📈 SUMMARY:');
        console.log(`Total Distributed: ${ethers.utils.formatUnits(totalDistributed, 18)} SECTOK`);
        console.log(`Investors Count: ${investors.length}`);
        
        // Check KYC status if available
        if (fs.existsSync('test-data/investor-identities.json')) {
            const identities = JSON.parse(fs.readFileSync('test-data/investor-identities.json'));
            console.log(`KYC Identities: ${identities.length}`);
            
            console.log('');
            console.log('🆔 ONCHAINID CONTRACTS:');
            identities.forEach(identity => {
                const wallet = wallets.find(w => w.address === identity.investorAddress);
                console.log(`${wallet.role}:`);
                console.log(`  ONCHAINID: ${identity.identityAddress}`);
                console.log(`  View: https://sepolia.etherscan.io/address/${identity.identityAddress}`);
            });
        }
        
        // Check test results if available
        if (fs.existsSync('test-data/transfer-test-results.json')) {
            const results = JSON.parse(fs.readFileSync('test-data/transfer-test-results.json'));
            console.log('');
            console.log('🧪 TEST RESULTS:');
            results.forEach((test, i) => {
                const status = test.actualResult === test.expectedResult ? '✅' : '❌';
                console.log(`${status} Test ${i+1}: ${test.description}`);
                if (test.transactionHash) {
                    console.log(`  TX: https://sepolia.etherscan.io/tx/${test.transactionHash}`);
                }
            });
        }
        
        console.log('');
        console.log('🎯 QUICK ACTIONS:');
        console.log('Check balances: npm run check-balances -- --network sepolia');
        console.log('Run tests: npm run test-transfers -- --network sepolia');
        console.log('Console: npx hardhat console --network sepolia');
        
    } catch (error) {
        console.error('Error monitoring deployment:', error.message);
        console.log('Make sure you have deployed to Sepolia first: npm run deploy:sepolia');
    }
}

// Run if called directly
if (require.main === module) {
    monitorSepolia();
}

module.exports = { monitorSepolia }; 