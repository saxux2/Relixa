#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env};

/// Storage keys for token sale
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    ReliefToken,
    UsdcToken,
    Admin,
    TotalRaised,
    TotalTokensSold,
    Purchase(Address),
    MinPurchase,
    MaxPurchase,
    Paused,
}

#[contract]
pub struct TokenSale;

#[contractimpl]
impl TokenSale {
    /// Initialize the token sale contract
    ///
    /// # Arguments
    /// * `relief_token` - RELIEF token contract address
    /// * `usdc_token` - USDC token contract address  
    /// * `admin` - Admin address
    pub fn initialize(env: Env, relief_token: Address, usdc_token: Address, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }

        admin.require_auth();

        env.storage()
            .instance()
            .set(&DataKey::ReliefToken, &relief_token);
        env.storage()
            .instance()
            .set(&DataKey::UsdcToken, &usdc_token);
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TotalRaised, &0i128);
        env.storage()
            .instance()
            .set(&DataKey::TotalTokensSold, &0i128);
        env.storage().instance().set(&DataKey::Paused, &false);

        // Min: 0.01 USDC (0.01 * 10^7 = 100,000)
        env.storage()
            .instance()
            .set(&DataKey::MinPurchase, &100000i128);
        // Max: 10,000 USDC (10,000 * 10^7 = 100,000,000,000)
        env.storage()
            .instance()
            .set(&DataKey::MaxPurchase, &100000000000i128);
    }

    /// Buy RELIEF tokens with USDC at 1:1 ratio
    /// Both tokens use 7 decimals on Stellar, so no conversion needed
    ///
    /// # Arguments
    /// * `buyer` - Buyer address
    /// * `usdc_amount` - Amount of USDC to spend (7 decimals)
    pub fn buy_tokens(env: Env, buyer: Address, usdc_amount: i128) -> i128 {
        buyer.require_auth();

        // Check if paused
        let paused: bool = env
            .storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false);
        if paused {
            panic!("Token sale is paused");
        }

        // Check limits
        let min_purchase: i128 = env.storage().instance().get(&DataKey::MinPurchase).unwrap();
        let max_purchase: i128 = env.storage().instance().get(&DataKey::MaxPurchase).unwrap();

        if usdc_amount < min_purchase {
            panic!("Amount below minimum");
        }
        if usdc_amount > max_purchase {
            panic!("Amount exceeds maximum");
        }

        // 1:1 ratio - both have 7 decimals on Stellar
        let token_amount = usdc_amount;

        // Get token contracts
        let relief_token: Address = env.storage().instance().get(&DataKey::ReliefToken).unwrap();
        let usdc_token: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();

        let relief_client = token::Client::new(&env, &relief_token);
        let usdc_client = token::Client::new(&env, &usdc_token);

        // Check contract has enough RELIEF tokens
        let relief_balance = relief_client.balance(&env.current_contract_address());
        if relief_balance < token_amount {
            panic!("Insufficient tokens in contract");
        }

        // Transfer USDC from buyer to contract
        usdc_client.transfer(&buyer, &env.current_contract_address(), &usdc_amount);

        // Update state
        let total_raised: i128 = env.storage().instance().get(&DataKey::TotalRaised).unwrap();
        let total_sold: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalTokensSold)
            .unwrap();

        env.storage()
            .instance()
            .set(&DataKey::TotalRaised, &(total_raised + usdc_amount));
        env.storage()
            .instance()
            .set(&DataKey::TotalTokensSold, &(total_sold + token_amount));

        let purchase_key = DataKey::Purchase(buyer.clone());
        let previous_purchase: i128 = env.storage().instance().get(&purchase_key).unwrap_or(0);
        env.storage()
            .instance()
            .set(&purchase_key, &(previous_purchase + token_amount));

        // Transfer RELIEF tokens to buyer
        relief_client.transfer(&env.current_contract_address(), &buyer, &token_amount);

        // Emit event
        env.events().publish(
            (soroban_sdk::symbol_short!("purchase"), buyer),
            (usdc_amount, token_amount, env.ledger().timestamp()),
        );

        token_amount
    }

    /// Withdraw collected USDC (admin only)
    pub fn withdraw_usdc(env: Env, admin: Address) -> i128 {
        admin.require_auth();

        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("Only admin can withdraw");
        }

        let usdc_token: Address = env.storage().instance().get(&DataKey::UsdcToken).unwrap();
        let usdc_client = token::Client::new(&env, &usdc_token);

        let balance = usdc_client.balance(&env.current_contract_address());
        if balance == 0 {
            panic!("No USDC to withdraw");
        }

        usdc_client.transfer(&env.current_contract_address(), &admin, &balance);

        env.events().publish(
            (soroban_sdk::symbol_short!("withdraw"),),
            (admin.clone(), balance, env.ledger().timestamp()),
        );

        balance
    }

    /// Withdraw unsold RELIEF tokens (admin only)
    pub fn withdraw_relief(env: Env, admin: Address, amount: i128) -> i128 {
        admin.require_auth();

        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("Only admin can withdraw");
        }

        let relief_token: Address = env.storage().instance().get(&DataKey::ReliefToken).unwrap();
        let relief_client = token::Client::new(&env, &relief_token);

        let balance = relief_client.balance(&env.current_contract_address());
        if balance < amount {
            panic!("Insufficient token balance");
        }

        relief_client.transfer(&env.current_contract_address(), &admin, &amount);

        env.events().publish(
            (soroban_sdk::symbol_short!("w_relief"),),
            (admin.clone(), amount, env.ledger().timestamp()),
        );

        amount
    }

    /// Pause token sale
    pub fn pause(env: Env, admin: Address) {
        admin.require_auth();

        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("Only admin can pause");
        }

        env.storage().instance().set(&DataKey::Paused, &true);
    }

    /// Unpause token sale
    pub fn unpause(env: Env, admin: Address) {
        admin.require_auth();

        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("Only admin can unpause");
        }

        env.storage().instance().set(&DataKey::Paused, &false);
    }

    /// Get available tokens for sale
    pub fn get_available_tokens(env: Env) -> i128 {
        let relief_token: Address = env.storage().instance().get(&DataKey::ReliefToken).unwrap();
        let relief_client = token::Client::new(&env, &relief_token);
        relief_client.balance(&env.current_contract_address())
    }

    /// Get total USDC raised
    pub fn get_total_raised(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalRaised)
            .unwrap_or(0)
    }

    /// Get total tokens sold
    pub fn get_total_tokens_sold(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalTokensSold)
            .unwrap_or(0)
    }

    /// Get purchase info for buyer
    pub fn get_purchase_info(env: Env, buyer: Address) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::Purchase(buyer))
            .unwrap_or(0)
    }

    /// Check if paused
    pub fn is_paused(env: Env) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false)
    }
}

#[cfg(test)]
mod test;
