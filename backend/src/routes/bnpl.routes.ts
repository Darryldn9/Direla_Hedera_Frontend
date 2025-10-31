import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../database/connection';
import { BNPLService } from '../services/bnpl.service';
import { ApiResponse } from '../types/index';

const router = Router();
const bnplService = new BNPLService();

// Create BNPL terms
router.post('/terms', async (req: Request, res: Response) => {
  try {
    const {
      paymentId,
      buyerAccountId,
      merchantAccountId,
      totalAmount,
      currency,
      installmentCount,
      interestRate,
      expiresInMinutes = 30
    } = req.body;

    // Validate required fields
    if (!paymentId || !buyerAccountId || !merchantAccountId || !totalAmount || !currency) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: paymentId, buyerAccountId, merchantAccountId, totalAmount, currency'
      } as ApiResponse);
    }

    const terms = await bnplService.createTerms({
      paymentId,
      buyerAccountId,
      merchantAccountId,
      totalAmount: parseFloat(totalAmount),
      currency,
      installmentCount: installmentCount || 3,
      interestRate: interestRate || 5,
      expiresInMinutes
    });

    return res.json({
      success: true,
      data: terms,
      message: 'BNPL terms created successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error creating BNPL terms:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create BNPL terms'
    } as ApiResponse);
  }
});

// Get BNPL terms for a payment
router.get('/terms/:paymentId/:accountId', async (req: Request, res: Response) => {
  try {
    const { paymentId, accountId } = req.params;

    const terms = await bnplService.getTerms(paymentId!, accountId!);

    return res.json({
      success: true,
      data: terms,
      message: terms ? 'BNPL terms found' : 'No BNPL terms found'
    } as ApiResponse);
  } catch (error) {
    console.error('Error getting BNPL terms:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get BNPL terms'
    } as ApiResponse);
  }
});

// Accept BNPL terms
router.post('/terms/:termsId/accept', async (req: Request, res: Response) => {
  try {
    const { termsId } = req.params;
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID is required'
      } as ApiResponse);
    }

    const result = await bnplService.acceptTerms(termsId!, accountId!);

    return res.json({
      success: true,
      data: result,
      message: 'BNPL terms accepted successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error accepting BNPL terms:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to accept BNPL terms'
    } as ApiResponse);
  }
});

// Reject BNPL terms
router.post('/terms/:termsId/reject', async (req: Request, res: Response) => {
  try {
    const { termsId } = req.params;
    const { accountId, reason } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID is required'
      } as ApiResponse);
    }

    const result = await bnplService.rejectTerms(termsId!, accountId!, reason);

    return res.json({
      success: true,
      data: result,
      message: 'BNPL terms rejected successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error rejecting BNPL terms:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reject BNPL terms'
    } as ApiResponse);
  }
});

// Get pending BNPL terms for merchant
router.get('/merchant/:accountId/pending', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;

    const terms = await bnplService.getPendingTermsForMerchant(accountId!);

    return res.json({
      success: true,
      data: terms,
      message: 'Pending BNPL terms retrieved successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error getting pending BNPL terms:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get pending BNPL terms'
    } as ApiResponse);
  }
});

// Get all BNPL terms for merchant (history)
router.get('/merchant/:accountId', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;

    const terms = await bnplService.getTermsForMerchant(accountId!);

    return res.json({
      success: true,
      data: terms,
      message: 'BNPL terms for merchant retrieved successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error getting BNPL terms for merchant', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get BNPL terms for merchant'
    } as ApiResponse);
  }
});

// Get BNPL terms for buyer
router.get('/buyer/:accountId', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;

    const terms = await bnplService.getTermsForBuyer(accountId!);

    return res.json({
      success: true,
      data: terms,
      message: 'BNPL terms for buyer retrieved successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error getting BNPL terms for buyer:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get BNPL terms for buyer'
    } as ApiResponse);
  }
});

