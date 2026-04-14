#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, String, Vec};

/// Spending category enum
#[contracttype]
#[derive(Clone, Copy, PartialEq)]
#[repr(u32)]
pub enum SpendingCategory {
    Food = 0,
    Medicine = 1,
    Shelter = 2,
    Education = 3,
    Other = 4,
}

/// Spending record
#[contracttype]
#[derive(Clone)]
pub struct Spending {
    pub merchant: Address,
    pub amount: i128,
    pub category: SpendingCategory,
    pub description: String,
    pub timestamp: u64,
}

/// Storage keys for beneficiary wallet
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Beneficiary,
    ReliefToken,
    Campaign,
    Organizer,
    Factory,
    SpendingHistory,
    CategoryLimit(u32),
    CategorySpent(u32),
    ApprovedMerchant(Address, u32),
    Merchants,
    TotalSpent,
    Paused,
}

#[contract]
pub struct BeneficiaryWallet;

#[contractimpl]
impl BeneficiaryWallet {
    /// Initialize the beneficiary wallet
    /// 
    /// # Arguments
    /// * `beneficiary` - Beneficiary address (wallet owner)
    /// * `relief_token` - RELIEF token contract address
    /// * `campaign` - Campaign contract address
    /// * `organizer` - Campaign organizer address
    /// * `factory` - Campaign factory contract address
    pub fn initialize(
        env: Env,
        beneficiary: Address,
        relief_token: Address,
        campaign: Address,
        organizer: Address,
        factory: Address,
    ) {
        // Ensure not already initialized
        if env.storage().instance().has(&DataKey::Beneficiary) {
            panic!("Already initialized");
        }

        // Store data
        env.storage().instance().set(&DataKey::Beneficiary, &beneficiary);
        env.storage().instance().set(&DataKey::ReliefToken, &relief_token);
        env.storage().instance().set(&DataKey::Campaign, &campaign);
        env.storage().instance().set(&DataKey::Organizer, &organizer);
        env.storage().instance().set(&DataKey::Factory, &factory);
        env.storage().instance().set(&DataKey::TotalSpent, &0i128);
        env.storage().instance().set(&DataKey::Paused, &false);

        // Set default category limits (7 decimals for Stellar)
        // Food: 1000 RELIEF
        env.storage().instance().set(&DataKey::CategoryLimit(SpendingCategory::Food as u32), &10000000000i128);
        // Medicine: 2000 RELIEF
        env.storage().instance().set(&DataKey::CategoryLimit(SpendingCategory::Medicine as u32), &20000000000i128);
        // Shelter: 5000 RELIEF
        env.storage().instance().set(&DataKey::CategoryLimit(SpendingCategory::Shelter as u32), &50000000000i128);
        // Education: 1500 RELIEF
        env.storage().instance().set(&DataKey::CategoryLimit(SpendingCategory::Education as u32), &15000000000i128);
        // Other: 500 RELIEF
        env.storage().instance().set(&DataKey::CategoryLimit(SpendingCategory::Other as u32), &5000000000i128);

        // Initialize empty vectors
        let empty_spending: Vec<Spending> = Vec::new(&env);
        let empty_merchants: Vec<Address> = Vec::new(&env);
        env.storage().instance().set(&DataKey::SpendingHistory, &empty_spending);
        env.storage().instance().set(&DataKey::Merchants, &empty_merchants);

        // Initialize category spent to zero
        for category in 0..5 {
            env.storage().instance().set(&DataKey::CategorySpent(category), &0i128);
        }
    }

