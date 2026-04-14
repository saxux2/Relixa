# Relixa - Fully Decentralized Emergency & Disaster Relief Platform

A transparent, blockchain-powered platform for disaster relief campaigns built originally on Stellar & Soroban smart contracts. Relixa ensures that every donation reaches its intended beneficiaries securely, quickly, and transparently using XLM natively.

<img width="1903" height="906" alt="Screenshot 2026-04-12 222437" src="https://github.com/user-attachments/assets/920e35b5-500e-45bb-a085-5f760765757c" />

![Track](https://img.shields.io/badge/Track-Web3%20Philanthropy-blue) ![Status](https://img.shields.io/badge/Status-Live%20MVP-brightgreen) ![Network](https://img.shields.io/badge/Network-Stellar%20Testnet-green) ![CI/CD](https://img.shields.io/badge/CI%2FCD-passing-brightgreen)

# Mobile Responsive


<img width="330" height="558" alt="Screenshot (6)" src="https://github.com/user-attachments/assets/e364a4a1-fd46-479d-966f-a593f97f8c17" />






---

## 🔗 Quick Links

| Resource | Link | 
|----|-----|
| Live Demo | [Live Link](https://relixa.vercel.app/) | 
| Smart Contract | [View on StellarExpert](https://stellar.expert/explorer/testnet/contract/CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA) |
| Users Data & Review | [Users Excel Sheet](https://1drv.ms/x/c/2baf627b5dfe0bd7/IQC7V_270XSkS4srEqExxFj5AQsUXFJOYaocBdqHJrAdO7c?e=Q1RKMw) |
 
---

## Level 5 Building Submission Checklist

| Requirement | Status | Proof |
|------|------|------|
| Live Demo Deployed | ✅Done |  [Live Link](https://github.com/saxux2/Relixa) | 
| CI/CD Pipeline | ✅Done | [Check Below](#cicd-pipeline) |
| Smart Contract Deployed | ✅Done | Stellar Testnet Contracts Configured |
| Mobile Responsive | ✅Done | Tested & Responsive |
| Registered Users | ✅Done | [Verified Users Excel Sheet Data](https://1drv.ms/x/c/2baf627b5dfe0bd7/IQC7V_270XSkS4srEqExxFj5AQsUXFJOYaocBdqHJrAdO7c?e=Q1RKMw) |

---

## ❗️ Problem Statement

In times of natural disasters and emergencies, traditional relief tracking systems lack transparency and accountability. A significant portion of donations can be delayed, lost due to bureaucratic inefficiencies, or diverted from the intended beneficiaries. Additionally, donors have no verifiable way to track their contributions or monitor real-time fund utilization in a secure, immutable manner.

---

## 💡 Our Solution

**Relixa** brings transparency to emergency fundraising using the fast and secure Stellar network:
- **Transparent Donations:** All financial transactions occur strictly on the Stellar Testnet, guaranteeing fast settlements with near-zero network fees.
- **Micro-Investments:** Investors and donors can fund campaigns efficiently utilizing Stellar's native features.
- **Direct Fund Allocation:** Beneficiaries receive funds in dedicated wallets with category-based merchant spending constraints, ensuring aid is spent correctly via Soroban contracts.
- **AI-Driven Analytics:** Live monitoring dashboards offer deep insights into network activities, transactions, and user growth.

---

## 🏗 Project Structure
Relixa/
├── backend/                # Node.js/Express API, Backend Services
├── blockchain/             # Soroban Smart Contracts (Rust) & Stellar Scripts
├── frontend/               # React web application (Vite, TailwindCSS)
├── monitoring-dashboard/   # Real-time analytics and transaction visualization
└── docs/                   # Supplemental documentation

---

## System Architecture

Relixa leverages a native Web3 Architecture powered exclusively by Stellar & Soroban.

```mermaid
graph TD
    Client[React Frontend] -->|Freighter Wallet| Network[Stellar Testnet]
    Client -->|REST API| Backend[Node.js Backend]
    Backend -->|Database Sync| DB[(Firebase Firestore)]
    Network -->|Live Metrics| Analytics(Monitoring Dashboard)
    
    subgraph Soroban Smart Contracts
        Network --> Factory(Campaign Contract)
        Network --> Escrow(Escrow & Beneficiary Logic)
    end
```

---

## CI/CD Pipeline
<img width="1919" height="967" alt="Screenshot 2026-04-14 190354" src="https://github.com/user-attachments/assets/0a029275-1608-4c1d-a0c5-b4695197ac1a" />


---

## Technical Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React, TailwindCSS, Vite | UI and client-side application |
| Backend | Node.js, Express, Firebase | Services, Auth, and Metadata |
| Database | Firebase Firestore | NoSQL database |
| Blockchain | Stellar Testnet | Core transaction layer |
| Smart Contracts| Rust (Soroban) | Decentralized logic and tokenization |
| Wallets | Freighter API | Transaction signing & Identity |

---

## Advanced Features

- **Decentralized Escrow:** Investor and donor funds are safely locked in trustless Soroban escrows tailored for active campaigns.
- **Category-Based Spending:** Smart contracts enforce specific category rules (Food, Shelter, Medicine).
- **Fast Settlements:** Leveraging Stellar ensures that when donations arrive, they confirm locally within seconds. 
- **Live Monitoring Dashboard:** A built-in centralized dashboard visually tracks up to 35 live user transactions, weekly activity trends, and network wallet metrics seamlessly.

---

## Monitoring Dashboard
<img width="1919" height="877" alt="Screenshot 2026-04-14 151217" src="https://github.com/user-attachments/assets/c5f7c177-7907-4ee9-8c56-f2a59c05e5d1" />


----

## Complete User Flows

### 1. Organizer Flow
1. Onboarding: Register on the platform and log in using your Freighter Wallet.
2. Campaign Launch: Organizers create a dedicated Campaign specifying location, beneficiary limit, and funding goal on Stellar.
3. Beneficiary Invite: Organizers add verified beneficiaries, enabling restricted smart-contract balances.

### 2. Donor Flow
1. Connect: Access active campaigns via Freighter wallet connection.
2. Donate: Send XLM or other assets securely tied directly to the campaign's escrow.
3. Track: View precisely where your donation tracks through the system.

### 3. Beneficiary & Merchant Flow
1. Receive: Automatically receive token allocations directly to your wallet account.
2. Spend: Execute constrained payments (e.g., Food, Medicine) interacting flawlessly with registered Merchants.

---

## Security

Summary:
- Smart Contract Security: ✅ Pass
- Verification Tools: ✅ Active
- Frontend Security: ✅ Pass

### Roadmap
- Integration with external Disaster APIs
- Scalable Governance Token Architecture
- Advanced Stellar Token Minting Workflows

---
## Deployed Contracts

*All contracts deployed on the Stellar Testnet.*

| Contract Function | Testnet Contract ID |
|-------------------|----------------------|
| ReliefToken Contract | CCVU3EEHQF3BPADY37SU3AG5K3LGS2O4HXVJZEJY3T6WADTUAN6NQTYY |
| CampaignFactory Contract | CAEI5K6BGQC4IR2M2S4HZDLA2ZKAU3RSDZ3WH6D2OZAXBS7PSWJNL4SK |
| TokenSale Contract |CAABYCCXEEKXA6Q32EFNQWEPOL3G66BRCKISJDY6V7LXS4NABBAGCG7N |
| USDC Token Contract (Stellar Testnet) | CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA|
| Sample Transaction Hash | [View on stellar Expert](https://stellar.expert/explorer/testnet/contract/CAABYCCXEEKXA6Q32EFNQWEPOL3G66BRCKISJDY6V7LXS4NABBAGCG7N) |



## 🤝 Contributing

We welcome contributions from the community!

1. Fork the repository
2. Create your branch
3. Push to `master` via Pull Requests

## 📜 License
This project is licensed under the MIT License.

---

## 📬 Support
For questions, issues, or partnerships:
- 🐛 GitHub Issues: Open an issue in this repository

---

## Local Setup

### 1) Clone
```bash
git clone https://github.com/saxux2/Relixa.git
cd Relixa
```

### 2) Blockchain Contracts (Soroban)
```bash
cd blockchain/soroban-contracts
cargo build --target wasm32-unknown-unknown --release
```

### 3) Frontend & Dashboard
```bash
cd frontend
npm install
npm run dev

# For the Analytics dashboard
cd ../monitoring-dashboard
npx serve .
```
