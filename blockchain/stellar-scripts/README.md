# Stellar Scripts - Relifo Blockchain Operations

This directory contains Node.js scripts for interacting with Relifo's Stellar/Soroban smart contracts.

## Prerequisites

1. Install dependencies (from `blockchain/` directory):
   ```bash
   npm install @stellar/stellar-sdk dotenv
   ```

2. Set up environment variables in `.env` file:
   ```env
   STELLAR_ADMIN_SECRET=SBYVHSVAJLEA75FO637YNGJWIZ2URQLKKPNANPTTWU4XUQYZAZCDIFN6
   STELLAR_NETWORK=testnet
   STELLAR_RELIEF_TOKEN=CCVU3EEHQF3BPADY37SU3AG5K3LGS2O4HXVJZEJY3T6WADTUAN6NQTYY
   STELLAR_CAMPAIGN_FACTORY=CAEI5K6BGQC4IR2M2S4HZDLA2ZKAU3RSDZ3WH6D2OZAXBS7PSWJNL4SK
   STELLAR_TOKEN_SALE=CAABYCCXEEKXA6Q32EFNQWEPOL3G66BRCKISJDY6V7LXS4NABBAGCG7N
   STELLAR_USDC=CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA
   ```

## Available Scripts

### Admin Operations

#### 1. Approve Organizer
Approve an address to create campaigns.

```bash
node stellar-scripts/approveOrganizer.js <organizer-address>
```

Or with environment variables:
```bash
ORGANIZER_ADDRESS=G... node stellar-scripts/approveOrganizer.js
```

#### 2. Verify Merchant
Verify a merchant globally (can receive payments from any beneficiary wallet).

```bash
node stellar-scripts/verifyMerchant.js <merchant-address>
```

Or with environment variables:
```bash
MERCHANT_ADDRESS=G... node stellar-scripts/verifyMerchant.js
```

---

### Campaign Operations

#### 3. Create Campaign
Create a new relief campaign.

```bash
node stellar-scripts/createCampaign.js "Campaign Name" "Description" 10000
```

Or with environment variables:
```bash
ORGANIZER_SECRET=S... \
CAMPAIGN_NAME="Emergency Relief" \
CAMPAIGN_DESCRIPTION="Help families affected by disaster" \
GOAL_AMOUNT=10000 \
node stellar-scripts/createCampaign.js
```

**Output**: Returns the new campaign contract address.

#### 4. Approve Beneficiary
Approve a beneficiary to receive funds from a campaign.

```bash
node stellar-scripts/approveBeneficiary.js <campaign-address> <beneficiary-address>
```

Or with environment variables:
```bash
ORGANIZER_SECRET=S... \
CAMPAIGN_ADDRESS=C... \
BENEFICIARY_ADDRESS=G... \
node stellar-scripts/approveBeneficiary.js
```

---

### Donation & Funding Operations

#### 5. Donate to Campaign
Donate RELIEF tokens to a campaign.

```bash
node stellar-scripts/donate.js <campaign-address> 100
```

Or with environment variables:
```bash
DONOR_SECRET=S... \
CAMPAIGN_ADDRESS=C... \
AMOUNT=100 \
node stellar-scripts/donate.js
```

#### 6. Allocate Funds to Beneficiary
Allocate funds from campaign to beneficiary wallet.

```bash
node stellar-scripts/allocateFunds.js <campaign-address> <beneficiary-address> 1000
```

Or with environment variables:
```bash
ORGANIZER_SECRET=S... \
CAMPAIGN_ADDRESS=C... \
BENEFICIARY_ADDRESS=G... \
AMOUNT=1000 \
node stellar-scripts/allocateFunds.js
```

---

### Token Operations

#### 7. Buy RELIEF Tokens
Exchange USDC for RELIEF tokens (1:1 rate).

```bash
node stellar-scripts/buyReliefTokens.js 100
```

Or with environment variables:
```bash
BUYER_SECRET=S... \
AMOUNT=100 \
node stellar-scripts/buyReliefTokens.js
```

---

### Beneficiary Operations

#### 8. Make Payment from Beneficiary Wallet
Spend funds from beneficiary wallet to verified merchant.

```bash
node stellar-scripts/beneficiaryPayment.js <wallet-address> <merchant-address> 50 0
```