    /// Spend funds at approved merchant
    /// Only beneficiary can call this
    /// 
    /// # Arguments
    /// * `beneficiary` - Beneficiary address (for auth)
    /// * `merchant` - Merchant address
    /// * `amount` - Amount to spend (7 decimals)
    /// * `category` - Spending category (0-4)
    /// * `description` - Description of purchase
    pub fn spend(
        env: Env,
        beneficiary: Address,
        merchant: Address,
        amount: i128,
        category: u32,
        description: String,
    ) {
        // Require beneficiary authorization
        beneficiary.require_auth();

        // Verify beneficiary
        let stored_beneficiary: Address = env.storage().instance().get(&DataKey::Beneficiary).unwrap();
        if beneficiary != stored_beneficiary {
            panic!("Only beneficiary can spend");
        }

        // Check if paused
        let paused: bool = env.storage().instance().get(&DataKey::Paused).unwrap_or(false);
        if paused {
            panic!("Wallet is paused");
        }

        // Validate inputs
        if amount <= 0 {
            panic!("Amount must be greater than 0");
        }
        if category > 4 {
            panic!("Invalid category");
        }

        // Check merchant verification
        let factory: Address = env.storage().instance().get(&DataKey::Factory).unwrap();
        
        // Check if globally verified OR locally approved
        // Note: This would require calling the factory contract's is_verified_merchant function
        // For now, we'll just check local approval
        let merchant_key = DataKey::ApprovedMerchant(merchant.clone(), category);
        let is_approved: bool = env.storage().instance().get(&merchant_key).unwrap_or(false);
        
        if !is_approved {
            panic!("Merchant not verified for this category");
        }

        // Check category limit
        let category_limit: i128 = env.storage().instance().get(&DataKey::CategoryLimit(category)).unwrap();
        if amount > category_limit {
            panic!("Amount exceeds category limit");
        }

        // Check wallet balance
        let relief_token: Address = env.storage().instance().get(&DataKey::ReliefToken).unwrap();
        let token_client = token::Client::new(&env, &relief_token);
        let balance = token_client.balance(&env.current_contract_address());
        
        if balance < amount {
            panic!("Insufficient balance");
        }

        // Transfer tokens to merchant
        token_client.transfer(&env.current_contract_address(), &merchant, &amount);

        // Update total spent
        let total_spent: i128 = env.storage().instance().get(&DataKey::TotalSpent).unwrap();
        env.storage().instance().set(&DataKey::TotalSpent, &(total_spent + amount));

        // Update category spent
        let category_spent_key = DataKey::CategorySpent(category);
        let category_spent: i128 = env.storage().instance().get(&category_spent_key).unwrap_or(0);
        env.storage().instance().set(&category_spent_key, &(category_spent + amount));

        // Convert category u32 to enum for storage
        let spending_category = match category {
            0 => SpendingCategory::Food,
            1 => SpendingCategory::Medicine,
            2 => SpendingCategory::Shelter,
            3 => SpendingCategory::Education,
            4 => SpendingCategory::Other,
            _ => panic!("Invalid category"),
        };

        // Record spending
        let mut history: Vec<Spending> = env.storage().instance().get(&DataKey::SpendingHistory).unwrap();
        history.push_back(Spending {
            merchant: merchant.clone(),
            amount,
            category: spending_category,
            description,
            timestamp: env.ledger().timestamp(),
        });
        env.storage().instance().set(&DataKey::SpendingHistory, &history);

        // Emit event
        env.events().publish(
            (soroban_sdk::symbol_short!("spent"), merchant),
            (amount, category, env.ledger().timestamp()),
        );
    }

    /// Approve merchant for specific category
    /// Only organizer can call this
    /// 
    /// # Arguments
    /// * `organizer` - Organizer address (for auth)
    /// * `merchant` - Merchant address
    /// * `category` - Spending category (0-4)
    pub fn approve_merchant(
        env: Env,
        organizer: Address,
        merchant: Address,
        category: u32,
    ) {
        organizer.require_auth();

        // Verify organizer
        let stored_organizer: Address = env.storage().instance().get(&DataKey::Organizer).unwrap();
        if organizer != stored_organizer {
            panic!("Only organizer can approve merchants");
        }

        if category > 4 {
            panic!("Invalid category");
        }

        // Check if already approved
        let key = DataKey::ApprovedMerchant(merchant.clone(), category);
        if env.storage().instance().get::<_, bool>(&key).unwrap_or(false) {
            panic!("Merchant already approved for this category");
        }

        // Note: In full implementation, should verify merchant is globally verified via factory contract

        // Approve merchant
        env.storage().instance().set(&key, &true);

        // Add to merchants list if new
        let mut merchants: Vec<Address> = env.storage().instance().get(&DataKey::Merchants).unwrap();
        let mut is_new = true;
        for i in 0..merchants.len() {
            if merchants.get(i).unwrap() == merchant {
                is_new = false;
                break;
            }
        }
        if is_new {
            merchants.push_back(merchant.clone());
            env.storage().instance().set(&DataKey::Merchants, &merchants);
        }

        // Emit event
        env.events().publish(
            (soroban_sdk::symbol_short!("mer_appr"), merchant),
            (category, env.ledger().timestamp()),
        );
    }

