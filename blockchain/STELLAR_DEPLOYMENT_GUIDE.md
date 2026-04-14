# Stellar Soroban Deployment Guide

## Quick Start: Deploy Relifo Contracts to Stellar Testnet

### Prerequisites

1. **Stellar CLI installed** ✅ (verified: v25.0.0)
2. **Rust toolchain** ✅ (verified: v1.93.0)
3. **Stellar Testnet account with XLM**
4. **Contract WASM files built** ✅

---

## Step 1: Build Contracts

```bash
cd blockchain/soroban-contracts
cargo build --release --target wasm32-unknown-unknown

# WASM files will be in:
# target/wasm32-unknown-unknown/release/
# - campaign_factory.wasm
# - campaign.wasm
# - beneficiary_wallet.wasm
# - token_sale.wasm
# - relief_token.wasm
```

---

## Step 2: Get Stellar Testnet Account

### Option A: Generate New Account

```bash
# Generate keypair
stellar keys generate --global admin --network testnet

# This creates:
# Public key: GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
# Secret key: SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Fund with testnet XLM
curl "https://friendbot.stellar.org?addr=GYOUR_PUBLIC_KEY_HERE"
```

### Option B: Use Existing Account

```bash
# Import existing secret key
stellar keys add admin --secret-key --global

# Verify balance
stellar keys address admin
```

---

## Step 3: Deploy Contracts

### 3.1 Deploy RELIEF Token (Option 1: Stellar Asset - RECOMMENDED)

```bash
# Issue a Stellar asset instead of deploying custom token
# This is simpler and more native to Stellar

# Create issuer account
stellar keys generate --global relief_issuer --network testnet
curl "https://friendbot.stellar.org?addr=GRELIEF_ISSUER_PUBLIC_KEY"

# In your deployment script (JavaScript):
const reliefAsset = new StellarSdk.Asset('RELIEF', reliefIssuerPublicKey);
# No deployment needed - Stellar handles it natively!
```

### 3.2 Deploy RELIEF Token (Option 2: Custom Contract)

```bash
# Deploy custom token contract (if you need custom logic)
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/relief_token.wasm \
  --source admin \
  --network testnet

# Save the output contract ID (starts with C...)
# Example: CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 3.3 Deploy Campaign Factory

```bash
# Get Campaign WASM hash (needed for factory initialization)
stellar contract install \
  --wasm target/wasm32-unknown-unknown/release/campaign.wasm \
  --source admin \
  --network testnet

# Output: bytesN32 hash
# Example: 1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Deploy Campaign Factory
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/campaign_factory.wasm \
  --source admin \
  --network testnet

# Save factory contract ID
# Example: CFACTORY_CONTRACT_ID_HERE
```

### 3.4 Initialize Campaign Factory

```bash
# Get admin public key
ADMIN_ADDRESS=$(stellar keys address admin)

# Get RELIEF token address (from step 3.1 or 3.2)
RELIEF_TOKEN="C..." # Your RELIEF contract ID

# Get Campaign WASM hash (from step 3.3)
CAMPAIGN_HASH="abcd1234..." # 32-byte hex

# Initialize factory
stellar contract invoke \
  --id CFACTORY_CONTRACT_ID_HERE \
  --source admin \
  --network testnet \
  -- \
  initialize \
  --admin $ADMIN_ADDRESS \
  --relief_token $RELIEF_TOKEN \
  --campaign_wasm_hash $CAMPAIGN_HASH
```

### 3.5 Deploy Token Sale Contract

```bash
# Get Stellar USDC address for testnet
TESTNET_USDC="CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA"

# Deploy token sale
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/token_sale.wasm \
  --source admin \
  --network testnet

# Initialize token sale
stellar contract invoke \
  --id CTOKEN_SALE_CONTRACT_ID \
  --source admin \
  --network testnet \
  -- \
  initialize \
  --relief_token $RELIEF_TOKEN \
  --usdc_token $TESTNET_USDC \
  --admin $ADMIN_ADDRESS
```

### 3.6 Install Beneficiary Wallet WASM (for Campaign to deploy)

```bash
# Install (don't deploy) beneficiary wallet for campaigns to use
stellar contract install \
  --wasm target/wasm32-unknown-unknown/release/beneficiary_wallet.wasm \
  --source admin \
  --network testnet

# Save the WASM hash - campaigns will use this to deploy wallets
# Example: fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321
```

---

## Step 4: Save Contract Addresses

Create `.env` file in `frontend/`:

```env
# Stellar Network
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org

