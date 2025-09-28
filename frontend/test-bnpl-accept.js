// Simple test script to debug BNPL acceptance
const API_BASE_URL = 'http://localhost:3001'; // Adjust if needed

async function testBNPLAccept() {
  const termsId = 'test-terms-id';
  const accountId = 'test-account-id';
  
  console.log('Testing BNPL accept with:', { termsId, accountId });
  
  try {
    const response = await fetch(`${API_BASE_URL}/bnpl/terms/${termsId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accountId }),
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testBNPLAccept();
