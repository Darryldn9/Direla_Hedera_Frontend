import { v4 as uuidv4 } from 'uuid';
import { BNPLTerms, CreateBNPLTermsRequest } from '../types';
import { getSupabaseClient } from '../database/connection';
import { NewBNPLTerms } from '../database/schema';
import { logger } from '../utils/logger';
import { CurrencyQuote, CurrencyConversionRequest } from '../types/index';
import { ExternalApiInfrastructure } from '../infrastructure/external-api';
import { BNPLContractInfrastructure } from '../infrastructure/bnpl-contract';
import { ethers } from 'ethers';

export class BNPLService {
  private supabase = getSupabaseClient();
  private externalApi = new ExternalApiInfrastructure('https://api.example.com', 'your-api-key');
  private bnplContract = new BNPLContractInfrastructure();

  async createTerms(request: CreateBNPLTermsRequest): Promise<BNPLTerms> {
    const termsId = uuidv4();
    const now = Date.now();
    const expiresAt = now + ((request.expiresInMinutes || 30) * 60 * 1000);
    
    // Calculate installment details
    const totalInterest = (request.totalAmount * request.interestRate) / 100;
    const totalAmountWithInterest = request.totalAmount + totalInterest;
    const installmentAmount = totalAmountWithInterest / request.installmentCount;

    const newTerms: NewBNPLTerms = {
      payment_id: request.paymentId,
      buyer_account_id: request.buyerAccountId,
      merchant_account_id: request.merchantAccountId,
      total_amount: request.totalAmount,
      currency: request.currency,
      installment_count: request.installmentCount,
      installment_amount: Math.round(installmentAmount * 100) / 100, // Round to 2 decimal places
      interest_rate: request.interestRate,
      total_interest: Math.round(totalInterest * 100) / 100,
      total_amount_with_interest: Math.round(totalAmountWithInterest * 100) / 100,
      status: 'PENDING',
      expires_at: expiresAt,
      created_at: now
    };

    try {
      const { data, error } = await this.supabase
        .from('bnpl_terms')
        .insert([{ id: termsId, ...newTerms }])
        .select()
        .single();

      if (error) {
        logger.error('Error creating BNPL terms in database', { error, termsId });
        throw new Error(`Failed to create BNPL terms: ${error.message}`);
      }

      // Convert database format to API format
      const terms: BNPLTerms = {
        id: data.id,
        paymentId: data.payment_id,
        buyerAccountId: data.buyer_account_id,
        merchantAccountId: data.merchant_account_id,
        totalAmount: data.total_amount,
        currency: data.currency,
        installmentCount: data.installment_count,
        installmentAmount: data.installment_amount,
        interestRate: data.interest_rate,
        totalInterest: data.total_interest,
        totalAmountWithInterest: data.total_amount_with_interest,
        status: data.status as BNPLTerms['status'],
        expiresAt: data.expires_at,
        createdAt: data.created_at,
        ...(data.accepted_at && { acceptedAt: data.accepted_at }),
        ...(data.rejected_at && { rejectedAt: data.rejected_at }),
        ...(data.smart_contract_agreement_id && { smartContractAgreementId: data.smart_contract_agreement_id })
      };

      // Set up expiration timer
      setTimeout(async () => {
        await this.expireTerms(termsId);
      }, (request.expiresInMinutes || 30) * 60 * 1000);

      return terms;
    } catch (error) {
      logger.error('Error creating BNPL terms', { error, request });
      throw error;
    }
  }

  async getTerms(paymentId: string, accountId: string): Promise<BNPLTerms | null> {
    try {
      const { data, error } = await this.supabase
        .from('bnpl_terms')
        .select('*')
        .eq('payment_id', paymentId)
        .or(`buyer_account_id.eq.${accountId},merchant_account_id.eq.${accountId}`)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null;
        }
        logger.error('Error getting BNPL terms from database', { error, paymentId, accountId });
        throw new Error(`Failed to get BNPL terms: ${error.message}`);
      }

