# Security Audit Checklist

- [x] **Smart Contracts**: Soroban WebAssembly checks must pass compilation thresholds. Escrows must never allow back-channel exits.
- [x] **Database Isolation**: Firebase queries restricted to signed users. Role-Based Access logic properly limits reads/writes.
- [x] **Wallet Operations**: Relixa only uses the official Stellar `Freighter` wallet flow, meaning no private keys are ever held inside local storage.
- [x] **Merchant Logic Validation**: Token contracts assure only registered merchant addresses interact with relief payloads.
