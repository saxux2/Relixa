#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, String, Vec};

/// Storage keys for the campaign factory
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Super admin address
    Admin,
    /// RELIEF token address
    ReliefToken,
    /// Approved organizers (Vec<Address>)
    ApprovedOrganizers,
    /// Check if organizer is approved
    OrganizerStatus(Address),
    /// Verified merchants (Vec<Address>)
    VerifiedMerchants,
    /// Check if merchant is verified
    MerchantStatus(Address),
    /// All campaign addresses (Vec<Address>)
    Campaigns,
    /// Campaigns by organizer
    OrganizerCampaigns(Address),
    /// Campaign counter
    CampaignCount,
    /// Campaign WASM hash for deployment
    CampaignWasmHash,
}

#[contract]
pub struct CampaignFactory;

#[contractimpl]
impl CampaignFactory {
    /// Initialize the campaign factory
    ///
    /// # Arguments
    /// * `admin` - Super admin address
    /// * `relief_token` - RELIEF token contract address
    /// * `campaign_wasm_hash` - WASM hash of Campaign contract for deployment
    pub fn initialize(
        env: Env,
        admin: Address,
        relief_token: Address,
        campaign_wasm_hash: BytesN<32>,
    ) {
        // Ensure not already initialized
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }

        // Require admin authorization
        admin.require_auth();

