-- Run this query in your Supabase SQL editor to see all accounts in your database
SELECT
    account_id,
    alias,
    balance,
    whatsapp_phone,
    is_active,
    created_at
FROM hedera_accounts
ORDER BY created_at DESC;

-- Check if specific accounts exist (replace with your actual account IDs)
-- SELECT * FROM hedera_accounts WHERE account_id IN ('0.0.6435129', '0.0.RECEIVER_ACCOUNT_ID');