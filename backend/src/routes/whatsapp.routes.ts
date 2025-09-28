import { Router, Request, Response } from 'express';
import twilio from 'twilio';
import { getSupabaseClient } from '../database/connection';
import { HederaInfrastructure } from '../infrastructure/hedera';
import { config } from '../config/index';

const router = Router();

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID || '',
  process.env.TWILIO_AUTH_TOKEN || ''
);

// WhatsApp webhook endpoint
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { From, Body } = req.body;
    const phoneNumber = From.replace('whatsapp:', '');
    const message = Body.toLowerCase().trim();
    
    let response = '';

    // Check if phone number is already linked to an account
    const linkedAccount = await getAccountByPhoneNumber(phoneNumber);

    if (!linkedAccount && !message.startsWith('/link')) {
      response = "Welcome to Hedera Payments!\n\nTo use WhatsApp payments, link your Hedera account:\n\n/link 0.0.123456\n\nUse your actual Hedera account ID.";
    } else if (message.startsWith('/link')) {
      response = await handleAccountLink(phoneNumber, Body);
    } else if (message.startsWith('/balance')) {
      response = await handleBalance(phoneNumber);
    } else if (message.startsWith('/pay')) {
      response = await handlePayment(phoneNumber, Body);
    } else if (message.startsWith('/unlink')) {
      response = await handleUnlink(phoneNumber);
    } else {
      response = "Commands:\n/balance - Check account balance\n/pay [account] [amount] - Send payment\n/unlink - Disconnect WhatsApp\n\nExample: /pay 0.0.789012 10.5";
    }

    // Send response back to WhatsApp
    if (response) {
      await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
        to: From,
        body: response
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function getAccountByPhoneNumber(phoneNumber: string): Promise<any> {
  try {
    const supabase = getSupabaseClient();
    const { data: account } = await supabase
      .from('hedera_accounts')
      .select('*')
      .eq('whatsapp_phone', phoneNumber)
      .single();

    return account;
  } catch {
    return null;
  }
}

async function handleAccountLink(phoneNumber: string, fullMessage: string): Promise<string> {
  const parts = fullMessage.split(' ');
  if (parts.length < 2) {
    return "Format: /link 0.0.123456\n\nUse your Hedera account ID.";
  }

  const accountId = parts[1] || '';

  // Validate account ID format
  if (!/^0\.0\.\d+$/.test(accountId)) {
    return "Invalid account ID format. Use format: 0.0.123456";
  }

  try {
    const supabase = getSupabaseClient();
    
    // Check if phone number already linked to another account
    const existingLink = await getAccountByPhoneNumber(phoneNumber);
    if (existingLink) {
      return `This WhatsApp number is already linked to account ${existingLink.account_id}.\n\nUse /unlink first to change accounts.`;
    }

    // Check if the account exists and is active
    const { data: account } = await supabase
      .from('hedera_accounts')
      .select('*')
      .eq('account_id', accountId)
      .eq('is_active', true)
      .single();

    if (!account) {
      return "Account not found or inactive. Please check your account ID.";
    }

    // Check if account is already linked to another WhatsApp number
    if (account.whatsapp_phone) {
      return `This account is already linked to another WhatsApp number.\n\nOne WhatsApp number per account.`;
    }

    // Link WhatsApp number to the Hedera account
    await supabase
      .from('hedera_accounts')
      .update({ whatsapp_phone: phoneNumber })
      .eq('account_id', accountId);

    const alias = account.alias ? ` (${account.alias})` : '';
    return `✅ WhatsApp linked successfully!\n\nAccount: ${accountId}${alias}\n\nYou can now use /balance and /pay commands.`;

  } catch (error) {
    console.error('Account linking error:', error);
    return "Account linking failed. Please try again.";
  }
}

async function handleUnlink(phoneNumber: string): Promise<string> {
  try {
    const account = await getAccountByPhoneNumber(phoneNumber);
    if (!account) {
      return "No account linked to this WhatsApp number.";
    }

    const supabase = getSupabaseClient();
    await supabase
      .from('hedera_accounts')
      .update({ whatsapp_phone: null })
      .eq('whatsapp_phone', phoneNumber);

    return `✅ WhatsApp disconnected from account ${account.account_id}.\n\nTo use payments again, send /link with your account ID.`;
  } catch {
    return "Unlink failed. Please try again.";
  }
}

async function handleBalance(phoneNumber: string): Promise<string> {
  const account = await getAccountByPhoneNumber(phoneNumber);
  if (!account) {
    return "Link your account first: /link 0.0.123456";
  }

  try {
    const hederaInfra = new HederaInfrastructure(config.hedera);
    const balanceData = await hederaInfra.getAccountBalance(account.account_id);
    const hbarBalance = balanceData.find(b => b.code === 'HBAR')?.amount || 0;

    // Update database balance to keep it in sync
    try {
      const supabase = getSupabaseClient();
      await supabase
        .from('hedera_accounts')
        .update({ balance: hbarBalance })
        .eq('account_id', account.account_id);

      console.log(`Updated database balance for ${account.account_id}: ${hbarBalance} HBAR`);
    } catch (balanceUpdateError) {
      console.error('Failed to update database balance during balance check:', balanceUpdateError);
      // Don't fail the balance response if database update fails
    }

    const alias = account.alias ? ` (${account.alias})` : '';
    return `💰 Account Balance\n\n${account.account_id}${alias}\nBalance: ${hbarBalance} HBAR`;

  } catch (error) {
    console.error('Balance check error:', error);
    return "Failed to get balance. Please try again.";
  }
}

async function handlePayment(phoneNumber: string, fullMessage: string): Promise<string> {
  const account = await getAccountByPhoneNumber(phoneNumber);
  if (!account) {
    return "Link your account first: /link 0.0.123456";
  }

  const parts = fullMessage.split(' ');
  if (parts.length < 3) {
    return "Format: /pay 0.0.789012 10.5 [memo]\n\nRecipient account ID, then amount.";
  }

  const toAccountId = parts[1] || '';
  const amount = parseFloat(parts[2] || '0');
  const memo = parts.slice(3).join(' ') || 'WhatsApp Payment';

  // Validate recipient account ID
  if (!/^0\.0\.\d+$/.test(toAccountId)) {
    return "Invalid recipient account ID format. Use: 0.0.123456";
  }

  // Validate amount
  if (isNaN(amount) || amount <= 0) {
    return "Invalid amount. Please enter a positive number.";
  }

  if (amount > 100) {
    return "Maximum 100 HBAR per WhatsApp payment for security.";
  }

  // Check if sending to same account
  if (account.account_id === toAccountId) {
    return "Cannot send payment to the same account.";
  }

  try {
    const hederaInfra = new HederaInfrastructure(config.hedera);
    
    // Check balance before attempting payment
    const balanceData = await hederaInfra.getAccountBalance(account.account_id);
    const currentBalance = balanceData.find(b => b.code === 'HBAR')?.amount || 0;
    if (currentBalance < amount) {
      return `Insufficient balance.\n\nAvailable: ${currentBalance} HBAR\nRequired: ${amount} HBAR`;
    }

    // Execute the payment
    const result = await hederaInfra.transferHbar(
      account.account_id || '',
      toAccountId,
      amount
    );

    if (result.status === 'SUCCESS') {
      // Update database balances after successful payment
      try {
        const supabase = getSupabaseClient();

        // Update sender's balance
        const senderBalanceData = await hederaInfra.getAccountBalance(account.account_id);
        const senderNewBalance = senderBalanceData.find(b => b.code === 'HBAR')?.amount || 0;
        await supabase
          .from('hedera_accounts')
          .update({ balance: senderNewBalance })
          .eq('account_id', account.account_id);

        console.log(`Updated sender balance for ${account.account_id}: ${senderNewBalance} HBAR`);

        // Update receiver's balance if they have an account in our database
        try {
          const receiverBalanceData = await hederaInfra.getAccountBalance(toAccountId);
          const receiverNewBalance = receiverBalanceData.find(b => b.code === 'HBAR')?.amount || 0;
          await supabase
            .from('hedera_accounts')
            .update({ balance: receiverNewBalance })
            .eq('account_id', toAccountId);

          console.log(`Updated receiver balance for ${toAccountId}: ${receiverNewBalance} HBAR`);
        } catch (receiverUpdateError) {
          // Receiver might not be in our database, that's okay
          console.log(`Receiver ${toAccountId} not found in database or balance update failed - this is normal`);
        }

      } catch (balanceUpdateError) {
        console.error('Failed to update database balance:', balanceUpdateError);
        // Don't fail the payment response if balance update fails
      }

      return `✅ Payment Sent!\n\nFrom: ${account.account_id}\nTo: ${toAccountId}\nAmount: ${amount} HBAR\nMemo: ${memo}\n\nTransaction ID: ${result.transactionId}`;
    } else {
      return `❌ Payment Failed\n\n${result.message || 'Unknown error occurred'}`;
    }

  } catch (error) {
    console.error('Payment error:', error);
    return "Payment failed. Please check the recipient account ID and try again.";
  }
}

export default router;