#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env, String};

#[test]
fn test_initialize() {
    let env = Env::default();
    let contract_id = env.register_contract(None, CampaignFactory);
    let client = CampaignFactoryClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let relief_token = Address::generate(&env);
    let campaign_wasm_hash = BytesN::from_array(&env, &[0u8; 32]);

    client.initialize(&admin, &relief_token, &campaign_wasm_hash);

    assert_eq!(client.get_admin(), admin);
    assert_eq!(client.get_relief_token(), relief_token);
    assert_eq!(client.get_campaign_count(), 0);
}

#[test]
fn test_approve_organizer() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, CampaignFactory);
    let client = CampaignFactoryClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let relief_token = Address::generate(&env);
    let campaign_wasm_hash = BytesN::from_array(&env, &[0u8; 32]);
    let organizer = Address::generate(&env);

    client.initialize(&admin, &relief_token, &campaign_wasm_hash);

    // Initially not approved
    assert_eq!(client.is_approved_organizer(&organizer), false);

    // Approve organizer
    client.approve_organizer(&admin, &organizer);

    // Now approved
    assert_eq!(client.is_approved_organizer(&organizer), true);

    // Should be in the list
    let organizers = client.get_approved_organizers();
    assert_eq!(organizers.len(), 1);
}

#[test]
fn test_verify_merchant() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, CampaignFactory);
    let client = CampaignFactoryClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let relief_token = Address::generate(&env);
    let campaign_wasm_hash = BytesN::from_array(&env, &[0u8; 32]);
    let merchant = Address::generate(&env);

    client.initialize(&admin, &relief_token, &campaign_wasm_hash);

    // Initially not verified
    assert_eq!(client.is_verified_merchant(&merchant), false);

    // Verify merchant
    client.verify_merchant(&admin, &merchant);

    // Now verified
    assert_eq!(client.is_verified_merchant(&merchant), true);

    // Should be in the list
    let merchants = client.get_verified_merchants();
    assert_eq!(merchants.len(), 1);
}

#[test]
#[should_panic(expected = "Already initialized")]
fn test_double_initialize() {
    let env = Env::default();
    let contract_id = env.register_contract(None, CampaignFactory);
    let client = CampaignFactoryClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let relief_token = Address::generate(&env);
    let campaign_wasm_hash = BytesN::from_array(&env, &[0u8; 32]);

    client.initialize(&admin, &relief_token, &campaign_wasm_hash);
    client.initialize(&admin, &relief_token, &campaign_wasm_hash); // Should panic
}
