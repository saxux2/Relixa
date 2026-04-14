# Data Indexing Approach

Relixa relies on aggressive cache strategies heavily utilized in the **Monitoring Dashboard**.

By querying the Stellar Testnet sequentially, data is transformed into chartable components without overloading the Horizon RPC servers. 

- Aggregated network actions are pushed locally to Firebase where NextJS components can securely read the metrics in milliseconds.
