const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function queryBNPLTerms(paymentId) {
  try {
    console.log(`Querying BNPL terms for payment ID: ${paymentId}`);
    
    const { data, error } = await supabase
      .from('bnpl_terms')
      .select('*')
      .eq('payment_id', paymentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('No BNPL terms found for this payment ID');
        return null;
      }
      console.error('Error querying BNPL terms:', error);
      return null;
    }

    console.log('BNPL Terms Found:');
    console.log('================');
    console.log(`ID: ${data.id}`);
    console.log(`Payment ID: ${data.payment_id}`);
    console.log(`Buyer Account: ${data.buyer_account_id}`);
    console.log(`Merchant Account: ${data.merchant_account_id}`);
    console.log(`Total Amount: ${data.total_amount}`);
    console.log(`Currency: ${data.currency}`);
    console.log(`Installment Count: ${data.installment_count}`);
    console.log(`Installment Amount: ${data.installment_amount}`);
    console.log(`Interest Rate: ${data.interest_rate}%`);
    console.log(`Total Interest: ${data.total_interest}`);
    console.log(`Total Amount with Interest: ${data.total_amount_with_interest}`);
    console.log(`Status: ${data.status}`);
    console.log(`Smart Contract Agreement ID: ${data.smart_contract_agreement_id || 'Not set'}`);
    console.log(`Created At: ${new Date(data.created_at).toISOString()}`);
    console.log(`Expires At: ${new Date(data.expires_at).toISOString()}`);
    
    if (data.accepted_at) {
      console.log(`Accepted At: ${new Date(data.accepted_at).toISOString()}`);
    }
    
    if (data.rejected_at) {
      console.log(`Rejected At: ${new Date(data.rejected_at).toISOString()}`);
      console.log(`Rejection Reason: ${data.rejection_reason || 'No reason provided'}`);
    }

    return data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Get payment ID from command line argument
const paymentId = process.argv[2];

if (!paymentId) {
  console.error('Please provide a payment ID as an argument');
  console.log('Usage: node query-bnpl.js <payment_id>');
  process.exit(1);
}

queryBNPLTerms(paymentId).then((data) => {
  if (data) {
    console.log('\n=== CURL COMMANDS ===');
    console.log('\n1. Get BNPL Terms:');
    console.log(`curl -X GET "http://localhost:3000/bnpl/terms/${data.payment_id}/${data.buyer_account_id}"`);
    
    if (data.status === 'PENDING') {
      console.log('\n2. Accept Terms (if not already accepted):');
      console.log(`curl -X POST "http://localhost:3000/bnpl/terms/${data.id}/accept" \\`);
      console.log(`  -H "Content-Type: application/json" \\`);
      console.log(`  -d '{"accountId": "${data.buyer_account_id}"}'`);
    }
    
    if (data.status === 'ACCEPTED' && data.smart_contract_agreement_id) {
      console.log('\n3. Process Installment Payment (Burn & Mint):');
      console.log(`curl -X POST "http://localhost:3000/bnpl/installment/pay" \\`);
      console.log(`  -H "Content-Type: application/json" \\`);
      console.log(`  -d '{`);
      console.log(`    "agreementId": "${data.smart_contract_agreement_id}",`);
      console.log(`    "consumerAccountId": "${data.buyer_account_id}",`);
      console.log(`    "merchantAccountId": "${data.merchant_account_id}",`);
      console.log(`    "amount": ${data.installment_amount},`);
      console.log(`    "currency": "${data.currency}"`);
      console.log(`  }'`);
    }
  }
  process.exit(0);
});