# Admin Address
VITE_SUPER_ADMIN_ADDRESS=GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Contract Addresses
VITE_STELLAR_RELIEF_TOKEN=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_STELLAR_CAMPAIGN_FACTORY=CFXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_STELLAR_TOKEN_SALE=CTXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# WASM Hashes (for factory deployments)
VITE_STELLAR_CAMPAIGN_WASM_HASH=abcd1234...
VITE_STELLAR_WALLET_WASM_HASH=fedcba09...

# Stellar Testnet USDC
VITE_STELLAR_USDC_ADDRESS=CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA

# Firebase (keep existing)
VITE_FIREBASE_API_KEY=...
# ... other Firebase vars
```

---

## Step 5: Verify Deployment

### 5.1 Check Campaign Factory

```bash
# Get admin address
stellar contract invoke \
  --id CFACTORY_CONTRACT_ID \
  --source admin \
  --network testnet \
  -- \
  get_admin

# Should return your admin address
```

### 5.2 Approve Test Organizer

```bash
# Generate organizer account
stellar keys generate --global test_organizer --network testnet
ORGANIZER_ADDRESS=$(stellar keys address test_organizer)

# Approve organizer
stellar contract invoke \
  --id CFACTORY_CONTRACT_ID \
  --source admin \
  --network testnet \
  -- \
  approve_organizer \
  --admin $ADMIN_ADDRESS \
  --organizer $ORGANIZER_ADDRESS

# Verify approval
stellar contract invoke \
  --id CFACTORY_CONTRACT_ID \
  --source admin \
  --network testnet \
  -- \
  is_approved_organizer \
  --organizer $ORGANIZER_ADDRESS

# Should return: true
```

### 5.3 Create Test Campaign

```bash
# Organizer creates a campaign
stellar contract invoke \
  --id CFACTORY_CONTRACT_ID \
  --source test_organizer \
  --network testnet \
  -- \
  create_campaign \
  --organizer $ORGANIZER_ADDRESS \
  --title "Test Disaster Relief" \
  --description "Testing campaign creation" \
  --goal_amount 100000000000 \
  --location "Test City" \
  --disaster_type "Earthquake"

# Output: New campaign contract address
# Example: CCAMPAIGN_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## Step 6: Alternative - Automated Deployment Script

Create `blockchain/stellar-scripts/deploy.js`:

