#![no_std]

//! RELIEF Token Implementation for Stellar
//!
//! NOTE: On Stellar, you typically use the built-in Stellar Asset Contract (SAC)
//! instead of implementing a custom token. This is a reference implementation
//! if custom token logic is needed.
//!
//! RECOMMENDED: Issue a Stellar asset using stellar-sdk instead:
//! ```javascript
//! const reliefAsset = new StellarSdk.Asset('RELIEF', issuerPublicKey);
//! ```

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, String, Symbol};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    TotalSupply,
    Balance(Address),
    Allowance(Address, Address),
    MaxSupply,
    Paused,
}

#[contract]
pub struct ReliefToken;

#[contractimpl]
impl ReliefToken {
    /// Initialize the RELIEF token
    ///
    /// # Arguments
    /// * `admin` - Admin address (receives initial supply)
    /// * `initial_supply` - Initial supply (7 decimals for Stellar)
    /// * `max_supply` - Maximum supply (7 decimals)
    pub fn initialize(env: Env, admin: Address, initial_supply: i128, max_supply: i128) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }

        admin.require_auth();

        if initial_supply > max_supply {
            panic!("Initial supply exceeds max");
        }

        // 10M RELIEF with 7 decimals = 10,000,000 * 10^7 = 100,000,000,000,000
        let default_max_supply = 100000000000000i128;

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::TotalSupply, &initial_supply);
        env.storage().instance().set(
            &DataKey::MaxSupply,
            &if max_supply > 0 {
                max_supply
            } else {
                default_max_supply
            },
        );
        env.storage().instance().set(&DataKey::Paused, &false);
        env.storage()
            .instance()
            .set(&DataKey::Balance(admin.clone()), &initial_supply);

        // Emit mint event
        env.events()
            .publish((Symbol::new(&env, "mint"), admin), initial_supply);
    }

    /// Get token name
    pub fn name(_env: Env) -> String {
        String::from_str(&_env, "Relief Token")
    }

    /// Get token symbol
    pub fn symbol(_env: Env) -> String {
        String::from_str(&_env, "RELIEF")
    }

    /// Get decimals (7 for Stellar standard)
    pub fn decimals(_env: Env) -> u32 {
        7
    }

    /// Get total supply
    pub fn total_supply(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0)
    }

    /// Get balance of address
    pub fn balance(env: Env, address: Address) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::Balance(address))
            .unwrap_or(0)
    }

    /// Transfer tokens
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();

        let paused: bool = env
            .storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false);
        if paused {
            panic!("Token transfers are paused");
        }

        if amount <= 0 {
            panic!("Amount must be positive");
        }

        let from_balance = Self::balance(env.clone(), from.clone());
        if from_balance < amount {
            panic!("Insufficient balance");
        }

        // Update balances
        env.storage()
            .instance()
            .set(&DataKey::Balance(from.clone()), &(from_balance - amount));

        let to_balance = Self::balance(env.clone(), to.clone());
        env.storage()
            .instance()
            .set(&DataKey::Balance(to.clone()), &(to_balance + amount));

        // Emit transfer event
        env.events()
            .publish((Symbol::new(&env, "transfer"), from, to), amount);
    }

    /// Mint new tokens (admin only, up to max supply)
    pub fn mint(env: Env, admin: Address, to: Address, amount: i128) {
        admin.require_auth();

        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("Only admin can mint");
        }

        let total_supply: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0);
        let max_supply: i128 = env.storage().instance().get(&DataKey::MaxSupply).unwrap();

        if total_supply + amount > max_supply {
            panic!("Exceeds max supply");
        }

        // Update total supply
        env.storage()
            .instance()
            .set(&DataKey::TotalSupply, &(total_supply + amount));

        // Update recipient balance
        let to_balance = Self::balance(env.clone(), to.clone());
        env.storage()
            .instance()
            .set(&DataKey::Balance(to.clone()), &(to_balance + amount));

        // Emit mint event
        env.events()
            .publish((Symbol::new(&env, "mint"), to), amount);
    }

    /// Burn tokens from caller
    pub fn burn(env: Env, from: Address, amount: i128) {
        from.require_auth();

        let from_balance = Self::balance(env.clone(), from.clone());
        if from_balance < amount {
            panic!("Insufficient balance to burn");
        }

        // Update balance
        env.storage()
            .instance()
            .set(&DataKey::Balance(from.clone()), &(from_balance - amount));

        // Update total supply
        let total_supply: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::TotalSupply, &(total_supply - amount));

        // Emit burn event
        env.events()
            .publish((Symbol::new(&env, "burn"), from), amount);
    }

    /// Pause all transfers (admin only)
    pub fn pause(env: Env, admin: Address) {
        admin.require_auth();

        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("Only admin can pause");
        }

        env.storage().instance().set(&DataKey::Paused, &true);
    }

    /// Unpause transfers (admin only)
    pub fn unpause(env: Env, admin: Address) {
        admin.require_auth();

        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("Only admin can unpause");
        }

        env.storage().instance().set(&DataKey::Paused, &false);
    }

    /// Check if paused
    pub fn is_paused(env: Env) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false)
    }

    /// Get max supply
    pub fn max_supply(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::MaxSupply)
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