// Generate currency quote for BNPL terms
router.post('/quote', async (req: Request, res: Response) => {
  try {
    const {
      buyerAccountId,
      merchantAccountId,
      amount,
      buyerCurrency,
      merchantCurrency
    } = req.body;

    // Validate required fields
    if (!buyerAccountId || !merchantAccountId || !amount || !buyerCurrency || !merchantCurrency) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: buyerAccountId, merchantAccountId, amount, buyerCurrency, merchantCurrency'
      } as ApiResponse);
    }

    const quote = await bnplService.generateBNPLQuote(
      buyerAccountId,
      merchantAccountId,
      parseFloat(amount),
      buyerCurrency,
      merchantCurrency
    );

    return res.json({
      success: true,
      data: quote,
      message: 'BNPL currency quote generated successfully'
    } as ApiResponse);
    
  } catch (error) {
    console.error('Error generating BNPL currency quote:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate BNPL currency quote'
    } as ApiResponse);
  }
});

// Convert BNPL terms to buyer's currency
router.post('/terms/:termsId/convert', async (req: Request, res: Response) => {
  try {
    const { termsId } = req.params;
    const { buyerCurrency } = req.body;

    if (!buyerCurrency) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: buyerCurrency'
      } as ApiResponse);
    }

    // Get the terms first
    const terms = await bnplService.getTermsById(termsId!);
    if (!terms) {
      return res.status(404).json({
        success: false,
        error: 'BNPL terms not found'
      } as ApiResponse);
    }

    const convertedTerms = await bnplService.convertTermsToBuyerCurrency(terms, buyerCurrency);

    return res.json({
      success: true,
      data: convertedTerms,
      message: 'BNPL terms converted to buyer currency successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error converting BNPL terms to buyer currency:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to convert BNPL terms to buyer currency'
    } as ApiResponse);
  }
});

// Process BNPL installment payment (burn & mint)
router.post('/installment/pay', async (req: Request, res: Response) => {
  try {
    const {
      agreementId,
      consumerAccountId,
      merchantAccountId,
      amount
    } = req.body;

    // Validate required fields
    if (!agreementId || !consumerAccountId || !merchantAccountId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agreementId, consumerAccountId, merchantAccountId, amount'
      } as ApiResponse);
    }

    // Resolve currencies from accounts to ensure correct conversion:
    // - settlement currency = merchant account currency
    // - payer currency = consumer account currency
    const supabase = getSupabaseClient();
    const [{ data: consumerRow, error: consumerErr }, { data: merchantRow, error: merchantErr }] = await Promise.all([
      supabase
        .from('hedera_accounts')
        .select('currency')
        .eq('account_id', consumerAccountId)
        .single(),
      supabase
        .from('hedera_accounts')
        .select('currency')
        .eq('account_id', merchantAccountId)
        .single()
    ]);

    if (consumerErr || !consumerRow) {
      return res.status(400).json({
        success: false,
        error: `Consumer account not found or missing currency: ${consumerErr?.message || ''}`.trim()
      } as ApiResponse);
    }

    if (merchantErr || !merchantRow) {
      return res.status(400).json({
        success: false,
        error: `Merchant account not found or missing currency: ${merchantErr?.message || ''}`.trim()
      } as ApiResponse);
    }

    // Strictly derive currencies from account records to avoid client-side mistakes
    const settlementCurrency = String(merchantRow.currency || '').toUpperCase();
    const payerCurrencyResolved = String(consumerRow.currency || '').toUpperCase();

    if (!settlementCurrency) {
      return res.status(400).json({
        success: false,
        error: 'Unable to resolve settlement currency from merchant account'
      } as ApiResponse);
    }

    const result = await bnplService.processInstallmentPayment(
      agreementId,
      consumerAccountId,
      merchantAccountId,
      parseFloat(amount),
      settlementCurrency,
      payerCurrencyResolved || undefined
    );

    if (result.success) {
      return res.json({
        success: true,
        data: result,
        message: 'BNPL installment payment processed successfully'
      } as ApiResponse);
    } else {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to process installment payment'
      } as ApiResponse);
    }
  } catch (error) {
    console.error('Error processing BNPL installment payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process BNPL installment payment'
    } as ApiResponse);
  }
});

export default router;