```javascript
import * as StellarSdk from 'stellar-sdk';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
const networkPassphrase = StellarSdk.Networks.TESTNET;

// Load admin keypair
const adminSecret = process.env.STELLAR_ADMIN_SECRET;
const adminKeypair = StellarSdk.Keypair.fromSecret(adminSecret);

async function deployContract(wasmPath, contractName) {
  console.log(`Deploying ${contractName}...`);
  
  const wasm = readFileSync(wasmPath);
  
  // Deploy via stellar CLI (simpler than SDK for now)
  const output = execSync(
    `stellar contract deploy --wasm ${wasmPath} --source admin --network testnet`,
    { encoding: 'utf-8' }
  );
  
  const contractId = output.trim();
  console.log(`✅ ${contractName} deployed: ${contractId}`);
  return contractId;
}

async function main() {
  console.log('🚀 Deploying Relifo contracts to Stellar Testnet...\n');
  
  // 1. Deploy ReliefToken
  const reliefToken = await deployContract(
    'target/wasm32-unknown-unknown/release/relief_token.wasm',
    'ReliefToken'
  );
  
  // 2. Install Campaign WASM
  const campaignHash = execSync(
    'stellar contract install --wasm target/wasm32-unknown-unknown/release/campaign.wasm --source admin --network testnet',
    { encoding: 'utf-8' }
  ).trim();
  console.log(`✅ Campaign WASM installed: ${campaignHash}`);
  
  // 3. Deploy CampaignFactory
  const factory = await deployContract(
    'target/wasm32-unknown-unknown/release/campaign_factory.wasm',
    'CampaignFactory'
  );
  
  // 4. Initialize Factory
  console.log('Initializing CampaignFactory...');
  execSync(
    `stellar contract invoke --id ${factory} --source admin --network testnet -- initialize --admin ${adminKeypair.publicKey()} --relief_token ${reliefToken} --campaign_wasm_hash ${campaignHash}`,
    { encoding: 'utf-8' }
  );
  console.log('✅ CampaignFactory initialized');
  
  // 5. Deploy TokenSale
  const tokenSale = await deployContract(
    'target/wasm32-unknown-unknown/release/token_sale.wasm',
    'TokenSale'
  );
  
  // 6. Initialize TokenSale
  const usdcAddress = 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA';
  console.log('Initializing TokenSale...');
  execSync(
    `stellar contract invoke --id ${tokenSale} --source admin --network testnet -- initialize --relief_token ${reliefToken} --usdc_token ${usdcAddress} --admin ${adminKeypair.publicKey()}`,
    { encoding: 'utf-8' }
  );
  console.log('✅ TokenSale initialized');
  
  // 7. Install Beneficiary Wallet WASM
  const walletHash = execSync(
    'stellar contract install --wasm target/wasm32-unknown-unknown/release/beneficiary_wallet.wasm --source admin --network testnet',
    { encoding: 'utf-8' }
  ).trim();
  console.log(`✅ BeneficiaryWallet WASM installed: ${walletHash}`);
  
  // Print summary
  console.log('\n📋 Deployment Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Admin Address:          ${adminKeypair.publicKey()}`);
  console.log(`RELIEF Token:           ${reliefToken}`);
  console.log(`Campaign Factory:       ${factory}`);
  console.log(`Token Sale:             ${tokenSale}`);
  console.log(`Campaign WASM Hash:     ${campaignHash}`);
  console.log(`Wallet WASM Hash:       ${walletHash}`);
  console.log(`USDC (Testnet):         ${usdcAddress}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Generate .env content
  console.log('\n📝 Add to frontend/.env:');
  console.log(`VITE_STELLAR_RELIEF_TOKEN=${reliefToken}`);
  console.log(`VITE_STELLAR_CAMPAIGN_FACTORY=${factory}`);
  console.log(`VITE_STELLAR_TOKEN_SALE=${tokenSale}`);
  console.log(`VITE_STELLAR_CAMPAIGN_WASM_HASH=${campaignHash}`);
  console.log(`VITE_STELLAR_WALLET_WASM_HASH=${walletHash}`);
  console.log(`VITE_SUPER_ADMIN_ADDRESS=${adminKeypair.publicKey()}`);
}

main().catch(console.error);
```

Run it:

```bash
cd blockchain
npm install stellar-sdk
export STELLAR_ADMIN_SECRET="SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
node stellar-scripts/deploy.js
```

---

## Step 7: Test Deployed Contracts

### Test Donation Flow

```bash
# 1. Create donor account
stellar keys generate --global donor --network testnet
curl "https://friendbot.stellar.org?addr=$(stellar keys address donor)"

# 2. Get some RELIEF tokens from TokenSale
# (Assumes you've loaded RELIEF into TokenSale contract)

# 3. Approve RELIEF spending
# (Use Stellar SDK in frontend)

# 4. Donate to campaign
stellar contract invoke \
  --id CCAMPAIGN_ADDRESS \
  --source donor \
  --network testnet \
  -- \
  donate \
  --donor $(stellar keys address donor) \
  --amount 10000000

# 5. Check campaign raised amount
stellar contract invoke \
  --id CCAMPAIGN_ADDRESS \
  --source donor \
  --network testnet \
  -- \
  get_campaign_info
```

---

## Troubleshooting

### Error: "Insufficient XLM for fees"
**Solution**: Fund account from Friendbot
```bash
curl "https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY"
```

### Error: "Contract not found"
**Solution**: Verify contract was deployed
```bash
stellar contract info --id CONTRACT_ID --network testnet
```

### Error: "Authorization failed"
**Solution**: Ensure you're using the correct source account
```bash
# Check current identity
stellar keys show admin

# Use correct source
stellar contract invoke --source admin ...
```

### Error: "WASM hash not found"
**Solution**: Install WASM first before referencing
```bash
stellar contract install --wasm path/to/contract.wasm --source admin --network testnet
```

---

## Next Steps

1. ✅ Contracts deployed
2. → Update frontend to use Freighter + Stellar SDK
3. → Update backend scripts
4. → Comprehensive testing
5. → Deploy to Stellar Mainnet (when ready)

---

## Useful Commands

```bash
# List all identities
stellar keys ls

# Get contract info
stellar contract info --id CONTRACT_ID --network testnet

# Get account balance
stellar keys address admin | xargs -I {} curl "https://horizon-testnet.stellar.org/accounts/{}"

# View contract events
stellar events --id CONTRACT_ID --network testnet

# Simulate transaction (dry run)
stellar contract invoke --id CONTRACT_ID --source admin --network testnet --simulate ...
```

---

## Resources

- **Stellar Documentation**: https://developers.stellar.org/docs
- **Soroban Docs**: https://soroban.stellar.org
- **Stellar Testnet Faucet**: https://friendbot.stellar.org
- **Stellar Expert (Testnet)**: https://stellar.expert/explorer/testnet
- **Stellar Laboratory**: https://laboratory.stellar.org
