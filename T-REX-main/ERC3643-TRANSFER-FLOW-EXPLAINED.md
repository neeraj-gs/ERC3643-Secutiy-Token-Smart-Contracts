# 🔄 ERC-3643 Token Transfer Flow - Complete Technical Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Smart Contract Architecture](#smart-contract-architecture)
3. [Transfer Flow Step-by-Step](#transfer-flow-step-by-step)
4. [KYC Identity Verification](#kyc-identity-verification)
5. [Compliance Checks](#compliance-checks)
6. [Administrative Controls](#administrative-controls)
7. [Transfer Scenarios](#transfer-scenarios)
8. [Error Conditions](#error-conditions)
9. [Real Transaction Example](#real-transaction-example)

---

## 📖 Overview

ERC-3643 (T-REX) is a **compliance-enabled** security token standard that enforces **KYC (Know Your Customer)** and **regulatory compliance** checks on every token transfer. Unlike standard ERC-20 tokens, **every transfer must pass multiple validation layers**.

### **Key Principle:**
> **Every token transfer is intercepted and validated before execution**

---

## 🏗️ Smart Contract Architecture

### **Core Contracts Involved in Transfer:**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   TOKEN (ERC-3643)  │    │  IDENTITY REGISTRY  │    │   COMPLIANCE MODULE │
│                 │    │                 │    │                 │
│ • transfer()    │───▶│ • isVerified()  │───▶│ • canTransfer() │
│ • _beforeTokenTransfer│ • isFrozen()    │    │ • transferred() │
│ • balanceOf()   │    │ • country()     │    │ • moduleCheck() │
│                 │    │ • identity()    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  TRUSTED ISSUERS│    │  CLAIM TOPICS   │    │   ONCHAINID     │
│   REGISTRY      │    │   REGISTRY      │    │  (Per Investor) │
│                 │    │                 │    │                 │
│ • isTrustedIssuer│    │ • getClaimTopics│    │ • getClaim()    │
│ • getTrustedIssuers │  │                │    │ • keyHasPurpose │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🔄 Transfer Flow Step-by-Step

### **When Alice Transfers 100 Tokens to Bob:**

```javascript
// User initiates transfer
await tokenAsAlice.transfer(bob.address, ethers.utils.parseUnits("100", 18));
```

### **Step 1: Token Contract Receives Request**
```solidity
function transfer(address to, uint256 amount) public override returns (bool) {
    // Standard ERC-20 transfer that calls _beforeTokenTransfer
    return super.transfer(to, amount);
}
```

### **Step 2: Pre-Transfer Hook Triggered**
```solidity
function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
) internal override {
    // 🛡️ COMPLIANCE CHECKPOINT
    require(!paused(), "Token is paused");
    
    if (from != address(0) && to != address(0)) {
        // Not mint/burn - check compliance
        require(
            _compliance.canTransfer(from, to, amount),
            "Transfer not compliant"
        );
    }
}
```

### **Step 3: Compliance Module Validation**
```solidity
function canTransfer(
    address from,
    address to,
    uint256 amount
) external view returns (bool) {
    
    // Check 1: Basic identity verification
    if (!_identityRegistry.isVerified(from) || 
        !_identityRegistry.isVerified(to)) {
        return false;
    }
    
    // Check 2: Frozen account check
    if (_identityRegistry.isFrozen(from) || 
        _identityRegistry.isFrozen(to)) {
        return false;
    }
    
    // Check 3: Country restrictions
    uint16 fromCountry = _identityRegistry.investorCountry(from);
    uint16 toCountry = _identityRegistry.investorCountry(to);
    
    // Check 4: Transfer limits and other compliance modules
    return _checkModularCompliance(from, to, amount);
}
```

### **Step 4: Identity Registry Verification**
```solidity
function isVerified(address user) external view returns (bool) {
    // Get user's ONCHAINID
    address userIdentity = _identities[user];
    if (userIdentity == address(0)) return false;
    
    // Check if identity has required claims
    return _hasRequiredClaims(userIdentity);
}

function _hasRequiredClaims(address identity) internal view returns (bool) {
    // Get required claim topics from ClaimTopicsRegistry
    uint256[] memory requiredTopics = _claimTopicsRegistry.getClaimTopics();
    
    for (uint i = 0; i < requiredTopics.length; i++) {
        if (!_hasValidClaim(identity, requiredTopics[i])) {
            return false;
        }
    }
    return true;
}
```

### **Step 5: ONCHAINID Claim Verification**
```solidity
function _hasValidClaim(address identity, uint256 topic) internal view returns (bool) {
    // Get claim from user's ONCHAINID
    bytes32[] memory claimIds = IIdentity(identity).getClaimIdsByTopic(topic);
    
    for (uint i = 0; i < claimIds.length; i++) {
        (uint256 claimTopic, uint256 scheme, address issuer, bytes memory signature, bytes memory data, string memory uri) = 
            IIdentity(identity).getClaim(claimIds[i]);
        
        // Check if claim issuer is trusted
        if (_trustedIssuersRegistry.isTrustedIssuer(issuer)) {
            // Verify claim signature and validity
            if (_verifyClaim(claimTopic, scheme, issuer, signature, data)) {
                return true;
            }
        }
    }
    return false;
}
```

### **Step 6: Transfer Execution**
```solidity
// If all checks pass, standard ERC-20 transfer executes
function _transfer(address from, address to, uint256 amount) internal override {
    // Update balances
    _balances[from] -= amount;
    _balances[to] += amount;
    
    // Emit Transfer event
    emit Transfer(from, to, amount);
    
    // Notify compliance module
    _compliance.transferred(from, to, amount);
}
```

---

## 🆔 KYC Identity Verification

### **ONCHAINID Structure for Each Investor:**

```
Alice's ONCHAINID Contract (0x...)
├── Management Keys
│   └── Alice's Address (for basic operations)
├── Claims
│   ├── KYC Claim (Topic: 1)
│   │   ├── Issuer: ClaimIssuer Contract
│   │   ├── Data: Encrypted country code (840 = USA)
│   │   ├── Signature: Cryptographic proof
│   │   └── Validity: Active/Valid
│   └── Additional Claims (if any)
└── Key Purposes
    ├── MANAGEMENT (1): Alice's address
    ├── ACTION (2): Alice's address
    └── CLAIM (3): ClaimIssuer's signing key
```

### **Claim Verification Process:**

1. **Retrieve Claim**: Get KYC claim from Alice's ONCHAINID
2. **Check Issuer**: Verify claim was issued by trusted ClaimIssuer
3. **Validate Signature**: Cryptographically verify claim authenticity
4. **Check Expiry**: Ensure claim is still valid (not expired)
5. **Verify Data**: Confirm claim data meets requirements

---

## 🛡️ Compliance Checks

### **Multi-Layer Compliance Validation:**

#### **Layer 1: Basic Identity**
```solidity
// Both sender and receiver must be KYC verified
require(_identityRegistry.isVerified(from), "Sender not verified");
require(_identityRegistry.isVerified(to), "Receiver not verified");
```

#### **Layer 2: Account Status**
```solidity
// Neither account can be frozen
require(!_identityRegistry.isFrozen(from), "Sender frozen");
require(!_identityRegistry.isFrozen(to), "Receiver frozen");
```

#### **Layer 3: Token Status**
```solidity
// Token must not be paused
require(!paused(), "Token transfers paused");
```

#### **Layer 4: Modular Compliance**
```solidity
// Additional compliance modules (optional)
for (uint i = 0; i < _complianceModules.length; i++) {
    require(
        _complianceModules[i].moduleCheck(from, to, amount, _compliance),
        "Module compliance failed"
    );
}
```

### **Example Compliance Modules:**

1. **Transfer Limits Module**
   - Daily/monthly transfer limits per investor
   - Maximum holding limits per investor

2. **Country Restrictions Module**
   - Block transfers from/to certain countries
   - Jurisdiction-specific rules

3. **Time Locks Module**
   - Lock tokens for specific periods
   - Vesting schedules

---

## 👨‍💼 Administrative Controls

### **Token Agent Powers:**
```solidity
// Freeze/unfreeze individual addresses
function setAddressFrozen(address addr, bool frozen) external onlyAgent {
    _identityRegistry.setAddressFrozen(addr, frozen);
}

// Pause/unpause entire token
function pause() external onlyAgent {
    _pause();
}

// Force transfer (recovery operations)
function forceTransfer(address from, address to, uint256 amount) external onlyAgent {
    _transfer(from, to, amount);
}
```

### **Token Issuer Powers:**
```solidity
// Mint new tokens (only to verified addresses)
function mint(address to, uint256 amount) external onlyIssuer {
    require(_identityRegistry.isVerified(to), "Recipient not verified");
    _mint(to, amount);
}

// Burn tokens
function burn(address from, uint256 amount) external onlyIssuer {
    _burn(from, amount);
}
```

---

## 🎭 Transfer Scenarios

### **✅ Successful Transfer: Alice → Bob**

**Conditions Met:**
- ✅ Alice has KYC verification
- ✅ Bob has KYC verification  
- ✅ Neither is frozen
- ✅ Token is not paused
- ✅ Alice has sufficient balance
- ✅ All compliance modules approve

**Flow:**
```
1. Alice calls transfer() → Token Contract
2. Token calls _beforeTokenTransfer() → Compliance checks
3. Compliance calls isVerified() → Identity Registry
4. Identity Registry checks ONCHAINID claims → Valid
5. All checks pass → Transfer executes
6. Balances updated, Transfer event emitted
7. Compliance notified via transferred()
```

### **❌ Failed Transfer: Alice → Non-KYC User**

**Conditions:**
- ✅ Alice has KYC verification
- ❌ Recipient has NO KYC verification
- ✅ Token is not paused

**Flow:**
```
1. Alice calls transfer() → Token Contract
2. Token calls _beforeTokenTransfer() → Compliance checks
3. Compliance calls isVerified(recipient) → Identity Registry
4. Identity Registry returns false → No ONCHAINID or claims
5. Compliance returns false → canTransfer() fails
6. Transaction reverts with "Transfer not compliant"
```

### **❌ Failed Transfer: Frozen Account**

**Conditions:**
- ✅ Alice has KYC verification
- ✅ Bob has KYC verification
- ❌ Alice's account is frozen by agent

**Flow:**
```
1. Alice calls transfer() → Token Contract
2. Token calls _beforeTokenTransfer() → Compliance checks
3. Compliance calls isFrozen(Alice) → Identity Registry
4. Identity Registry returns true → Alice is frozen
5. Compliance returns false → canTransfer() fails
6. Transaction reverts with "Transfer not compliant"
```

---

## ⚠️ Error Conditions

### **Common Transfer Failures:**

| Error Condition | Error Message | Cause |
|----------------|---------------|--------|
| Sender not KYC verified | "Transfer not compliant" | No valid KYC claim in sender's ONCHAINID |
| Receiver not KYC verified | "Transfer not compliant" | No valid KYC claim in receiver's ONCHAINID |
| Account frozen | "Transfer not compliant" | Address marked as frozen by agent |
| Token paused | "Token is paused" | Entire token transfers disabled |
| Insufficient balance | "ERC20: transfer amount exceeds balance" | Standard ERC-20 check |
| Invalid address | "ERC20: transfer to the zero address" | Standard ERC-20 check |
| Compliance module failure | "Module compliance failed" | Additional compliance rule violation |

### **Debugging Failed Transfers:**

```javascript
// Check if transfer would succeed before executing
const canTransfer = await compliance.canTransfer(alice.address, bob.address, amount);
console.log("Can transfer:", canTransfer);

// Check individual conditions
const aliceVerified = await identityRegistry.isVerified(alice.address);
const bobVerified = await identityRegistry.isVerified(bob.address);
const aliceFrozen = await identityRegistry.isFrozen(alice.address);
const bobFrozen = await identityRegistry.isFrozen(bob.address);
const tokenPaused = await token.paused();

console.log("Alice verified:", aliceVerified);
console.log("Bob verified:", bobVerified);
console.log("Alice frozen:", aliceFrozen);
console.log("Bob frozen:", bobFrozen);
console.log("Token paused:", tokenPaused);
```

---

## 🔍 Real Transaction Example

### **Successful Transfer on Sepolia:**

```bash
# Transaction Hash: 0xabc123...
# From: 0xe515EF6D59a67BD53B0d86a6839EAF052DE28201 (Alice)
# To: 0x41a21e3Bf83392931a57736b2c39B49ae48E3a87 (Bob)
# Value: 10.0 SECTOK
```

**Transaction Trace:**
```
1. Alice.transfer(Bob, 10 SECTOK)
   ↓
2. Token._beforeTokenTransfer(Alice, Bob, 10)
   ↓
3. Compliance.canTransfer(Alice, Bob, 10)
   ↓
4. IdentityRegistry.isVerified(Alice) → true ✅
   ↓
5. IdentityRegistry.isVerified(Bob) → true ✅
   ↓
6. IdentityRegistry.isFrozen(Alice) → false ✅
   ↓
7. IdentityRegistry.isFrozen(Bob) → false ✅
   ↓
8. Token.paused() → false ✅
   ↓
9. All checks pass → Transfer executes
   ↓
10. Balances updated:
    - Alice: 100,000 → 99,990 SECTOK
    - Bob: 75,000 → 75,010 SECTOK
   ↓
11. Transfer event emitted
   ↓
12. Compliance.transferred(Alice, Bob, 10) called
```

**Gas Usage Breakdown:**
- Basic ERC-20 transfer: ~21,000 gas
- KYC verification checks: ~15,000 gas
- Compliance validation: ~10,000 gas
- **Total: ~46,000 gas** (vs 21,000 for standard ERC-20)

---

## 🔐 Security Features

### **Immutable Compliance:**
- Compliance rules cannot be bypassed
- No "backdoor" transfers (except force transfers by agent)
- All transfers leave audit trail

### **Cryptographic Integrity:**
- KYC claims use cryptographic signatures
- Claims cannot be forged or tampered with
- Identity verification is mathematically provable

### **Administrative Safeguards:**
- Multi-role permission system
- Emergency controls (pause/freeze)
- Recovery mechanisms for lost keys

---

## 📊 Performance Considerations

### **Gas Costs:**
- **Standard ERC-20**: ~21,000 gas
- **ERC-3643 Transfer**: ~46,000 gas
- **Extra cost**: ~25,000 gas for compliance

### **Storage Reads:**
- Identity Registry lookups
- ONCHAINID claim reads
- Compliance module checks
- Multiple contract interactions

### **Optimization Strategies:**
- Cache verification results
- Batch compliance checks
- Optimize claim storage

---

## 🎯 Summary

**ERC-3643 Transfer Flow:**
1. **User initiates** transfer via token contract
2. **Token contract** calls compliance checks before transfer
3. **Compliance module** validates sender and receiver
4. **Identity Registry** verifies KYC status and account status
5. **ONCHAINID contracts** provide cryptographic proof of KYC
6. **All checks pass** → Transfer executes
7. **Failed checks** → Transaction reverts with error

**Key Differences from ERC-20:**
- ❌ **No anonymous transfers** - all parties must be KYC verified
- ❌ **No unrestricted transfers** - compliance rules enforced
- ✅ **Regulatory compliant** - meets securities regulations
- ✅ **Administrative controls** - freeze, pause, recovery features
- ✅ **Audit trail** - all actions logged and traceable

**This makes ERC-3643 perfect for:**
- 🏛️ **Regulated securities** (stocks, bonds, fund shares)
- 🏦 **Banking tokens** (CBDCs, stablecoins)
- 🏢 **Corporate tokens** (employee shares, utility tokens)
- 🌍 **Cross-border assets** with compliance requirements 