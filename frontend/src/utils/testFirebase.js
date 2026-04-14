import { db } from '../firebase/config';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

/**
 * Test Firebase connection and write permissions
 * Run this from browser console: window.testFirebase()
 */
export async function testFirebaseConnection() {
  console.log('🧪 FIREBASE CONNECTION TEST');
  console.log('═══════════════════════════════════════');
  
  // Test 1: Check if Firebase is initialized
  console.log('Test 1: Firebase Initialization');
  if (!db) {
    console.error('❌ FAILED: Firebase not initialized');
    console.log('Solution: Add Firebase credentials to .env file and restart dev server');
    return { success: false, error: 'Firebase not initialized' };
  }
  console.log('✅ PASSED: Firebase initialized');
  
  // Test 2: Try to read from campaigns collection
  console.log('\nTest 2: Read from campaigns collection');
  try {
    const campaignsRef = collection(db, 'campaigns');
    const snapshot = await getDocs(campaignsRef);
    console.log(`✅ PASSED: Read ${snapshot.size} campaigns`);
  } catch (error) {
    console.error('❌ FAILED:', error.code, error.message);
    if (error.code === 'permission-denied') {
      console.log('Solution: Update Firestore rules to allow read access');
    }
    return { success: false, error: 'Read failed', code: error.code };
  }
  
  // Test 3: Try to write a test campaign
  console.log('\nTest 3: Write test campaign');
  let testDocId = null;
  try {
    const testCampaign = {
      title: 'TEST CAMPAIGN - DELETE ME',
      description: 'This is a test campaign created by testFirebase()',
      goal: 1000,
      location: 'Test Location',
      deadline: '2026-12-31',
      organizerAddress: 'TEST_ADDRESS',
      organizerAddressLower: 'test_address',
      organizerId: 'test_organizer',
      organizerName: 'Test Organizer',
      status: 'pending',
      raised: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      network: 'stellar-testnet',
      isTest: true
    };
    
    console.log('Attempting to create test campaign...');
    const docRef = await addDoc(collection(db, 'campaigns'), testCampaign);
    testDocId = docRef.id;
    console.log(`✅ PASSED: Created test campaign with ID: ${docRef.id}`);
    
    // Clean up test document
    console.log('\nTest 4: Delete test campaign');
    await deleteDoc(doc(db, 'campaigns', testDocId));
    console.log('✅ PASSED: Deleted test campaign');
    
  } catch (error) {
    console.error('❌ FAILED:', error.code, error.message);
    console.error('Full error:', error);
    
    if (error.code === 'permission-denied') {
      console.log('\n🚨 PERMISSION DENIED - Firestore Rules Issue');
      console.log('═══════════════════════════════════════');
      console.log('Go to Firebase Console → Firestore Database → Rules');
      console.log('Add this rule to allow campaign creation:\n');
      console.log('rules_version = \'2\';');
      console.log('service cloud.firestore {');
      console.log('  match /databases/{database}/documents {');
      console.log('    match /campaigns/{campaignId} {');
      console.log('      allow read: if true;');
      console.log('      allow create: if true;');
      console.log('      allow update: if true;');
      console.log('      allow delete: if true;');
      console.log('    }');
      console.log('    match /{document=**} {');
      console.log('      allow read, write: if true;');
      console.log('    }');
      console.log('  }');
      console.log('}');
      console.log('\n⚠️ Note: These are OPEN rules for development only!');
    } else if (error.code === 'unavailable') {
      console.log('\n🚨 FIRESTORE UNAVAILABLE');
      console.log('Check: Internet connection, VPN, Firewall');
    }
    
    return { success: false, error: 'Write failed', code: error.code, message: error.message };
  }
  
  console.log('\n═══════════════════════════════════════');
  console.log('🎉 ALL TESTS PASSED!');
  console.log('Firebase is properly configured and writable.');
  console.log('═══════════════════════════════════════');
  
  return { success: true };
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  window.testFirebase = testFirebaseConnection;
}

export default testFirebaseConnection;
