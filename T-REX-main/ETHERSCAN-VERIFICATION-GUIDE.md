# 🔍 Etherscan Verification Guide - ERC-3643 Token & KYC Data

## 📋 Table of Contents
1. [Getting Contract Addresses](#getting-contract-addresses)
2. [Token Contract Verification](#token-contract-verification)
3. [KYC Data on Blockchain](#kyc-data-on-blockchain)
4. [ONCHAINID Contract Analysis](#onchainid-contract-analysis)
5. [Compliance Data Verification](#compliance-data-verification)
6. [Administrative Actions Tracking](#administrative-actions-tracking)
7. [Transfer History Analysis](#transfer-history-analysis)

---

## 📋 Getting Contract Addresses

### **Step 1: Get All Deployed Contract Addresses**

```bash
# View all deployed contracts
cat test-data/deployed-contracts.json
```

### **Your Deployed Contracts on Sepolia:**

Based on your deployment, here are the key contract addresses:

**Main Token Contract:**
- **Token**: `0x2C787056dd1050B5fe33Df48DF42A3d4b809c352`

**Core Compliance Contracts:**
- **Identity Registry**: `0xB633Fb8866B2befde2CaA98Bd7695ECb6b266595`
- **Compliance Module**: `0x71Ea5d7CBAacFb8f4c139D70913802FA31a5C1Ed`
- **Claim Topics Registry**: `0x1B8100f882CA2592b6b2dDaD93850bcf9C8c98f0`
- **Trusted Issuers Registry**: `0xEf5A36DB20efDb7BC1DEB7411f978a165bE29893`

**Identity Contracts:**
- **Token ONCHAINID**: `0xD4a7B79F7888CcA2Fca08851aca220C2936e3C1D`
- **Claim Issuer**: `0xD114f945615A9C7504AE87804370cf459580302E`

### **Step 2: Generate Etherscan Links**

```bash
# Generate all Etherscan links
node -e "
const contracts = require('./test-data/deployed-contracts.json');
console.log('🔗 MAIN TOKEN CONTRACT:');
console.log('Token: https://sepolia.etherscan.io/token/' + contracts.token);
console.log('Contract: https://sepolia.etherscan.io/address/' + contracts.token);
console.log('');
console.log('🔗 CORE CONTRACTS:');
console.log('Identity Registry: https://sepolia.etherscan.io/address/' + contracts.identityRegistry);
console.log('Compliance: https://sepolia.etherscan.io/address/' + contracts.compliance);
console.log('Token ONCHAINID: https://sepolia.etherscan.io/address/' + contracts.tokenOnchainID);
console.log('Claim Issuer: https://sepolia.etherscan.io/address/' + contracts.claimIssuerContract);
"
```

---

## 🪙 Token Contract Verification

### **Main Token Page**
**URL**: `https://sepolia.etherscan.io/token/0x2C787056dd1050B5fe33Df48DF42A3d4b809c352`

### **What to Check on Token Page:**

#### **1. Token Information**
- ✅ **Name**: "Security Token Example"
- ✅ **Symbol**: "SECTOK"
- ✅ **Decimals**: 18
- ✅ **Total Supply**: Should show minted tokens
- ✅ **Contract Address**: `0x2C787056dd1050B5fe33Df48DF42A3d4b809c352`

#### **2. Token Holders Tab**
```
Expected Holders:
- Alice (investor1): Should have tokens
- Bob (investor2): Should have tokens  
- Charlie (investor3): Should have tokens
- David (investor4): Should have tokens
- Non-KYC users: Should have 0 tokens
```

#### **3. Transfers Tab**
```
What to Look For:
✅ Mint transactions (from 0x0 to investors)
✅ Transfer transactions between KYC investors
❌ No transfers to non-KYC addresses
✅ Administrative actions (if any)
```

### **Contract Details Page**
**URL**: `https://sepolia.etherscan.io/address/0x2C787056dd1050B5fe33Df48DF42A3d4b809c352`

#### **Contract Tab:**
- ✅ **Contract Creation**: Shows deployment transaction
- ✅ **Creator Address**: Your deployer address
- ✅ **Balance**: ETH balance (should be 0)

#### **Read Contract Tab:**
Key functions to check:
```solidity
1. name() → "Security Token Example"
2. symbol() → "SECTOK"
3. totalSupply() → Total minted tokens
4. decimals() → 18
5. paused() → false (if unpaused)
6. owner() → Token issuer address
7. identityRegistry() → Points to Identity Registry contract
8. compliance() → Points to Compliance contract
```

#### **Write Contract Tab:**
Available functions (if you connect wallet):
- `transfer()` - Transfer tokens (with compliance checks)
- `approve()` - Approve spending
- `pause()` - Pause token (admin only)

---

## 🆔 KYC Data on Blockchain

### **⚠️ IMPORTANT: What's NOT Stored On-Chain**

**KYC data that is NOT visible on Etherscan:**
- ❌ Personal information (names, addresses, documents)
- ❌ Plain text country names
- ❌ Identity documents or photos
- ❌ Actual KYC verification details

### **✅ What IS Stored On-Chain**

**Cryptographic proofs and hashes only:**
- ✅ **Claims exist** (yes/no verification)
- ✅ **Claim topics** (what type of verification)
- ✅ **Issuer addresses** (who verified)
- ✅ **Cryptographic signatures** (proof of authenticity)
- ✅ **Encrypted country codes** (if used)

### **How to Check KYC Status:**

#### **Method 1: Using Identity Registry Contract**

**URL**: `https://sepolia.etherscan.io/address/0xB633Fb8866B2befde2CaA98Bd7695ECb6b266595#readContract`

**Read Contract Functions:**
```solidity
1. isVerified(address) → Returns true/false
   - Input: Investor address
   - Output: Whether they have valid KYC

2. identity(address) → Returns ONCHAINID address
   - Input: Investor address  
   - Output: Their ONCHAINID contract address

3. investorCountry(address) → Returns country code
   - Input: Investor address
   - Output: Numeric country code (e.g., 840 = USA)

4. isFrozen(address) → Returns freeze status
   - Input: Investor address
   - Output: Whether account is frozen
```

#### **Method 2: Check Individual ONCHAINID Contracts**

```bash
# Get investor ONCHAINID addresses
cat test-data/investor-identities.json
```

**For each investor, visit their ONCHAINID contract:**
```
Alice's ONCHAINID: https://sepolia.etherscan.io/address/[ALICE_ONCHAINID_ADDRESS]
Bob's ONCHAINID: https://sepolia.etherscan.io/address/[BOB_ONCHAINID_ADDRESS]
```

### **Reading ONCHAINID Contract:**

#### **Contract Information:**
- ✅ **Claims Count**: Number of claims issued
- ✅ **Keys Count**: Number of management keys
- ✅ **Creation**: When identity was created

#### **Read Contract Functions:**
```solidity
1. getClaimIdsByTopic(uint256) → Returns claim IDs
   - Input: Topic ID (e.g., KYC topic)
   - Output: Array of claim IDs

2. getClaim(bytes32) → Returns claim details
   - Input: Claim ID
   - Output: Topic, scheme, issuer, signature, data

3. keyHasPurpose(bytes32, uint256) → Check key purpose
   - Input: Key hash, purpose (1=MANAGEMENT, 2=ACTION, 3=CLAIM)
   - Output: Whether key has that purpose
```

### **Interpreting KYC Claims:**

#### **Claim Structure:**
```solidity
struct Claim {
    uint256 topic;      // Claim type (KYC = specific hash)
    uint256 scheme;     // Signature scheme (1 = ECDSA)
    address issuer;     // Who issued the claim
    bytes signature;    // Cryptographic proof
    bytes data;         // Encrypted/hashed data
    string uri;         // Additional data URI (if any)
}
```

#### **What Each Field Means:**
- **Topic**: `0x6def3dd4b4c20aeb2df7976119029aa0e2f66598b64e287aaed2434dcc89a1e6` = KYC claim
- **Scheme**: `1` = ECDSA signature
- **Issuer**: Address of claim issuer contract
- **Signature**: Cryptographic proof that claim is valid
- **Data**: Encrypted country code or other compliance data

---

## 🛡️ Compliance Data Verification

### **Compliance Contract Analysis**
**URL**: `https://sepolia.etherscan.io/address/0x71Ea5d7CBAacFb8f4c139D70913802FA31a5C1Ed#readContract`

#### **Key Functions to Check:**
```solidity
1. canTransfer(address, address, uint256) → Compliance check
   - Test if a transfer would be allowed
   - Input: from, to, amount
   - Output: true/false

2. isTokenAgent(address) → Check agent status
   - Input: Address to check
   - Output: Whether address is a token agent

3. compliance() → Get compliance settings
   - Output: Current compliance configuration
```

### **Claim Topics Registry**
**URL**: `https://sepolia.etherscan.io/address/0x1B8100f882CA2592b6b2dDaD93850bcf9C8c98f0#readContract`

#### **Check Required Claims:**
```solidity
1. getClaimTopics() → Required claim types
   - Output: Array of required claim topic IDs
   - Should include KYC claim topic

2. claimTopicsCount() → Number of required claims
   - Output: How many claim types are required
```

### **Trusted Issuers Registry**
**URL**: `https://sepolia.etherscan.io/address/0xEf5A36DB20efDb7BC1DEB7411f978a165bE29893#readContract`

#### **Verify Claim Issuers:**
```solidity
1. isTrustedIssuer(address) → Check if issuer is trusted
   - Input: Claim issuer address
   - Output: Whether this issuer is authorized

2. getTrustedIssuers() → List all trusted issuers
   - Output: Array of authorized claim issuer addresses
```

---

## 👨‍💼 Administrative Actions Tracking

### **Transaction History Analysis**

#### **Token Agent Actions:**
Look for these transaction types in the token contract:
- `setAddressFrozen()` - Freeze/unfreeze accounts
- `pause()` / `unpause()` - Token-wide controls
- `forceTransfer()` - Administrative transfers

#### **Token Issuer Actions:**
- `mint()` - Token minting to verified addresses
- `burn()` - Token burning
- `setCompliance()` - Compliance updates

#### **Claim Issuer Actions:**
- `addClaim()` - Issuing KYC claims
- `removeClaim()` - Revoking claims
- `addKey()` - Adding signing keys

### **How to Find These Transactions:**

#### **Method 1: Contract Transaction History**
1. Go to token contract page
2. Click "Transactions" tab
3. Filter by method name (e.g., "mint", "freeze")

#### **Method 2: Address-Specific Search**
```
Search for transactions TO:
- Token contract: Administrative actions
- Identity Registry: KYC management
- Claim Issuer: Claim operations
```

---

## 📊 Transfer History Analysis

### **Analyzing Token Transfers**

#### **Token Transfer Page:**
**URL**: `https://sepolia.etherscan.io/token/0x2C787056dd1050B5fe33Df48DF42A3d4b809c352#tokenTrades`

#### **What to Look For:**

**✅ Valid Transfers (Should Exist):**
- KYC investor → KYC investor
- Mint transactions (0x0 → investor)
- Agent force transfers (if any)

**❌ Invalid Transfers (Should NOT Exist):**
- KYC investor → non-KYC address
- Non-KYC address → anyone
- Transfers during pause periods

#### **Transfer Details:**
Each transfer shows:
- **From/To**: Addresses involved
- **Amount**: Token quantity
- **Transaction Hash**: Link to full transaction
- **Timestamp**: When it occurred
- **Gas Used**: Cost of compliance checks

### **Analyzing Individual Transactions**

#### **Click on Transaction Hash to See:**
1. **Overview**: Basic transaction info
2. **Logs**: Event emissions (Transfer, Compliance checks)
3. **State Changes**: Balance updates
4. **Internal Transactions**: Contract-to-contract calls

#### **Expected Internal Calls for ERC-3643 Transfer:**
```
1. Token.transfer() called
   ↓
2. Token._beforeTokenTransfer() 
   ↓ 
3. Compliance.canTransfer()
   ↓
4. IdentityRegistry.isVerified() (2x calls)
   ↓
5. ONCHAINID.getClaim() (multiple calls)
   ↓
6. Token._transfer() (if approved)
```

---

## 🔍 Practical Verification Examples

### **Example 1: Verify Alice's KYC Status**

1. **Get Alice's address** from `test-data/wallets.json`
2. **Check Identity Registry**: 
   - Go to: `https://sepolia.etherscan.io/address/0xB633Fb8866B2befde2CaA98Bd7695ECb6b266595#readContract`
   - Call `isVerified(alice_address)`
   - Should return `true`

3. **Get Alice's ONCHAINID**:
   - Call `identity(alice_address)`
   - Get ONCHAINID contract address

4. **Check Alice's Claims**:
   - Go to Alice's ONCHAINID contract
   - Call `getClaimIdsByTopic(0x6def3dd4b4c20aeb2df7976119029aa0e2f66598b64e287aaed2434dcc89a1e6)`
   - Should return array with claim IDs

### **Example 2: Verify Transfer Compliance**

1. **Get recent transfer** from token transfers tab
2. **Check transaction details**:
   - Both addresses should be KYC verified
   - Transaction should succeed
   - Should see compliance contract calls in internal transactions

3. **Test compliance check**:
   - Go to Compliance contract
   - Call `canTransfer(from, to, amount)`
   - Should return `true` for KYC investors

### **Example 3: Check Administrative Actions**

1. **Search token contract transactions** for:
   - `mint` transactions
   - `setAddressFrozen` calls
   - `pause`/`unpause` calls

2. **Verify agent permissions**:
   - Check if transaction sender has agent role
   - Verify transaction succeeded

---

## 📋 Quick Verification Checklist

### **Token Verification ✅**
- [ ] Token name/symbol matches deployment
- [ ] Total supply matches minted amount
- [ ] Only KYC investors hold tokens
- [ ] Transfer history shows compliance

### **KYC Verification ✅**
- [ ] All investors show `isVerified() = true`
- [ ] Each investor has ONCHAINID contract
- [ ] ONCHAINID contracts have KYC claims
- [ ] Claims issued by trusted issuer

### **Compliance Verification ✅**
- [ ] Non-KYC addresses cannot receive tokens
- [ ] Frozen accounts cannot transfer
- [ ] Paused token blocks all transfers
- [ ] All transfers go through compliance checks

### **Administrative Verification ✅**
- [ ] Only agents can freeze accounts
- [ ] Only issuer can mint tokens
- [ ] Only authorized addresses can pause
- [ ] All admin actions leave audit trail

---

## 🎯 Summary

**On Etherscan, you can verify:**

✅ **Token Data**: Name, symbol, supply, holders, transfers  
✅ **KYC Status**: Whether addresses are verified (yes/no)  
✅ **Compliance**: Transfer validation, frozen accounts  
✅ **Administrative**: Agent actions, issuer operations  
✅ **Audit Trail**: Complete transaction history  

**You CANNOT see on Etherscan:**
❌ **Personal Data**: Names, documents, addresses  
❌ **Plain Text Info**: Actual identity details  
❌ **Private Keys**: Signing keys or sensitive data  

**The blockchain stores cryptographic proofs that verify identity without revealing personal information - this is the power of privacy-preserving compliance! 🔐** 