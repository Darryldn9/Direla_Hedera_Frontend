import { v4 as uuidv4 } from 'uuid';
import { BNPLTerms, CreateBNPLTermsRequest, BNPLTermsCreatedEvent, BNPLTermsAcceptedEvent, BNPLTermsRejectedEvent, HCSMessageResult } from '../types';
import { getSupabaseClient } from '../database/connection';
import { NewBNPLTerms } from '../database/schema';
import { logger } from '../utils/logger';
import { CurrencyQuote, CurrencyConversionRequest } from '../types/index';
import { ExternalApiInfrastructure } from '../infrastructure/external-api';
import { config } from '../config/index';
import { BNPLContractInfrastructure } from '../infrastructure/bnpl-contract';
import { HederaInfrastructure } from '../infrastructure/hedera';
import { ethers } from 'ethers';
import { NotificationsService } from './notifications.service';

export class BNPLService {
  private supabase = getSupabaseClient();
  private externalApi = new ExternalApiInfrastructure(
    config.externalApi.baseUrl,
    config.externalApi.apiKey
  );
  private bnplContract = new BNPLContractInfrastructure();
  private hederaInfra: HederaInfrastructure;
  private readonly PLATFORM_ISSUER = 'did:hedera:testnet:platform-0.0.9999';
  private notifications: NotificationsService;

  constructor() {
    // Initialize Hedera infrastructure for HCS logging
    this.hederaInfra = new HederaInfrastructure({
      accountId: process.env.HEDERA_ACCOUNT_ID || '',
      privateKey: process.env.HEDERA_PRIVATE_KEY || '',
      network: (process.env.HEDERA_NETWORK as 'testnet' | 'mainnet') || 'testnet',
      usdTokenId: process.env.USD_TOKEN_ID || '',
      usdSupplyKey: process.env.USD_SUPPLY_KEY || '',
      zarTokenId: process.env.ZAR_TOKEN_ID || '',
      zarSupplyKey: process.env.ZAR_SUPPLY_KEY || '',
      evmRpcUrl: process.env.HEDERA_EVM_RPC_URL || 'https://testnet.hashio.io/api',
      bnplContractAddress: process.env.BNPL_ADDRESS || ''
    });
    this.notifications = new NotificationsService();
  }

  /**
   * Get token ID for a given currency
   */
  private getTokenIdForCurrency(currency: string): string | null {
    switch (currency.toUpperCase()) {
      case 'USD':
        return process.env.USD_TOKEN_ID || null;
      case 'ZAR':
        return process.env.ZAR_TOKEN_ID || null;
      default:
        return null;
    }
  }

