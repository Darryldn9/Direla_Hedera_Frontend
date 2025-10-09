#!/usr/bin/env node

/**
 * Test script for BNPL currency conversion functionality
 * This script tests the backend currency conversion endpoint
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testCurrencyConversion() {
  console.log('🧪 Testing BNPL Currency Conversion...\n');

  try {
    // Test 1: Generate a currency quote
    console.log('1. Testing currency quote generation...');
    const quoteResponse = await axios.post(`${API_BASE_URL}/bnpl/quote`, {
      buyerAccountId: 'test-buyer-123',
      merchantAccountId: 'test-merchant-456',
      amount: 100,
      buyerCurrency: 'USD',
      merchantCurrency: 'EUR'
    });

    if (quoteResponse.data.success) {
      console.log('✅ Currency quote generated successfully');
      console.log('   Quote ID:', quoteResponse.data.data.quoteId);
      console.log('   Exchange Rate:', quoteResponse.data.data.exchangeRate);
      console.log('   From Amount:', quoteResponse.data.data.fromAmount, quoteResponse.data.data.fromCurrency);
      console.log('   To Amount:', quoteResponse.data.data.toAmount, quoteResponse.data.data.toCurrency);
    } else {
      console.log('❌ Currency quote generation failed');
      console.log('   Error:', quoteResponse.data.error);
    }

    console.log('\n2. Testing BNPL terms creation...');
    
    // First create some BNPL terms
    const termsResponse = await axios.post(`${API_BASE_URL}/bnpl/terms`, {
      paymentId: 'test-payment-789',
      buyerAccountId: 'test-buyer-123',
      merchantAccountId: 'test-merchant-456',
      totalAmount: 100,
      currency: 'EUR',
      installmentCount: 3,
      interestRate: 5,
      expiresInMinutes: 30
    });

    if (termsResponse.data.success) {
      console.log('✅ BNPL terms created successfully');
      const termsId = termsResponse.data.data.id;
      console.log('   Terms ID:', termsId);

      console.log('\n3. Testing currency conversion...');
      
      // Now test currency conversion
      const convertResponse = await axios.post(`${API_BASE_URL}/bnpl/terms/${termsId}/convert`, {
        buyerCurrency: 'USD'
      });

      if (convertResponse.data.success) {
        console.log('✅ Currency conversion successful');
        const converted = convertResponse.data.data.convertedTerms;
        console.log('   Original Total Amount:', termsResponse.data.data.totalAmount, termsResponse.data.data.currency);
        console.log('   Converted Total Amount:', converted.totalAmount, converted.currency);
        console.log('   Exchange Rate:', converted.exchangeRate);
        console.log('   Installment Amount:', converted.installmentAmount, converted.currency);
        console.log('   Total Interest:', converted.totalInterest, converted.currency);
        console.log('   Total with Interest:', converted.totalAmountWithInterest, converted.currency);
      } else {
        console.log('❌ Currency conversion failed');
        console.log('   Error:', convertResponse.data.error);
      }
    } else {
      console.log('❌ BNPL terms creation failed');
      console.log('   Error:', termsResponse.data.error);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

// Run the test
testCurrencyConversion().then(() => {
  console.log('\n🏁 Currency conversion test completed');
}).catch(error => {
  console.error('💥 Test script failed:', error);
});