    /// Revoke merchant approval for category
    /// 
    /// # Arguments
    /// * `organizer` - Organizer address
    /// * `merchant` - Merchant address
    /// * `category` - Spending category
    pub fn revoke_merchant(
        env: Env,
        organizer: Address,
        merchant: Address,
        category: u32,
    ) {
        organizer.require_auth();

        let stored_organizer: Address = env.storage().instance().get(&DataKey::Organizer).unwrap();
        if organizer != stored_organizer {
            panic!("Only organizer can revoke merchants");
        }

        if category > 4 {
            panic!("Invalid category");
        }

        let key = DataKey::ApprovedMerchant(merchant.clone(), category);
        env.storage().instance().set(&key, &false);

        env.events().publish(
            (soroban_sdk::symbol_short!("mer_revk"), merchant),
            (category, env.ledger().timestamp()),
        );
    }

    /// Set category spending limit
    /// Only organizer can call this
    /// 
    /// # Arguments
    /// * `organizer` - Organizer address
    /// * `category` - Spending category
    /// * `new_limit` - New limit amount (7 decimals)
    pub fn set_category_limit(
        env: Env,
        organizer: Address,
        category: u32,
        new_limit: i128,
    ) {
        organizer.require_auth();

        let stored_organizer: Address = env.storage().instance().get(&DataKey::Organizer).unwrap();
        if organizer != stored_organizer {
            panic!("Only organizer can set limits");
        }

        if category > 4 {
            panic!("Invalid category");
        }
        if new_limit <= 0 {
            panic!("Limit must be greater than 0");
        }

        env.storage().instance().set(&DataKey::CategoryLimit(category), &new_limit);

        env.events().publish(
            (soroban_sdk::symbol_short!("lim_upd"),),
            (category, new_limit, env.ledger().timestamp()),
        );
    }

    /// Get category spending limit
    pub fn get_category_limit(env: Env, category: u32) -> i128 {
        env.storage().instance().get(&DataKey::CategoryLimit(category)).unwrap_or(0)
    }

    /// Get remaining amount in category
    pub fn get_remaining_in_category(env: Env, category: u32) -> i128 {
        let limit: i128 = env.storage().instance().get(&DataKey::CategoryLimit(category)).unwrap_or(0);
        let spent: i128 = env.storage().instance().get(&DataKey::CategorySpent(category)).unwrap_or(0);
        
        if spent >= limit {
            0
        } else {
            limit - spent
        }
    }

    /// Get wallet balance
    pub fn get_balance(env: Env) -> i128 {
        let relief_token: Address = env.storage().instance().get(&DataKey::ReliefToken).unwrap();
        let token_client = token::Client::new(&env, &relief_token);
        token_client.balance(&env.current_contract_address())
    }

    /// Get total spent
    pub fn get_total_spent(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalSpent).unwrap_or(0)
    }

    /// Get spending history count
    pub fn get_spending_history_count(env: Env) -> u32 {
        let history: Vec<Spending> = env.storage().instance().get(&DataKey::SpendingHistory).unwrap_or(Vec::new(&env));
        history.len()
    }

    /// Get approved merchants
    pub fn get_approved_merchants(env: Env) -> Vec<Address> {
        env.storage().instance().get(&DataKey::Merchants).unwrap_or(Vec::new(&env))
    }

    /// Check if merchant is approved for category
    pub fn is_merchant_approved(env: Env, merchant: Address, category: u32) -> bool {
        let key = DataKey::ApprovedMerchant(merchant, category);
        env.storage().instance().get(&key).unwrap_or(false)
    }

    /// Pause wallet (organizer only)
    pub fn pause(env: Env, organizer: Address) {
        organizer.require_auth();

        let stored_organizer: Address = env.storage().instance().get(&DataKey::Organizer).unwrap();
        if organizer != stored_organizer {
            panic!("Only organizer can pause");
        }

        env.storage().instance().set(&DataKey::Paused, &true);

        env.events().publish(
            (soroban_sdk::symbol_short!("paused"),),
            env.ledger().timestamp(),
        );
    }

    /// Unpause wallet (organizer only)
    pub fn unpause(env: Env, organizer: Address) {
        organizer.require_auth();

        let stored_organizer: Address = env.storage().instance().get(&DataKey::Organizer).unwrap();
        if organizer != stored_organizer {
            panic!("Only organizer can unpause");
        }

        env.storage().instance().set(&DataKey::Paused, &false);

        env.events().publish(
            (soroban_sdk::symbol_short!("unpaused"),),
            env.ledger().timestamp(),
        );
    }

    /// Get beneficiary address
    pub fn get_beneficiary(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Beneficiary).unwrap()
    }

    /// Check if wallet is paused
    pub fn is_paused(env: Env) -> bool {
        env.storage().instance().get(&DataKey::Paused).unwrap_or(false)
    }
}

#[cfg(test)]
mod test;
