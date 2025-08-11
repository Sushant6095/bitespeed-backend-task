import 'dotenv/config';
import { identifyContact, closePrismaConnection } from './contact.service';

async function testIdentifyContact() {
  console.log('🧪 Testing Contact Identification Service\n');

  try {
    // Test Case 1: New contact (no existing matches)
    console.log('📝 Test Case 1: New contact');
    const result1 = await identifyContact('test@example.com', '+1234567890');
    console.log('Result:', JSON.stringify(result1, null, 2));
    console.log('');

    // Test Case 2: Existing contact with same email
    console.log('📝 Test Case 2: Existing contact with same email');
    const result2 = await identifyContact('test@example.com', '+9876543210');
    console.log('Result:', JSON.stringify(result2, null, 2));
    console.log('');

    // Test Case 3: Existing contact with same phone number
    console.log('📝 Test Case 3: Existing contact with same phone number');
    const result3 = await identifyContact('another@example.com', '+1234567890');
    console.log('Result:', JSON.stringify(result3, null, 2));
    console.log('');

    // Test Case 4: Only email provided
    console.log('📝 Test Case 4: Only email provided');
    const result4 = await identifyContact('newuser@example.com');
    console.log('Result:', JSON.stringify(result4, null, 2));
    console.log('');

    // Test Case 5: Only phone number provided
    console.log('📝 Test Case 5: Only phone number provided');
    const result5 = await identifyContact(undefined, '+5555555555');
    console.log('Result:', JSON.stringify(result5, null, 2));
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await closePrismaConnection();
    console.log('🔌 Database connection closed');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testIdentifyContact();
}