Or with environment variables:
```bash
BENEFICIARY_SECRET=S... \
WALLET_ADDRESS=C... \
MERCHANT_ADDRESS=G... \
AMOUNT=50 \
CATEGORY=Food \
node stellar-scripts/beneficiaryPayment.js
```

**Categories**: 
- `0` or `Food` - Food purchases
- `1` or `Medicine` - Medical expenses
- `2` or `Shelter` - Housing/shelter
- `3` or `Education` - Educational expenses
- `4` or `Other` - Other approved expenses

---

## Complete Workflow Example

### 1. Setup (Admin)
```bash
# Approve an organizer
node stellar-scripts/approveOrganizer.js GORGANIZER123...

# Verify merchants
node stellar-scripts/verifyMerchant.js GMERCHANT1...
node stellar-scripts/verifyMerchant.js GMERCHANT2...
```

### 2. Create Campaign (Organizer)
```bash
ORGANIZER_SECRET=SORGANIZER123... \
CAMPAIGN_NAME="Flood Relief 2026" \
CAMPAIGN_DESCRIPTION="Emergency relief for flood victims" \
GOAL_AMOUNT=50000 \
node stellar-scripts/createCampaign.js

# Output: Campaign address: CCAMPAIGN123...
```

### 3. Approve Beneficiary (Organizer)
```bash
ORGANIZER_SECRET=SORGANIZER123... \
CAMPAIGN_ADDRESS=CCAMPAIGN123... \
BENEFICIARY_ADDRESS=GBENEFICIARY1... \
node stellar-scripts/approveBeneficiary.js
```

### 4. Donate (Donor)
```bash
DONOR_SECRET=SDONOR123... \
CAMPAIGN_ADDRESS=CCAMPAIGN123... \
AMOUNT=5000 \
node stellar-scripts/donate.js
```

### 5. Allocate Funds (Organizer)
```bash
ORGANIZER_SECRET=SORGANIZER123... \
CAMPAIGN_ADDRESS=CCAMPAIGN123... \
BENEFICIARY_ADDRESS=GBENEFICIARY1... \
AMOUNT=2000 \
node stellar-scripts/allocateFunds.js

# Output: Beneficiary wallet address: CWALLET123...
```

### 6. Spend Funds (Beneficiary)
```bash
BENEFICIARY_SECRET=SBENEFICIARY1... \
WALLET_ADDRESS=CWALLET123... \
MERCHANT_ADDRESS=GMERCHANT1... \
AMOUNT=100 \
CATEGORY=Food \
node stellar-scripts/beneficiaryPayment.js
```

---

## Utility Module

The `stellarUtils.js` module provides reusable functions:

- **Network**: `getNetwork()`, `getServer()`
- **Account**: `loadKeypair()`, `loadAdminKeypair()`, `getAccount()`
- **Contract Interaction**: `invokeContract()`, `buildAndSignTransaction()`, `sendTransaction()`
- **Data Conversion**: `toStroops()`, `fromStroops()`, `addressToScVal()`, `u128ToScVal()`, etc.
- **Formatting**: `getExplorerUrl()`, `displayTransactionResult()`

---

## Network Configuration

### Testnet (Default)
- Network: `testnet`
- RPC: `https://soroban-testnet.stellar.org`
- Horizon: `https://horizon-testnet.stellar.org`

### Mainnet
Set `STELLAR_NETWORK=mainnet` in your environment.
- Network: `mainnet`
- RPC: `https://soroban-mainnet.stellar.org`
- Horizon: `https://horizon.stellar.org`

---

## Troubleshooting

### "Account not found"
- Make sure the account has been funded with XLM
- On testnet, use Friendbot: https://laboratory.stellar.org/#account-creator

### "Transaction failed"
- Check that you have XLM for transaction fees
- Verify contract addresses are correct
- Ensure proper authorization (e.g., approved organizer, verified merchant)

### "Insufficient balance"
- For RELIEF tokens: Use `buyReliefTokens.js` to exchange USDC
- For USDC: Get testnet USDC from Stellar faucet
- For XLM: Use Friendbot on testnet

---

## Contract Addresses (Testnet)

See `DEPLOYMENT_QUICK_REFERENCE.txt` in the project root for all contract addresses and transaction hashes.

---

## Explorer Links

View transactions and contracts on Stellar Expert:
- **Testnet**: https://stellar.expert/explorer/testnet
- **Mainnet**: https://stellar.expert/explorer/public

---

For more information, see the main project documentation in the `Relifo/` directory.
