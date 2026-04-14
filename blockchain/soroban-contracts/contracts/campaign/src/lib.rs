#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, String, Vec};

/// Campaign status enum
#[contracttype]
#[derive(Clone, Copy, PartialEq)]
#[repr(u32)]
pub enum CampaignStatus {
    Active = 0,
    Paused = 1,
    Completed = 2,
    Cancelled = 3,
}

/// Campaign information structure
#[contracttype]
#[derive(Clone)]
pub struct CampaignInfo {
    pub title: String,
    pub description: String,
    pub goal_amount: i128,
    pub raised_amount: i128,
    pub location: String,
    pub disaster_type: String,
    pub organizer: Address,
    pub admin: Address,
    pub status: CampaignStatus,
    pub created_at: u64,
}

/// Donation record
#[contracttype]
#[derive(Clone)]
pub struct Donation {
    pub donor: Address,
    pub amount: i128,
    pub timestamp: u64,
}

/// Allocation record
#[contracttype]
#[derive(Clone)]
pub struct Allocation {
    pub beneficiary: Address,
    pub amount: i128,
    pub timestamp: u64,
    pub executed: bool,
}

/// Storage keys for the campaign
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    CampaignInfo,
    ReliefToken,
    Factory,
    Donations,
    Allocations,
    DonorContribution(Address),
    BeneficiaryAllocation(Address),
    BeneficiaryWallet(Address),
    ApprovedBeneficiary(Address),
    AppliedBeneficiary(Address),
    Donors,
    Beneficiaries,
    AppliedBeneficiaryList,
    TotalAllocated,
    BeneficiaryWalletWasmHash,
}

#[contract]
pub struct Campaign;

#[contractimpl]
impl Campaign {
    /// Initialize the campaign
    ///
    /// # Arguments
    /// * `organizer` - Campaign organizer address
    /// * `admin` - Super admin address
    /// * `relief_token` - RELIEF token contract address
    /// * `factory` - Campaign factory contract address
    /// * `title` - Campaign title
    /// * `description` - Campaign description
    /// * `goal_amount` - Target amount to raise (7 decimals)
    /// * `location` - Disaster location
    /// * `disaster_type` - Type of disaster
    /// * `wallet_wasm_hash` - WASM hash for deploying beneficiary wallets
    pub fn initialize(
        env: Env,
        organizer: Address,
        admin: Address,
        relief_token: Address,
        factory: Address,
        title: String,
        description: String,
        goal_amount: i128,
        location: String,
        disaster_type: String,
        wallet_wasm_hash: soroban_sdk::BytesN<32>,
    ) {
        // Ensure not already initialized
        if env.storage().instance().has(&DataKey::CampaignInfo) {
            panic!("Already initialized");
        }

        // Validate inputs
        if goal_amount <= 0 {
            panic!("Invalid goal amount");
        }

        // Create campaign info
        let campaign_info = CampaignInfo {
            title,
            description,
            goal_amount,
            raised_amount: 0,
            location,
            disaster_type,
            organizer,
            admin,
            status: CampaignStatus::Active,
            created_at: env.ledger().timestamp(),
        };

        // Store data
        env.storage()
            .instance()
            .set(&DataKey::CampaignInfo, &campaign_info);
        env.storage()
            .instance()
            .set(&DataKey::ReliefToken, &relief_token);
        env.storage().instance().set(&DataKey::Factory, &factory);
        env.storage()
            .instance()
            .set(&DataKey::TotalAllocated, &0i128);
        env.storage()
            .instance()
            .set(&DataKey::BeneficiaryWalletWasmHash, &wallet_wasm_hash);

        // Initialize empty vectors
        let empty_donations: Vec<Donation> = Vec::new(&env);
        let empty_allocations: Vec<Allocation> = Vec::new(&env);
        let empty_addresses: Vec<Address> = Vec::new(&env);

        env.storage()
            .instance()
            .set(&DataKey::Donations, &empty_donations);
        env.storage()
            .instance()
            .set(&DataKey::Allocations, &empty_allocations);
        env.storage()
            .instance()
            .set(&DataKey::Donors, &empty_addresses.clone());
        env.storage()
            .instance()
            .set(&DataKey::Beneficiaries, &empty_addresses.clone());
        env.storage()
            .instance()
            .set(&DataKey::AppliedBeneficiaryList, &empty_addresses);
    }

