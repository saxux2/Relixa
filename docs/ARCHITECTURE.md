# System Architecture

Relixa's architecture represents a fully decentralized ecosystem designed for transparency and speed in disaster relief. 

## Key Services
1. **Frontend**: Combines a React Vite SPA and a new NextJS web application for performant client-side UI.
2. **Backend**: Lightweight Node.js express APIs synced with Firebase Firestore for fast metadata access.
3. **Smart Contracts**: Soroban logic built in Rust ensuring trustless fund escrow, category-based token spending, and strict merchant whitelists.
4. **Monitoring**: A separate vanilla JavaScript/HTML tracking interface acting as an observer to all live transactions.
5. **Ledger Integration**: Direct calls to the Stellar Testnet making use of XLM for zero-fee micro-donations.
