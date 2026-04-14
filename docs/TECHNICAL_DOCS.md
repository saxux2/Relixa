# API & Developer Guide

## Smart Contracts (Soroban)
Our core logic is located in `blockchain/soroban-contracts`. Everything compiles securely down to WebAssembly.

## React & NextJS Frontends
- Environment constraints must match those placed in `.env` regarding Stellar Testnet network urls.
- The `Freighter` browser extension API acts as the main authentication and transaction signing provider.

## Backend Interceptor
Our node services sit simply to aggregate offline metrics to Firebase to reduce RPC load on the frontend.