    /// Donate RELIEF tokens to the campaign
    ///
    /// # Arguments
    /// * `donor` - Donor address
    /// * `amount` - Amount of RELIEF tokens to donate (7 decimals)
    pub fn donate(env: Env, donor: Address, amount: i128) {
        // Require donor authorization
        donor.require_auth();

        // Get campaign info
        let mut campaign_info: CampaignInfo = env
            .storage()
            .instance()
            .get(&DataKey::CampaignInfo)
            .unwrap();

        // Check status
        if campaign_info.status != CampaignStatus::Active {
            panic!("Campaign not active");
        }
        if amount <= 0 {
            panic!("Amount must be greater than 0");
        }

        // Get token contract
        let relief_token: Address = env.storage().instance().get(&DataKey::ReliefToken).unwrap();
        let token_client = token::Client::new(&env, &relief_token);

        // Transfer tokens from donor to campaign contract
        token_client.transfer(&donor, &env.current_contract_address(), &amount);

        // Update raised amount
        campaign_info.raised_amount += amount;
        env.storage()
            .instance()
            .set(&DataKey::CampaignInfo, &campaign_info);

        // Track donor contribution
        let donor_key = DataKey::DonorContribution(donor.clone());
        let previous_contribution: i128 = env.storage().instance().get(&donor_key).unwrap_or(0);

        // Add to donors list if first donation
        if previous_contribution == 0 {
            let mut donors: Vec<Address> = env.storage().instance().get(&DataKey::Donors).unwrap();
            donors.push_back(donor.clone());
            env.storage().instance().set(&DataKey::Donors, &donors);
        }

        env.storage()
            .instance()
            .set(&donor_key, &(previous_contribution + amount));

        // Record donation
        let mut donations: Vec<Donation> =
            env.storage().instance().get(&DataKey::Donations).unwrap();
        donations.push_back(Donation {
            donor: donor.clone(),
            amount,
            timestamp: env.ledger().timestamp(),
        });
        env.storage()
            .instance()
            .set(&DataKey::Donations, &donations);

        // Emit donation event
        env.events().publish(
            (soroban_sdk::symbol_short!("donation"), donor),
            (amount, env.ledger().timestamp()),
        );

        // Check if goal reached
        if campaign_info.raised_amount >= campaign_info.goal_amount {
            env.events().publish(
                (soroban_sdk::symbol_short!("goal_rchd"),),
                (campaign_info.raised_amount, env.ledger().timestamp()),
            );
        }
    }

    /// Apply to campaign as beneficiary
    ///
    /// # Arguments
    /// * `beneficiary` - Beneficiary address
    pub fn apply_as_beneficiary(env: Env, beneficiary: Address) {
        beneficiary.require_auth();

        let key = DataKey::AppliedBeneficiary(beneficiary.clone());

        // Check if already applied
        if env
            .storage()
            .instance()
            .get::<_, bool>(&key)
            .unwrap_or(false)
        {
            panic!("Already applied");
        }

        // Mark as applied
        env.storage().instance().set(&key, &true);

        // Add to applied list
        let mut applied_list: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::AppliedBeneficiaryList)
            .unwrap();
        applied_list.push_back(beneficiary.clone());
        env.storage()
            .instance()
            .set(&DataKey::AppliedBeneficiaryList, &applied_list);