      // Convert database format to API format
      return {
        id: data.id,
        paymentId: data.payment_id,
        buyerAccountId: data.buyer_account_id,
        merchantAccountId: data.merchant_account_id,
        totalAmount: data.total_amount,
        currency: data.currency,
        installmentCount: data.installment_count,
        installmentAmount: data.installment_amount,
        interestRate: data.interest_rate,
        totalInterest: data.total_interest,
        totalAmountWithInterest: data.total_amount_with_interest,
        status: data.status as BNPLTerms['status'],
        expiresAt: data.expires_at,
        createdAt: data.created_at,
        ...(data.accepted_at && { acceptedAt: data.accepted_at }),
        ...(data.rejected_at && { rejectedAt: data.rejected_at }),
        ...(data.smart_contract_agreement_id && { smartContractAgreementId: data.smart_contract_agreement_id })
      };
    } catch (error) {
      logger.error('Error getting BNPL terms', { error, paymentId, accountId });
      throw error;
    }
  }

  async acceptTerms(termsId: string, accountId: string): Promise<{ success: boolean; transactionId?: string }> {
    try {
      // First, get the current terms to validate
      const { data: currentTerms, error: fetchError } = await this.supabase
        .from('bnpl_terms')
        .select('*')
        .eq('id', termsId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('BNPL terms not found');
        }
        logger.error('Error fetching BNPL terms for acceptance', { error: fetchError, termsId });
        throw new Error(`Failed to fetch BNPL terms: ${fetchError.message}`);
      }

      if (currentTerms.status !== 'PENDING') {
        throw new Error('BNPL terms are no longer pending');
      }

      if (currentTerms.expires_at < Date.now()) {
        // Update status to expired
        await this.supabase
          .from('bnpl_terms')
          .update({ status: 'EXPIRED' })
          .eq('id', termsId);
        throw new Error('BNPL terms have expired');
      }

      // Verify the account ID is either buyer or merchant
      if (currentTerms.buyer_account_id !== accountId && currentTerms.merchant_account_id !== accountId) {
        throw new Error('Account not authorized to accept these terms');
      }

      // Update the terms to accepted status
      const now = Date.now();
      const { error: updateError } = await this.supabase
        .from('bnpl_terms')
        .update({ 
          status: 'ACCEPTED',
          accepted_at: now
        })
        .eq('id', termsId);

      if (updateError) {
        logger.error('Error updating BNPL terms to accepted', { error: updateError, termsId });
        throw new Error(`Failed to accept BNPL terms: ${updateError.message}`);
      }

      // Execute smart contract to create BNPL agreement
      try {
        // Convert Hedera account IDs to EVM addresses
        const consumerEVMAddress = BNPLContractInfrastructure.convertHederaAccountToEVMAddress(currentTerms.buyer_account_id);
        const merchantEVMAddress = BNPLContractInfrastructure.convertHederaAccountToEVMAddress(currentTerms.merchant_account_id);
        
        // Convert principal amount to wei (assuming HBAR, 1 HBAR = 10^8 tinybars = 10^18 wei)
        const principalAmountWei = ethers.utils.parseEther(currentTerms.total_amount.toString());
        
        // Convert interest rate from percentage to basis points (e.g., 5% = 500 basis points)
        const interestRateBasisPoints = Math.round(currentTerms.interest_rate * 100);
        
        logger.info('Creating BNPL agreement on smart contract', {
          termsId,
          consumerEVMAddress,
          merchantEVMAddress,
          principalAmount: currentTerms.total_amount,
          principalAmountWei: principalAmountWei.toString(),
          interestRate: currentTerms.interest_rate,
          interestRateBasisPoints,
          numInstallments: currentTerms.installment_count
        });

        // Create BNPL agreement on smart contract
        const contractResult = await this.bnplContract.createBNPLAgreement(
          consumerEVMAddress,
          merchantEVMAddress,
          principalAmountWei.toString(),
          interestRateBasisPoints,
          currentTerms.installment_count,
          process.env.HEDERA_PRIVATE_KEY || ''
        );

        if (!contractResult.success) {
          logger.error('Failed to create BNPL agreement on smart contract', {
            termsId,
            error: contractResult.error
          });
          
          // Revert the database update
          await this.supabase
            .from('bnpl_terms')
            .update({ 
              status: 'PENDING',
              accepted_at: null
            })
            .eq('id', termsId);
          
          throw new Error(`Smart contract execution failed: ${contractResult.error}`);
        }

        logger.info('BNPL agreement created successfully on smart contract', {
          termsId,
          contractAgreementId: contractResult.agreementId,
          transactionId: contractResult.transactionId
        });

        // Update the terms with the smart contract agreement ID
        await this.supabase
          .from('bnpl_terms')
          .update({ 
            smart_contract_agreement_id: contractResult.agreementId || null
          })
          .eq('id', termsId);

        return {
          success: true,
          transactionId: contractResult.transactionId || ''
        };
      } catch (error) {
        logger.error('Error executing smart contract for BNPL terms', {
          termsId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        // Revert the database update
        await this.supabase
          .from('bnpl_terms')
          .update({ 
            status: 'PENDING',
            accepted_at: null
          })
          .eq('id', termsId);
        
        throw error;
      }
    } catch (error) {
      logger.error('Error accepting BNPL terms', { error, termsId, accountId });
      throw error;
    }
  }

  async rejectTerms(termsId: string, accountId: string, reason?: string): Promise<{ success: boolean }> {
    try {
      // First, get the current terms to validate
      const { data: currentTerms, error: fetchError } = await this.supabase
        .from('bnpl_terms')
        .select('*')
        .eq('id', termsId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('BNPL terms not found');
        }
        logger.error('Error fetching BNPL terms for rejection', { error: fetchError, termsId });
        throw new Error(`Failed to fetch BNPL terms: ${fetchError.message}`);
      }

      if (currentTerms.status !== 'PENDING') {
        throw new Error('BNPL terms are no longer pending');
      }

      // Verify the account ID is either buyer or merchant
      if (currentTerms.buyer_account_id !== accountId && currentTerms.merchant_account_id !== accountId) {
        throw new Error('Account not authorized to reject these terms');
      }

      // Update the terms to rejected status
      const now = Date.now();
      const { error: updateError } = await this.supabase
        .from('bnpl_terms')
        .update({ 
          status: 'REJECTED',
          rejected_at: now,
          rejection_reason: reason || null
        })
        .eq('id', termsId);

      if (updateError) {
        logger.error('Error updating BNPL terms to rejected', { error: updateError, termsId });
        throw new Error(`Failed to reject BNPL terms: ${updateError.message}`);
      }

      return { success: true };
    } catch (error) {
      logger.error('Error rejecting BNPL terms', { error, termsId, accountId });
      throw error;
    }
  }

  async getPendingTermsForMerchant(merchantAccountId: string): Promise<BNPLTerms[]> {
    try {
      const { data, error } = await this.supabase
        .from('bnpl_terms')
        .select('*')
        .eq('merchant_account_id', merchantAccountId)
        .eq('status', 'PENDING')
        .gt('expires_at', Date.now())
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error getting pending BNPL terms for merchant', { error, merchantAccountId });
        throw new Error(`Failed to get pending BNPL terms: ${error.message}`);
      }

      // Convert database format to API format
      return data.map(terms => ({
        id: terms.id,
        paymentId: terms.payment_id,
        buyerAccountId: terms.buyer_account_id,
        merchantAccountId: terms.merchant_account_id,
        totalAmount: terms.total_amount,
        currency: terms.currency,
        installmentCount: terms.installment_count,
        installmentAmount: terms.installment_amount,
        interestRate: terms.interest_rate,
        totalInterest: terms.total_interest,
        totalAmountWithInterest: terms.total_amount_with_interest,
        status: terms.status as BNPLTerms['status'],
        expiresAt: terms.expires_at,
        createdAt: terms.created_at,
        ...(terms.accepted_at && { acceptedAt: terms.accepted_at }),
        ...(terms.rejected_at && { rejectedAt: terms.rejected_at })
      }));
    } catch (error) {
      logger.error('Error getting pending BNPL terms for merchant', { error, merchantAccountId });
      throw error;
    }
  }

  async getTermsForBuyer(buyerAccountId: string): Promise<BNPLTerms[]> {
    try {
      const { data, error } = await this.supabase
        .from('bnpl_terms')
        .select('*')
        .eq('buyer_account_id', buyerAccountId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error getting BNPL terms for buyer', { error, buyerAccountId });
        throw new Error(`Failed to get BNPL terms for buyer: ${error.message}`);
      }

      // Convert database format to API format
      return data.map(terms => ({
        id: terms.id,
        paymentId: terms.payment_id,
        buyerAccountId: terms.buyer_account_id,
        merchantAccountId: terms.merchant_account_id,
        totalAmount: terms.total_amount,
        currency: terms.currency,
        installmentCount: terms.installment_count,
        installmentAmount: terms.installment_amount,
        interestRate: terms.interest_rate,
        totalInterest: terms.total_interest,
        totalAmountWithInterest: terms.total_amount_with_interest,
        status: terms.status as BNPLTerms['status'],
        expiresAt: terms.expires_at,
        createdAt: terms.created_at,
        ...(terms.accepted_at && { acceptedAt: terms.accepted_at }),
        ...(terms.rejected_at && { rejectedAt: terms.rejected_at })
      }));
    } catch (error) {
      logger.error('Error getting BNPL terms for buyer', { error, buyerAccountId });
      throw error;
    }
  }

  async getTermsById(termsId: string): Promise<BNPLTerms | null> {
    try {
      const { data, error } = await this.supabase
        .from('bnpl_terms')
        .select('*')
        .eq('id', termsId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error('Error getting BNPL terms by ID', { error, termsId });
        throw new Error(`Failed to get BNPL terms: ${error.message}`);
      }

      // Convert database format to API format
      return {
        id: data.id,
        paymentId: data.payment_id,
        buyerAccountId: data.buyer_account_id,
        merchantAccountId: data.merchant_account_id,
        totalAmount: data.total_amount,
        currency: data.currency,
        installmentCount: data.installment_count,
        installmentAmount: data.installment_amount,
        interestRate: data.interest_rate,
        totalInterest: data.total_interest,
        totalAmountWithInterest: data.total_amount_with_interest,
        status: data.status as BNPLTerms['status'],
        expiresAt: data.expires_at,
        createdAt: data.created_at,
        ...(data.accepted_at && { acceptedAt: data.accepted_at }),
        ...(data.rejected_at && { rejectedAt: data.rejected_at }),
        ...(data.smart_contract_agreement_id && { smartContractAgreementId: data.smart_contract_agreement_id })
      };
    } catch (error) {
      logger.error('Error getting BNPL terms by ID', { error, termsId });
      throw error;
    }
  }

  // Helper method to expire terms
  private async expireTerms(termsId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('bnpl_terms')
        .update({ status: 'EXPIRED' })
        .eq('id', termsId)
        .eq('status', 'PENDING');

      if (error) {
        logger.error('Error expiring BNPL terms', { error, termsId });
      }
    } catch (error) {
      logger.error('Error expiring BNPL terms', { error, termsId });
    }
  }

  // Clean up expired terms (call this periodically)
  async cleanupExpiredTerms(): Promise<void> {
    try {
      const now = Date.now();
      const { error } = await this.supabase
        .from('bnpl_terms')
        .update({ status: 'EXPIRED' })
        .eq('status', 'PENDING')
        .lt('expires_at', now);

      if (error) {
        logger.error('Error cleaning up expired BNPL terms', { error });
      } else {
        logger.info('Cleaned up expired BNPL terms');
      }
    } catch (error) {
      logger.error('Error cleaning up expired BNPL terms', { error });
    }
  }

  // Generate currency quote for BNPL terms
  async generateBNPLQuote(
    buyerAccountId: string,
    merchantAccountId: string,
    amount: number,
    buyerCurrency: string,
    merchantCurrency: string
  ): Promise<CurrencyQuote> {
    try {
      logger.info('Generating BNPL currency quote', {
        buyerAccountId,
        merchantAccountId,
        amount,
        buyerCurrency,
        merchantCurrency
      });

      const conversionRequest: CurrencyConversionRequest = {
        fromCurrency: merchantCurrency,
        toCurrency: buyerCurrency,
        amount: amount
      };

      const quote = await this.externalApi.generateCurrencyQuote(conversionRequest);

      logger.info('BNPL currency quote generated successfully', {
        quoteId: quote.quoteId,
        fromCurrency: quote.fromCurrency,
        toCurrency: quote.toCurrency,
        fromAmount: quote.fromAmount,
        toAmount: quote.toAmount,
        exchangeRate: quote.exchangeRate
      });

      return quote;
    } catch (error) {
      logger.error('Failed to generate BNPL currency quote', {
        buyerAccountId,
        merchantAccountId,
        amount,
        buyerCurrency,
        merchantCurrency,
        error
      });
      throw error;
    }
  }

  // Convert BNPL terms to buyer's currency for display
  async convertTermsToBuyerCurrency(
    terms: BNPLTerms,
    buyerCurrency: string
  ): Promise<{
    originalTerms: BNPLTerms;
    convertedTerms: {
      totalAmount: number;
      installmentAmount: number;
      totalInterest: number;
      totalAmountWithInterest: number;
      currency: string;
      exchangeRate: number;
    };
  }> {
    try {
      // If currencies are the same, return original terms
      if (terms.currency === buyerCurrency) {
        return {
          originalTerms: terms,
          convertedTerms: {
            totalAmount: terms.totalAmount,
            installmentAmount: terms.installmentAmount,
            totalInterest: terms.totalInterest,
            totalAmountWithInterest: terms.totalAmountWithInterest,
            currency: terms.currency,
            exchangeRate: 1.0
          }
        };
      }

      // Generate quote for conversion
      const quote = await this.generateBNPLQuote(
        terms.buyerAccountId,
        terms.merchantAccountId,
        terms.totalAmount,
        buyerCurrency,
        terms.currency
      );

      // Convert all amounts using the exchange rate
      const convertedTerms = {
        totalAmount: quote.toAmount,
        installmentAmount: quote.toAmount / terms.installmentCount,
        totalInterest: (quote.toAmount * terms.interestRate) / 100,
        totalAmountWithInterest: quote.toAmount + ((quote.toAmount * terms.interestRate) / 100),
        currency: buyerCurrency,
        exchangeRate: quote.exchangeRate
      };

      logger.info('BNPL terms converted to buyer currency', {
        termsId: terms.id,
        originalCurrency: terms.currency,
        buyerCurrency,
        exchangeRate: quote.exchangeRate,
        originalTotalAmount: terms.totalAmount,
        convertedTotalAmount: convertedTerms.totalAmount
      });

      return {
        originalTerms: terms,
        convertedTerms
      };
    } catch (error) {
      logger.error('Failed to convert BNPL terms to buyer currency', {
        termsId: terms.id,
        buyerCurrency,
        error
      });
      throw error;
    }
  }
}