  /**
   * Publish BNPL event to HCS topic
   */
  private async publishToHCS(event: BNPLTermsCreatedEvent | BNPLTermsAcceptedEvent | BNPLTermsRejectedEvent): Promise<HCSMessageResult> {
    try {
      const topicId = process.env.HCS_TOPIC_ID || '0.0.6880055';
      const messageString = JSON.stringify(event);
      
      logger.debug('Publishing BNPL event to HCS', { 
        topicId,
        eventType: event.event,
        messageSize: messageString.length
      });

      const result = await this.hederaInfra.submitTopicMessage(topicId, messageString);
      
      if (result.status === 'SUCCESS') {
        const explorerLink = `https://hashscan.io/testnet/transaction/${result.transactionId}`;
        
        logger.info('BNPL event published to HCS successfully', { 
          topicId,
          transactionId: result.transactionId,
          explorerLink: explorerLink,
          eventType: event.event
        });

        return {
          success: true,
          transactionId: result.transactionId,
          explorerLink: explorerLink
        };
      } else {
        logger.error('BNPL event HCS publishing failed', { 
          topicId,
          status: result.status,
          eventType: event.event,
          error: result.message
        });

        return {
          success: false,
          error: result.message || `HCS message failed with status: ${result.status}`
        };
      }
    } catch (error) {
      logger.error('BNPL event HCS publishing error', { 
        eventType: event.event,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Debug method to check account ID formats in the database
   */
  async debugAccountIds(termsId?: string): Promise<void> {
    try {
      let query = this.supabase
        .from('bnpl_terms')
        .select('id, buyer_account_id, merchant_account_id, payment_id, status, created_at_timestamp');
      
      if (termsId) {
        query = query.eq('id', termsId);
      } else {
        query = query.order('created_at_timestamp', { ascending: false }).limit(5);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching BNPL terms for debugging', { error });
        return;
      }

      logger.info('BNPL Terms Account ID Debug', {
        termsCount: data?.length || 0,
        terms: data?.map(term => ({
          id: term.id,
          paymentId: term.payment_id,
          buyerAccountId: term.buyer_account_id,
          merchantAccountId: term.merchant_account_id,
          buyerIdLength: term.buyer_account_id?.length,
          merchantIdLength: term.merchant_account_id?.length,
          buyerIdFormat: term.buyer_account_id?.startsWith('0.') ? 'Hedera Account ID' : 
                         term.buyer_account_id?.startsWith('30') ? 'DER Public Key' : 'Unknown',
          merchantIdFormat: term.merchant_account_id?.startsWith('0.') ? 'Hedera Account ID' : 
                           term.merchant_account_id?.startsWith('30') ? 'DER Public Key' : 'Unknown',
          status: term.status
        }))
      });
    } catch (error) {
      logger.error('Error in debugAccountIds', { error });
    }
  }

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

      // Log BNPL terms creation to HCS
      try {
        const bnplEvent: BNPLTermsCreatedEvent = {
          event: 'bnpl_terms_created',
          terms_id: terms.id,
          payment_id: terms.paymentId,
          buyer_account_id: terms.buyerAccountId,
          merchant_account_id: terms.merchantAccountId,
          total_amount: terms.totalAmount,
          currency: terms.currency,
          installment_count: terms.installmentCount,
          interest_rate: terms.interestRate,
          status: terms.status,
          expires_at: terms.expiresAt,
          created_at: terms.createdAt,
          timestamp: new Date().toISOString(),
          platform_issuer: this.PLATFORM_ISSUER
        };

        const hcsResult = await this.publishToHCS(bnplEvent);
        
        if (hcsResult.success) {
          logger.info('BNPL terms creation logged to HCS', {
            termsId: terms.id,
            hcsTransactionId: hcsResult.transactionId,
            explorerLink: hcsResult.explorerLink
          });
        } else {
          logger.warn('Failed to log BNPL terms creation to HCS', {
            termsId: terms.id,
            error: hcsResult.error
          });
        }
      } catch (hcsError) {
        logger.error('Error logging BNPL terms creation to HCS', {
          termsId: terms.id,
          error: hcsError instanceof Error ? hcsError.message : 'Unknown error'
        });
        // Don't fail the whole operation if HCS logging fails
      }

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

  async acceptTerms(termsId: string, accountId: string): Promise<{ success: boolean; transactionId?: string; smartContractAgreementId?: string }> {
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

      // Debug: Log the raw database values
      logger.info('Raw BNPL terms data from database', {
        termsId,
        rawBuyerAccountId: currentTerms.buyer_account_id,
        rawMerchantAccountId: currentTerms.merchant_account_id,
        buyerAccountIdLength: currentTerms.buyer_account_id?.length,
        merchantAccountIdLength: currentTerms.merchant_account_id?.length,
        buyerAccountIdStartsWith30: currentTerms.buyer_account_id?.startsWith('30'),
        merchantAccountIdStartsWith30: currentTerms.merchant_account_id?.startsWith('30')
      });

      // Additional debug: Check all recent BNPL terms
      await this.debugAccountIds(termsId);

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
        // Debug: Log the account IDs before conversion
        logger.info('Account IDs from database before conversion', {
          termsId,
          buyerAccountId: currentTerms.buyer_account_id,
          merchantAccountId: currentTerms.merchant_account_id,
          buyerAccountIdType: typeof currentTerms.buyer_account_id,
          merchantAccountIdType: typeof currentTerms.merchant_account_id,
          buyerAccountIdLength: currentTerms.buyer_account_id?.length,
          merchantAccountIdLength: currentTerms.merchant_account_id?.length
        });

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

        // Get the private key from the database for the merchant account
        const { data: merchantAccount, error: accountError } = await this.supabase
          .from('hedera_accounts')
          .select('private_key')
          .eq('account_id', currentTerms.merchant_account_id)
          .single();

        if (accountError || !merchantAccount) {
          logger.error('Failed to fetch merchant account private key', {
            termsId,
            merchantAccountId: currentTerms.merchant_account_id,
            error: accountError
          });
          throw new Error(`Failed to fetch merchant account private key: ${accountError?.message || 'Account not found'}`);
        }

        logger.info('Using private key from database for smart contract', {
          termsId,
          merchantAccountId: currentTerms.merchant_account_id,
          hasPrivateKey: !!merchantAccount.private_key,
          privateKeyLength: merchantAccount.private_key?.length,
          privateKeyStartsWith0x: merchantAccount.private_key?.startsWith('0x'),
          privateKeyPreview: merchantAccount.private_key?.substring(0, 10) + '...'
        });

        // Ensure we have an ECDSA key for EVM signing. If the stored key is not 0x-hex (likely ED25519),
        // try fallback to configured HEDERA_EVM_PRIVATE_KEY (Secp256k1) for treasury/merchant signer.
        let evmSignerPrivateKey = merchantAccount.private_key as string;
        if (!/^0x[0-9a-fA-F]{64}$/.test(evmSignerPrivateKey || '')) {
          const fallbackKey = process.env.HEDERA_EVM_PRIVATE_KEY || '';
          if (!/^0x[0-9a-fA-F]{64}$/.test(fallbackKey)) {
            logger.error('Merchant key is not ECDSA and no valid HEDERA_EVM_PRIVATE_KEY fallback configured');
            throw new Error('Merchant account does not have an ECDSA (0x...) private key. Configure HEDERA_EVM_PRIVATE_KEY to sign EVM transactions.');
          }
          logger.warn('Using HEDERA_EVM_PRIVATE_KEY fallback for EVM contract interaction');
          evmSignerPrivateKey = fallbackKey;
        }

        // Get token ID for the currency
        const tokenId = this.getTokenIdForCurrency(currentTerms.currency);
        if (!tokenId) {
          throw new Error(`No token ID found for currency: ${currentTerms.currency}`);
        }

        // Create BNPL agreement on smart contract
        const contractResult = await this.bnplContract.createBNPLAgreement(
          consumerEVMAddress,
          merchantEVMAddress,
          principalAmountWei.toString(),
          interestRateBasisPoints,
          currentTerms.installment_count,
          tokenId,
          evmSignerPrivateKey
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

        // Update the terms with the smart contract agreement ID (prefer agreementId over transactionId)
        const storedAgreementId = contractResult.agreementId || contractResult.transactionId || null;
        await this.supabase
          .from('bnpl_terms')
          .update({ 
            smart_contract_agreement_id: storedAgreementId
          })
          .eq('id', termsId);

        // Immediately pay the first installment
        try {
          const firstInstallmentAmount = currentTerms.installment_amount ||
            Math.round((currentTerms.total_amount_with_interest / currentTerms.installment_count) * 100) / 100;

          logger.info('Paying first BNPL installment immediately after acceptance', {
            termsId,
            agreementIdentifier: contractResult.agreementId || contractResult.transactionId,
            firstInstallmentAmount,
            currency: currentTerms.currency
          });

          const payResult = await this.processInstallmentPayment(
            (contractResult.agreementId || contractResult.transactionId) as string,
            currentTerms.buyer_account_id,
            currentTerms.merchant_account_id,
            firstInstallmentAmount,
            currentTerms.currency
          );

          if (!payResult.success) {
            logger.warn('First installment payment after acceptance failed', {
              termsId,
              error: payResult.error
            });
          } else {
            logger.info('First installment payment after acceptance succeeded', {
              termsId,
              transactionId: payResult.transactionId
            });
          }
        } catch (firstPayError) {
          logger.error('Error paying first BNPL installment after acceptance', {
            termsId,
            error: firstPayError instanceof Error ? firstPayError.message : 'Unknown error'
          });
          // Do not fail acceptance on first-payment error
        }

        // Log BNPL terms acceptance to HCS
        try {
          const bnplEvent: BNPLTermsAcceptedEvent = {
            event: 'bnpl_terms_accepted',
            terms_id: termsId,
            payment_id: currentTerms.payment_id,
            buyer_account_id: currentTerms.buyer_account_id,
            merchant_account_id: currentTerms.merchant_account_id,
            ...(contractResult.agreementId && { smart_contract_agreement_id: contractResult.agreementId }),
            ...(contractResult.transactionId && { transaction_id: contractResult.transactionId }),
            accepted_at: now,
            timestamp: new Date().toISOString(),
            platform_issuer: this.PLATFORM_ISSUER
          };

          const hcsResult = await this.publishToHCS(bnplEvent);
          
          if (hcsResult.success) {
            logger.info('BNPL terms acceptance logged to HCS', {
              termsId,
              hcsTransactionId: hcsResult.transactionId,
              explorerLink: hcsResult.explorerLink
            });
          } else {
            logger.warn('Failed to log BNPL terms acceptance to HCS', {
              termsId,
              error: hcsResult.error
            });
          }
        } catch (hcsError) {
          logger.error('Error logging BNPL terms acceptance to HCS', {
            termsId,
            error: hcsError instanceof Error ? hcsError.message : 'Unknown error'
          });
          // Don't fail the whole operation if HCS logging fails
        }

        const agreementId = contractResult.agreementId || contractResult.transactionId;
        return {
          success: true,
          transactionId: contractResult.transactionId || '',
          ...(agreementId && { smartContractAgreementId: agreementId })
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

      // Log BNPL terms rejection to HCS
      try {
        const bnplEvent: BNPLTermsRejectedEvent = {
          event: 'bnpl_terms_rejected',
          terms_id: termsId,
          payment_id: currentTerms.payment_id,
          buyer_account_id: currentTerms.buyer_account_id,
          merchant_account_id: currentTerms.merchant_account_id,
          ...(reason && { rejection_reason: reason }),
          rejected_at: now,
          timestamp: new Date().toISOString(),
          platform_issuer: this.PLATFORM_ISSUER
        };

        const hcsResult = await this.publishToHCS(bnplEvent);
        
        if (hcsResult.success) {
          logger.info('BNPL terms rejection logged to HCS', {
            termsId,
            hcsTransactionId: hcsResult.transactionId,
            explorerLink: hcsResult.explorerLink
          });
        } else {
          logger.warn('Failed to log BNPL terms rejection to HCS', {
            termsId,
            error: hcsResult.error
          });
        }
      } catch (hcsError) {
        logger.error('Error logging BNPL terms rejection to HCS', {
          termsId,
          error: hcsError instanceof Error ? hcsError.message : 'Unknown error'
        });
        // Don't fail the whole operation if HCS logging fails
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
        ...(terms.rejected_at && { rejectedAt: terms.rejected_at }),
        ...(terms.smart_contract_agreement_id && { smartContractAgreementId: terms.smart_contract_agreement_id })
      }));
    } catch (error) {
      logger.error('Error getting pending BNPL terms for merchant', { error, merchantAccountId });
      throw error;
    }
  }

  async getTermsForMerchant(merchantAccountId: string): Promise<BNPLTerms[]> {
    try {
      const { data, error } = await this.supabase
        .from('bnpl_terms')
        .select('*')
        .eq('merchant_account_id', merchantAccountId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error getting BNPL terms for merchant', { error, merchantAccountId });
        throw new Error(`Failed to get BNPL terms for merchant: ${error.message}`);
      }

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
        ...(terms.rejected_at && { rejectedAt: terms.rejected_at }),
        ...(terms.smart_contract_agreement_id && { smartContractAgreementId: terms.smart_contract_agreement_id })
      }));
    } catch (error) {
      logger.error('Error getting BNPL terms for merchant', { error, merchantAccountId });
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
        ...(terms.rejected_at && { rejectedAt: terms.rejected_at }),
        ...(terms.smart_contract_agreement_id && { smartContractAgreementId: terms.smart_contract_agreement_id })
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

  /**
   * Process BNPL installment payment with burn/mint operations
   */
  async processInstallmentPayment(
    agreementIdOrTxHash: string,
    consumerAccountId: string,
    merchantAccountId: string,
    amount: number,
    currency: string,
    payerCurrency?: string
  ): Promise<{ success: boolean; transactionId?: string | undefined; error?: string }> {
    try {
      logger.info('Processing BNPL installment payment with burn/mint', {
        agreementIdOrTxHash,
        consumerAccountId,
        merchantAccountId,
        amount,
        currency
      });

      // Resolve token IDs for payer and settlement currencies
      // currency = terms/settlement currency (e.g., USD)

      // Get consumer and merchant account details
      const { data: consumerAccount, error: consumerError } = await this.supabase
        .from('hedera_accounts')
        .select('*')
        .eq('account_id', consumerAccountId)
        .single();

      if (consumerError || !consumerAccount) {
        throw new Error(`Consumer account not found: ${consumerAccountId}`);
      }

      const { data: merchantAccount, error: merchantError } = await this.supabase
        .from('hedera_accounts')
        .select('*')
        .eq('account_id', merchantAccountId)
        .single();

      if (merchantError || !merchantAccount) {
        throw new Error(`Merchant account not found: ${merchantAccountId}`);
      }

      // Resolve numeric agreementId if input is a tx hash (do this early for logging)
      let agreementId: string = agreementIdOrTxHash;
      if (/^0x[0-9a-fA-F]{64}$/.test(agreementIdOrTxHash)) {
        const resolved = await this.bnplContract.getAgreementIdFromTxHash(agreementIdOrTxHash);
        if (resolved) {
          agreementId = resolved;
        }
      }

      // Determine currencies
      const consumerCurrency = (payerCurrency || consumerAccount.currency || '').toUpperCase() || currency.toUpperCase();
      const settlementCurrency = currency.toUpperCase();

      // Token IDs for burn (payer) and mint (settlement)
      const burnTokenId = this.getTokenIdForCurrency(consumerCurrency);
      const mintTokenId = this.getTokenIdForCurrency(settlementCurrency);

      if (!mintTokenId) {
        throw new Error(`No token ID found for settlement currency: ${settlementCurrency}`);
      }

      // Prepare treasury account (platform account)
      const treasuryAccountId = process.env.HEDERA_ACCOUNT_ID;
      const treasuryPrivateKey = process.env.HEDERA_PRIVATE_KEY;
      
      if (!treasuryAccountId || !treasuryPrivateKey) {
        throw new Error('Treasury account not configured');
      }

      // Convert requested amount (in settlement currency) to payer currency if needed
      let burnAmount = amount; // numeric amount in payer currency
      if (consumerCurrency !== settlementCurrency) {
        logger.info('Currencies differ; generating quote to charge payer in their currency', {
          agreementId,
          fromCurrency: settlementCurrency,
          toCurrency: consumerCurrency,
          amount
        });

        const quote = await this.externalApi.generateCurrencyQuote({
          fromCurrency: settlementCurrency,
          toCurrency: consumerCurrency,
          amount
        });

        // Use quoted toAmount as the payer charge in their currency
        burnAmount = quote.toAmount * quote.exchangeRate;

        logger.info('Currency quote resolved for payer charge', {
          agreementId,
          exchangeRate: quote.exchangeRate,
          payerCurrency: consumerCurrency,
          burnAmount
        });
      }

      // Convert amounts to base units (2 decimals)
      const mintAmountInBaseUnits = Math.round(amount * 100); // settlement currency amount
      const burnAmountInBaseUnits = Math.round(burnAmount * 100); // payer currency amount

      // Ensure token association for consumer before burn
      try {
        logger.info('Ensuring consumer is associated to burn token', {
          accountId: consumerAccountId,
          tokenId: burnTokenId
        });
        await this.hederaInfra.associateToken(
          consumerAccountId,
          burnTokenId!,
          consumerAccount.private_key
        );
      } catch (assocErr) {
        logger.warn('Consumer token association attempt finished (ignoring if already associated)', {
          accountId: consumerAccountId,
          tokenId: burnTokenId,
          error: assocErr instanceof Error ? assocErr.message : 'Unknown error'
        });
      }

      // Burn from consumer in payer currency (if tokenized; if HBAR, burnTokenId will be null and we should error)
      if (!burnTokenId) {
        throw new Error(`Payer currency ${consumerCurrency} is not tokenized for burn operation`);
      }

      logger.info('Burning tokens from consumer', {
        tokenId: burnTokenId,
        amount: burnAmountInBaseUnits,
        consumerAccountId
      });

      // Simple retry/backoff wrapper
      const retry = async <T>(fn: () => Promise<T>, attempts = 3, baseDelayMs = 500): Promise<T> => {
        let lastErr: any;
        for (let i = 0; i < attempts; i++) {
          try {
            return await fn();
          } catch (e) {
            lastErr = e;
            const delay = baseDelayMs * Math.pow(2, i);
            await new Promise(r => setTimeout(r, delay));
          }
        }
        throw lastErr;
      };

      const burnResult = await retry(() => this.hederaInfra.burnToken(
        burnTokenId!,
        burnAmountInBaseUnits,
        consumerAccountId,
        this.getSupplyKeyForCurrency(consumerCurrency),
        consumerAccount.private_key
      ));

      if (burnResult.status !== 'SUCCESS') {
        throw new Error(`Token burn failed: ${burnResult.message}`);
      }

      // Mint to merchant in settlement currency (terms currency)
      logger.info('Minting tokens to merchant', {
        tokenId: mintTokenId,
        amount: mintAmountInBaseUnits,
        merchantAccountId
      });

      // Ensure token association for merchant before mint
      try {
        logger.info('Ensuring merchant is associated to mint token', {
          accountId: merchantAccountId,
          tokenId: mintTokenId
        });
        await this.hederaInfra.associateToken(
          merchantAccountId,
          mintTokenId!,
          merchantAccount.private_key
        );
      } catch (assocErr) {
        logger.warn('Merchant token association attempt finished (ignoring if already associated)', {
          accountId: merchantAccountId,
          tokenId: mintTokenId,
          error: assocErr instanceof Error ? assocErr.message : 'Unknown error'
        });
      }

      const mintResult = await retry(() => this.hederaInfra.mintToken(
        mintTokenId!,
        mintAmountInBaseUnits,
        this.getSupplyKeyForCurrency(settlementCurrency),
        merchantAccountId
      ));

      if (mintResult.status !== 'SUCCESS') {
        throw new Error(`Token mint failed: ${mintResult.message}`);
      }

      // Determine treasury EVM signer private key (processTokenPayment requires msg.sender == treasury)
      const treasuryEvmPrivateKey = (process.env.TREASURY_EVM_PRIVATE_KEY || process.env.HEDERA_EVM_PRIVATE_KEY || '').trim();
      if (!/^0x[0-9a-fA-F]{64}$/.test(treasuryEvmPrivateKey)) {
        throw new Error('Treasury EVM private key not configured or invalid. Set TREASURY_EVM_PRIVATE_KEY (0x... secp256k1)');
      }

      // agreementId already resolved earlier

      // Convert Hedera account IDs to EVM addresses for contract call
      const consumerEvm = BNPLContractInfrastructure.convertHederaAccountToEVMAddress(consumerAccountId);
      const merchantEvm = BNPLContractInfrastructure.convertHederaAccountToEVMAddress(merchantAccountId);

      // Preflight: read on-chain agreement and validate actors/token before writing
      const agreement = await this.bnplContract.getAgreement(agreementId);
      if (!agreement) {
        throw new Error('Agreement not found on-chain');
      }
      if (agreement.isCompleted) {
        throw new Error('Agreement already completed');
      }
      if (agreement.consumer.toLowerCase() !== consumerEvm.toLowerCase()) {
        throw new Error('Consumer does not match agreement');
      }
      if (agreement.merchant.toLowerCase() !== merchantEvm.toLowerCase()) {
        throw new Error('Merchant does not match agreement');
      }
      const agreementTokenId = agreement.tokenId;

      // Update the smart contract to record the payment
      const contractResult = await this.bnplContract.processTokenPayment(
        agreementId,
        consumerEvm,
        merchantEvm,
        mintAmountInBaseUnits.toString(),
        agreementTokenId,
        treasuryEvmPrivateKey
      );

      if (!contractResult.success) {
        throw new Error(`Contract update failed: ${contractResult.error}`);
      }

      logger.info('BNPL installment payment processed successfully', {
        agreementId,
        amount,
        currency: settlementCurrency,
        burnTransactionId: burnResult.transactionId,
        mintTransactionId: mintResult.transactionId,
        contractTransactionId: contractResult.transactionId
      });

      // Create notifications for buyer and merchant (best-effort, non-blocking)
      try {
        // Fetch user IDs for buyer and merchant from hedera_accounts
        const [{ data: buyerAccountRow }, { data: merchantAccountRow }] = await Promise.all([
          this.supabase
            .from('hedera_accounts')
            .select('user_id, alias, whatsapp_phone')
            .eq('account_id', consumerAccountId)
            .single(),
          this.supabase
            .from('hedera_accounts')
            .select('user_id, alias, whatsapp_phone')
            .eq('account_id', merchantAccountId)
            .single()
        ]);

        const shortAgreementId = (agreementId.length > 10) ? `${agreementId.substring(0, 6)}…${agreementId.substring(agreementId.length - 4)}` : agreementId;
        const formattedAmount = `${amount.toFixed(2)} ${settlementCurrency}`;

        // Notify buyer (payer)
        if (buyerAccountRow?.user_id) {
          await this.notifications.create({
            userId: buyerAccountRow.user_id,
            type: 'BNPL_PAYMENT_POSTED',
            title: 'Installment paid',
            body: `You paid ${formattedAmount} for BNPL agreement ${shortAgreementId}${merchantAccountRow?.alias ? ` to ${merchantAccountRow.alias}` : ''}.`,
            metadata: {
              agreementId,
              amount,
              currency: settlementCurrency,
              role: 'buyer',
              merchantAccountId,
              contractTransactionId: contractResult.transactionId,
              burnTransactionId: burnResult.transactionId,
              mintTransactionId: mintResult.transactionId
            }
          });
        }

        // Notify merchant (receiver)
        if (merchantAccountRow?.user_id) {
          await this.notifications.create({
            userId: merchantAccountRow.user_id,
            type: 'BNPL_PAYMENT_POSTED',
            title: 'Installment received',
            body: `You received ${formattedAmount} for BNPL agreement ${shortAgreementId}${buyerAccountRow?.alias ? ` from ${buyerAccountRow.alias}` : ''}.`,
            metadata: {
              agreementId,
              amount,
              currency: settlementCurrency,
              role: 'merchant',
              buyerAccountId: consumerAccountId,
              contractTransactionId: contractResult.transactionId,
              burnTransactionId: burnResult.transactionId,
              mintTransactionId: mintResult.transactionId
            }
          });
        }
      } catch (notifyErr) {
        logger.warn('BNPL installment payment notifications failed (non-blocking)', {
          agreementId,
          error: notifyErr instanceof Error ? notifyErr.message : 'Unknown error'
        });
      }

      return {
        success: true,
        transactionId: contractResult.transactionId
      };

    } catch (error) {
      const aid = (typeof agreementIdOrTxHash === 'string') ? agreementIdOrTxHash : '';
      logger.error('Failed to process BNPL installment payment', {
        agreementIdOrTxHash: aid,
        consumerAccountId,
        merchantAccountId,
        amount,
        currency,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Best-effort failure notifications to both parties
      try {
        // Resolve agreementId if possible for message
        let agreementIdForMsg: string = aid;
        if (/^0x[0-9a-fA-F]{64}$/.test(aid)) {
          const resolved = await this.bnplContract.getAgreementIdFromTxHash(aid);
          if (resolved) agreementIdForMsg = resolved;
        }
        const shortAgreementId = (agreementIdForMsg && agreementIdForMsg.length > 10)
          ? `${agreementIdForMsg.substring(0, 6)}…${agreementIdForMsg.substring(agreementIdForMsg.length - 4)}`
          : (agreementIdForMsg || '');

        const [{ data: buyerAccountRow }, { data: merchantAccountRow }] = await Promise.all([
          this.supabase
            .from('hedera_accounts')
            .select('user_id, alias')
            .eq('account_id', consumerAccountId)
            .single(),
          this.supabase
            .from('hedera_accounts')
            .select('user_id, alias')
            .eq('account_id', merchantAccountId)
            .single()
        ]);

        const formattedAmount = `${amount.toFixed(2)} ${currency.toUpperCase()}`;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';

        if (buyerAccountRow?.user_id) {
          await this.notifications.create({
            userId: buyerAccountRow.user_id,
            type: 'BNPL_DEFAULT',
            title: 'Installment payment failed',
            body: `Your attempt to pay ${formattedAmount}${merchantAccountRow?.alias ? ` to ${merchantAccountRow.alias}` : ''} for BNPL ${shortAgreementId} failed: ${errorMsg}.`,
            metadata: {
              agreementId: agreementIdForMsg || aid,
              amount,
              currency,
              role: 'buyer',
              merchantAccountId,
              error: errorMsg
            }
          });
        }

        if (merchantAccountRow?.user_id) {
          await this.notifications.create({
            userId: merchantAccountRow.user_id,
            type: 'BNPL_DEFAULT',
            title: 'Installment payment failed',
            body: `A buyer's installment of ${formattedAmount}${buyerAccountRow?.alias ? ` from ${buyerAccountRow.alias}` : ''} for BNPL ${shortAgreementId} failed: ${errorMsg}.`,
            metadata: {
              agreementId: agreementIdForMsg || aid,
              amount,
              currency,
              role: 'merchant',
              buyerAccountId: consumerAccountId,
              error: errorMsg
            }
          });
        }
      } catch (notifyErr) {
        logger.warn('Failed to send BNPL failure notifications (non-blocking)', {
          agreementIdOrTxHash: aid,
          error: notifyErr instanceof Error ? notifyErr.message : 'Unknown error'
        });
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get supply key for a given currency
   */
  private getSupplyKeyForCurrency(currency: string): string {
    switch (currency.toUpperCase()) {
      case 'USD':
        return process.env.USD_SUPPLY_KEY || '';
      case 'ZAR':
        return process.env.ZAR_SUPPLY_KEY || '';
      default:
        throw new Error(`No supply key found for currency: ${currency}`);
    }
  }
}