        // Emit event
        env.events().publish(
            (soroban_sdk::symbol_short!("ben_apply"),),
            (beneficiary, env.ledger().timestamp()),
        );
    }

    /// Approve a beneficiary
    /// Only organizer or admin can call this
    ///
    /// # Arguments
    /// * `caller` - Organizer or admin address
    /// * `beneficiary` - Beneficiary to approve
    pub fn approve_beneficiary(env: Env, caller: Address, beneficiary: Address) {
        caller.require_auth();

        // Verify caller is organizer or admin
        let campaign_info: CampaignInfo = env
            .storage()
            .instance()
            .get(&DataKey::CampaignInfo)
            .unwrap();
        if caller != campaign_info.organizer && caller != campaign_info.admin {
            panic!("Only organizer or admin");
        }

        // Check if already approved
        let approved_key = DataKey::ApprovedBeneficiary(beneficiary.clone());
        if env
            .storage()
            .instance()
            .get::<_, bool>(&approved_key)
            .unwrap_or(false)
        {
            panic!("Already approved");
        }

        // If beneficiary hasn't applied, add them to applied list
        let applied_key = DataKey::AppliedBeneficiary(beneficiary.clone());
        if !env
            .storage()
            .instance()
            .get::<_, bool>(&applied_key)
            .unwrap_or(false)
        {
            env.storage().instance().set(&applied_key, &true);
            let mut applied_list: Vec<Address> = env
                .storage()
                .instance()
                .get(&DataKey::AppliedBeneficiaryList)
                .unwrap();
            applied_list.push_back(beneficiary.clone());
            env.storage()
                .instance()
                .set(&DataKey::AppliedBeneficiaryList, &applied_list);
        }

        // Mark as approved
        env.storage().instance().set(&approved_key, &true);

        // Emit event
        env.events().publish(
            (soroban_sdk::symbol_short!("ben_apprv"),),
            (beneficiary, env.ledger().timestamp()),
        );
    }

    /// Reject a beneficiary application
    ///
    /// # Arguments
    /// * `caller` - Organizer or admin
    /// * `beneficiary` - Beneficiary to reject
    pub fn reject_beneficiary(env: Env, caller: Address, beneficiary: Address) {
        caller.require_auth();

        // Verify caller
        let campaign_info: CampaignInfo = env
            .storage()
            .instance()
            .get(&DataKey::CampaignInfo)
            .unwrap();
        if caller != campaign_info.organizer && caller != campaign_info.admin {
            panic!("Only organizer or admin");
        }

        // Remove approval and application status
        env.storage()
            .instance()
            .set(&DataKey::AppliedBeneficiary(beneficiary.clone()), &false);
        env.storage()
            .instance()
            .set(&DataKey::ApprovedBeneficiary(beneficiary.clone()), &false);

        // Emit event
        env.events().publish(
            (soroban_sdk::symbol_short!("ben_rejct"),),
            (beneficiary, env.ledger().timestamp()),
        );
    }

    /// Allocate funds to beneficiary and create wallet
    /// Only organizer or admin can call this
    ///
    /// # Arguments
    /// * `caller` - Organizer or admin
    /// * `beneficiary` - Beneficiary address
    /// * `amount` - Amount to allocate (7 decimals)
    ///
    /// # Returns
    /// Address of the beneficiary wallet contract
    pub fn allocate_funds(
        env: Env,
        caller: Address,
        beneficiary: Address,
        amount: i128,
    ) -> Address {
        caller.require_auth();

        // Verify caller
        let campaign_info: CampaignInfo = env
            .storage()
            .instance()
            .get(&DataKey::CampaignInfo)
            .unwrap();
        if caller != campaign_info.organizer && caller != campaign_info.admin {
            panic!("Only organizer or admin");
        }

        // Validate
        if amount <= 0 {
            panic!("Amount must be greater than 0");
        }

        // Check if beneficiary is approved
        if !env
            .storage()
            .instance()
            .get::<_, bool>(&DataKey::ApprovedBeneficiary(beneficiary.clone()))
            .unwrap_or(false)
        {
            panic!("Beneficiary not approved");
        }

        // Check balance
        let total_allocated: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalAllocated)
            .unwrap();
        if campaign_info.raised_amount < total_allocated + amount {
            panic!("Insufficient campaign balance");
        }

        // Create or get beneficiary wallet
        let wallet_key = DataKey::BeneficiaryWallet(beneficiary.clone());
        let wallet_address = if let Some(existing_wallet) =
            env.storage().instance().get::<_, Address>(&wallet_key)
        {
            existing_wallet
        } else {
            // Deploy new beneficiary wallet
            let wallet_wasm_hash: soroban_sdk::BytesN<32> = env
                .storage()
                .instance()
                .get(&DataKey::BeneficiaryWalletWasmHash)
                .unwrap();
            let relief_token: Address =
                env.storage().instance().get(&DataKey::ReliefToken).unwrap();
            let factory: Address = env.storage().instance().get(&DataKey::Factory).unwrap();

            let salt = env
                .crypto()
                .sha256(&soroban_sdk::Bytes::from_slice(&env, &[0u8; 32]));
            let wallet_address = env
                .deployer()
                .with_current_contract(salt)
                .deploy(wallet_wasm_hash);

            // TODO: Initialize wallet contract
            // wallet.initialize(beneficiary, relief_token, env.current_contract_address(), campaign_info.organizer, factory)

            // Store wallet address
            env.storage().instance().set(&wallet_key, &wallet_address);

            // Add to beneficiaries list
            let mut beneficiaries: Vec<Address> = env
                .storage()
                .instance()
                .get(&DataKey::Beneficiaries)
                .unwrap();
            beneficiaries.push_back(beneficiary.clone());
            env.storage()
                .instance()
                .set(&DataKey::Beneficiaries, &beneficiaries);

            wallet_address
        };

        // Transfer tokens to wallet
        let relief_token: Address = env.storage().instance().get(&DataKey::ReliefToken).unwrap();
        let token_client = token::Client::new(&env, &relief_token);
        token_client.transfer(&env.current_contract_address(), &wallet_address, &amount);

        // Update allocations
        env.storage()
            .instance()
            .set(&DataKey::TotalAllocated, &(total_allocated + amount));

        let allocation_key = DataKey::BeneficiaryAllocation(beneficiary.clone());
        let previous_allocation: i128 = env.storage().instance().get(&allocation_key).unwrap_or(0);
        env.storage()
            .instance()
            .set(&allocation_key, &(previous_allocation + amount));

        // Record allocation
        let mut allocations: Vec<Allocation> =
            env.storage().instance().get(&DataKey::Allocations).unwrap();
        allocations.push_back(Allocation {
            beneficiary: beneficiary.clone(),
            amount,
            timestamp: env.ledger().timestamp(),
            executed: true,
        });
        env.storage()
            .instance()
            .set(&DataKey::Allocations, &allocations);

        // Emit event
        env.events().publish(
            (soroban_sdk::symbol_short!("allocated"), beneficiary),
            (wallet_address.clone(), amount, env.ledger().timestamp()),
        );

        wallet_address
    }

    /// Get campaign information
    pub fn get_campaign_info(env: Env) -> CampaignInfo {
        env.storage()
            .instance()
            .get(&DataKey::CampaignInfo)
            .unwrap()
    }

    /// Get campaign balance
    pub fn get_balance(env: Env) -> i128 {
        let relief_token: Address = env.storage().instance().get(&DataKey::ReliefToken).unwrap();
        let token_client = token::Client::new(&env, &relief_token);
        token_client.balance(&env.current_contract_address())
    }

    /// Get available balance for allocation
    pub fn get_available_balance(env: Env) -> i128 {
        let campaign_info: CampaignInfo = env
            .storage()
            .instance()
            .get(&DataKey::CampaignInfo)
            .unwrap();
        let total_allocated: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalAllocated)
            .unwrap();
        campaign_info.raised_amount - total_allocated
    }

    /// Get all donors
    pub fn get_donors(env: Env) -> Vec<Address> {
        env.storage()
            .instance()
            .get(&DataKey::Donors)
            .unwrap_or(Vec::new(&env))
    }

    /// Get all beneficiaries
    pub fn get_beneficiaries(env: Env) -> Vec<Address> {
        env.storage()
            .instance()
            .get(&DataKey::Beneficiaries)
            .unwrap_or(Vec::new(&env))
    }

    /// Get donations count
    pub fn get_donations_count(env: Env) -> u32 {
        let donations: Vec<Donation> = env
            .storage()
            .instance()
            .get(&DataKey::Donations)
            .unwrap_or(Vec::new(&env));
        donations.len()
    }

    /// Get allocations count
    pub fn get_allocations_count(env: Env) -> u32 {
        let allocations: Vec<Allocation> = env
            .storage()
            .instance()
            .get(&DataKey::Allocations)
            .unwrap_or(Vec::new(&env));
        allocations.len()
    }

    /// Get completion percentage (0-100)
    pub fn get_completion_percentage(env: Env) -> u32 {
        let campaign_info: CampaignInfo = env
            .storage()
            .instance()
            .get(&DataKey::CampaignInfo)
            .unwrap();
        if campaign_info.goal_amount == 0 {
            return 0;
        }
        ((campaign_info.raised_amount * 100) / campaign_info.goal_amount) as u32
    }

    /// Check if beneficiary is approved
    pub fn is_beneficiary_approved(env: Env, beneficiary: Address) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::ApprovedBeneficiary(beneficiary))
            .unwrap_or(false)
    }

    /// Check if beneficiary has applied
    pub fn has_beneficiary_applied(env: Env, beneficiary: Address) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::AppliedBeneficiary(beneficiary))
            .unwrap_or(false)
    }

    /// Get beneficiary wallet address
    pub fn get_beneficiary_wallet(env: Env, beneficiary: Address) -> Option<Address> {
        env.storage()
            .instance()
            .get(&DataKey::BeneficiaryWallet(beneficiary))
    }

    /// Get applied beneficiaries list
    pub fn get_applied_beneficiaries(env: Env) -> Vec<Address> {
        env.storage()
            .instance()
            .get(&DataKey::AppliedBeneficiaryList)
            .unwrap_or(Vec::new(&env))
    }

    /// Pause campaign
    pub fn pause(env: Env, caller: Address) {
        caller.require_auth();

        let mut campaign_info: CampaignInfo = env
            .storage()
            .instance()
            .get(&DataKey::CampaignInfo)
            .unwrap();
        if caller != campaign_info.organizer && caller != campaign_info.admin {
            panic!("Only organizer or admin");
        }

        campaign_info.status = CampaignStatus::Paused;
        env.storage()
            .instance()
            .set(&DataKey::CampaignInfo, &campaign_info);

        env.events().publish(
            (soroban_sdk::symbol_short!("paused"),),
            env.ledger().timestamp(),
        );
    }

    /// Unpause campaign
    pub fn unpause(env: Env, caller: Address) {
        caller.require_auth();

        let mut campaign_info: CampaignInfo = env
            .storage()
            .instance()
            .get(&DataKey::CampaignInfo)
            .unwrap();
        if caller != campaign_info.organizer && caller != campaign_info.admin {
            panic!("Only organizer or admin");
        }

        campaign_info.status = CampaignStatus::Active;
        env.storage()
            .instance()
            .set(&DataKey::CampaignInfo, &campaign_info);

        env.events().publish(
            (soroban_sdk::symbol_short!("unpaused"),),
            env.ledger().timestamp(),
        );
    }

    /// Mark campaign as completed
    pub fn mark_completed(env: Env, caller: Address) {
        caller.require_auth();

        let mut campaign_info: CampaignInfo = env
            .storage()
            .instance()
            .get(&DataKey::CampaignInfo)
            .unwrap();
        if caller != campaign_info.organizer && caller != campaign_info.admin {
            panic!("Only organizer or admin");
        }

        campaign_info.status = CampaignStatus::Completed;
        env.storage()
            .instance()
            .set(&DataKey::CampaignInfo, &campaign_info);

        env.events().publish(
            (soroban_sdk::symbol_short!("completed"),),
            env.ledger().timestamp(),
        );
    }

    /// Cancel campaign (admin only)
    pub fn cancel(env: Env, admin: Address) {
        admin.require_auth();

        let mut campaign_info: CampaignInfo = env
            .storage()
            .instance()
            .get(&DataKey::CampaignInfo)
            .unwrap();
        if admin != campaign_info.admin {
            panic!("Only admin can cancel");
        }

        campaign_info.status = CampaignStatus::Cancelled;
        env.storage()
            .instance()
            .set(&DataKey::CampaignInfo, &campaign_info);

        env.events().publish(
            (soroban_sdk::symbol_short!("cancelled"),),
            env.ledger().timestamp(),
        );
    }
}

#[cfg(test)]
mod test;