        // Store initialization data
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::ReliefToken, &relief_token);
        env.storage()
            .instance()
            .set(&DataKey::CampaignWasmHash, &campaign_wasm_hash);
        env.storage().instance().set(&DataKey::CampaignCount, &0u32);

        // Initialize empty vectors
        let empty_vec: Vec<Address> = Vec::new(&env);
        env.storage()
            .instance()
            .set(&DataKey::ApprovedOrganizers, &empty_vec);
        env.storage()
            .instance()
            .set(&DataKey::VerifiedMerchants, &empty_vec);
        env.storage()
            .instance()
            .set(&DataKey::Campaigns, &empty_vec);
    }

    /// Approve an organizer to create campaigns
    /// Only admin can call this
    ///
    /// # Arguments
    /// * `admin` - Admin address (must match stored admin)
    /// * `organizer` - Organizer address to approve
    pub fn approve_organizer(env: Env, admin: Address, organizer: Address) {
        // Verify admin
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("Only admin can approve organizers");
        }

        // Check if already approved
        let key = DataKey::OrganizerStatus(organizer.clone());
        if env
            .storage()
            .instance()
            .get::<_, bool>(&key)
            .unwrap_or(false)
        {
            panic!("Organizer already approved");
        }

        // Mark as approved
        env.storage().instance().set(&key, &true);

        // Add to approved list
        let mut organizers: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::ApprovedOrganizers)
            .unwrap();
        organizers.push_back(organizer.clone());
        env.storage()
            .instance()
            .set(&DataKey::ApprovedOrganizers, &organizers);

        // Emit event
        env.events().publish(
            (soroban_sdk::symbol_short!("org_appr"),),
            (organizer, env.ledger().timestamp()),
        );
    }

    /// Revoke organizer approval
    /// Only admin can call this
    ///
    /// # Arguments
    /// * `admin` - Admin address
    /// * `organizer` - Organizer to revoke
    pub fn revoke_organizer(env: Env, admin: Address, organizer: Address) {
        // Verify admin
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("Only admin can revoke organizers");
        }

        // Mark as not approved
        let key = DataKey::OrganizerStatus(organizer.clone());
        env.storage().instance().set(&key, &false);

        // Emit event
        env.events().publish(
            (soroban_sdk::symbol_short!("org_revk"),),
            (organizer, env.ledger().timestamp()),
        );
    }

    /// Check if an organizer is approved
    ///
    /// # Arguments
    /// * `organizer` - Organizer address to check
    ///
    /// # Returns
    /// `true` if approved, `false` otherwise
    pub fn is_approved_organizer(env: Env, organizer: Address) -> bool {
        let key = DataKey::OrganizerStatus(organizer);
        env.storage()
            .instance()
            .get::<_, bool>(&key)
            .unwrap_or(false)
    }

    /// Verify a merchant (global verification)
    /// Only admin can call this
    ///
    /// # Arguments
    /// * `admin` - Admin address
    /// * `merchant` - Merchant address to verify
    pub fn verify_merchant(env: Env, admin: Address, merchant: Address) {
        // Verify admin
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("Only admin can verify merchants");
        }

        // Check if already verified
        let key = DataKey::MerchantStatus(merchant.clone());
        if env
            .storage()
            .instance()
            .get::<_, bool>(&key)
            .unwrap_or(false)
        {
            panic!("Merchant already verified");
        }

        // Mark as verified
        env.storage().instance().set(&key, &true);

        // Add to verified list
        let mut merchants: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::VerifiedMerchants)
            .unwrap();
        merchants.push_back(merchant.clone());
        env.storage()
            .instance()
            .set(&DataKey::VerifiedMerchants, &merchants);

        // Emit event
        env.events().publish(
            (soroban_sdk::symbol_short!("mer_verif"),),
            (merchant, env.ledger().timestamp()),
        );
    }

    /// Revoke merchant verification
    /// Only admin can call this
    ///
    /// # Arguments
    /// * `admin` - Admin address
    /// * `merchant` - Merchant to revoke
    pub fn revoke_merchant(env: Env, admin: Address, merchant: Address) {
        // Verify admin
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != stored_admin {
            panic!("Only admin can revoke merchants");
        }

        // Mark as not verified
        let key = DataKey::MerchantStatus(merchant.clone());
        env.storage().instance().set(&key, &false);

        // Emit event
        env.events().publish(
            (soroban_sdk::symbol_short!("mer_revk"),),
            (merchant, env.ledger().timestamp()),
        );
    }

    /// Check if a merchant is verified
    ///
    /// # Arguments
    /// * `merchant` - Merchant address to check
    ///
    /// # Returns
    /// `true` if verified, `false` otherwise
    pub fn is_verified_merchant(env: Env, merchant: Address) -> bool {
        let key = DataKey::MerchantStatus(merchant);
        env.storage()
            .instance()
            .get::<_, bool>(&key)
            .unwrap_or(false)
    }

    /// Create a new campaign
    /// Only approved organizers can call this
    ///
    /// # Arguments
    /// * `organizer` - Campaign organizer (must be approved)
    /// * `title` - Campaign title
    /// * `description` - Campaign description
    /// * `goal_amount` - Target amount to raise (in RELIEF tokens, 7 decimals)
    /// * `location` - Disaster location
    /// * `disaster_type` - Type of disaster
    ///
    /// # Returns
    /// Address of the newly deployed campaign contract
    pub fn create_campaign(
        env: Env,
        organizer: Address,
        title: String,
        description: String,
        goal_amount: i128,
        location: String,
        disaster_type: String,
    ) -> Address {
        // Verify organizer authorization
        organizer.require_auth();

        // Check if organizer is approved
        if !Self::is_approved_organizer(env.clone(), organizer.clone()) {
            panic!("Not an approved organizer");
        }

        // Validate inputs
        if goal_amount <= 0 {
            panic!("Goal must be greater than 0");
        }
        if title.len() == 0 {
            panic!("Title cannot be empty");
        }

        // Get stored data
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        let relief_token: Address = env.storage().instance().get(&DataKey::ReliefToken).unwrap();
        let campaign_wasm_hash: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::CampaignWasmHash)
            .unwrap();

        // Deploy new campaign contract
        // Use campaign count as salt for unique addresses
        let campaign_count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::CampaignCount)
            .unwrap();
        let salt = env.crypto().sha256(&soroban_sdk::Bytes::from_slice(
            &env,
            &campaign_count.to_le_bytes(),
        ));

        let campaign_address = env
            .deployer()
            .with_current_contract(salt)
            .deploy(campaign_wasm_hash);

        // TODO: Initialize the campaign contract with parameters
        // This would require calling campaign.initialize() after deployment
        // For now, we'll just store the address

        // Increment campaign count
        env.storage()
            .instance()
            .set(&DataKey::CampaignCount, &(campaign_count + 1));

        // Store campaign address
        let mut campaigns: Vec<Address> =
            env.storage().instance().get(&DataKey::Campaigns).unwrap();
        campaigns.push_back(campaign_address.clone());
        env.storage()
            .instance()
            .set(&DataKey::Campaigns, &campaigns);

        // Store in organizer's campaigns
        let organizer_key = DataKey::OrganizerCampaigns(organizer.clone());
        let mut organizer_campaigns: Vec<Address> = env
            .storage()
            .instance()
            .get(&organizer_key)
            .unwrap_or(Vec::new(&env));
        organizer_campaigns.push_back(campaign_address.clone());
        env.storage()
            .instance()
            .set(&organizer_key, &organizer_campaigns);

        // Emit event
        env.events().publish(
            (soroban_sdk::symbol_short!("camp_crt"), organizer.clone()),
            (
                campaign_address.clone(),
                goal_amount,
                env.ledger().timestamp(),
            ),
        );

        campaign_address
    }

    /// Get all campaigns
    ///
    /// # Returns
    /// Vector of all campaign addresses
    pub fn get_all_campaigns(env: Env) -> Vec<Address> {
        env.storage()
            .instance()
            .get(&DataKey::Campaigns)
            .unwrap_or(Vec::new(&env))
    }

    /// Get campaigns by organizer
    ///
    /// # Arguments
    /// * `organizer` - Organizer address
    ///
    /// # Returns
    /// Vector of campaign addresses created by this organizer
    pub fn get_campaigns_by_organizer(env: Env, organizer: Address) -> Vec<Address> {
        let key = DataKey::OrganizerCampaigns(organizer);
        env.storage().instance().get(&key).unwrap_or(Vec::new(&env))
    }

    /// Get total number of campaigns
    ///
    /// # Returns
    /// Total campaign count
    pub fn get_campaign_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::CampaignCount)
            .unwrap_or(0)
    }

    /// Get all approved organizers
    ///
    /// # Returns
    /// Vector of approved organizer addresses
    pub fn get_approved_organizers(env: Env) -> Vec<Address> {
        env.storage()
            .instance()
            .get(&DataKey::ApprovedOrganizers)
            .unwrap_or(Vec::new(&env))
    }

    /// Get all verified merchants
    ///
    /// # Returns
    /// Vector of verified merchant addresses
    pub fn get_verified_merchants(env: Env) -> Vec<Address> {
        env.storage()
            .instance()
            .get(&DataKey::VerifiedMerchants)
            .unwrap_or(Vec::new(&env))
    }

    /// Get admin address
    ///
    /// # Returns
    /// Admin address
    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    /// Get RELIEF token address
    ///
    /// # Returns
    /// RELIEF token contract address
    pub fn get_relief_token(env: Env) -> Address {
        env.storage().instance().get(&DataKey::ReliefToken).unwrap()
    }
}

#[cfg(test)]
mod test;
