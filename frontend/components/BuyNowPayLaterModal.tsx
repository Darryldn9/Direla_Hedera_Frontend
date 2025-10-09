import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { X, Clock, CreditCard, CheckCircle, XCircle, RefreshCw } from 'lucide-react-native';
import { useBNPL } from '../hooks/useBNPL';
import { useAccount } from '../contexts/AccountContext';
import { BNPLTerms } from '../types/api';

interface BuyNowPayLaterModalProps {
  visible: boolean;
  onClose: () => void;
  paymentData?: {
    paymentId: string;
    buyerAccountId: string;
    merchantAccountId: string;
    totalAmount: number;
    currency: string;
  };
}

export default function BuyNowPayLaterModal({ visible, onClose, paymentData }: BuyNowPayLaterModalProps) {
  const { selectedAccount } = useAccount();
  const { 
    terms, 
    convertedTerms,
    isLoading, 
    error, 
    createTerms, 
    getTerms, 
    convertTermsToBuyerCurrency,
    generateQuote,
    clearError 
  } = useBNPL();
  
  const [isCreatingTerms, setIsCreatingTerms] = useState(false);
  const [isConvertingCurrency, setIsConvertingCurrency] = useState(false);
  const [showConvertedAmounts, setShowConvertedAmounts] = useState(false);
  const [convertedPaymentAmount, setConvertedPaymentAmount] = useState<number | null>(null);

  // Debug logging
  console.log('[BNPL Modal] Render - visible:', visible, 'paymentData:', paymentData, 'selectedAccount:', selectedAccount);

  // Load existing terms when modal opens
  useEffect(() => {
    if (visible && paymentData && selectedAccount) {
      console.log('[BNPL Modal] Loading terms for payment:', paymentData.paymentId, 'account:', selectedAccount.account_id);
      getTerms(paymentData.paymentId, selectedAccount.account_id);
    }
  }, [visible, paymentData, selectedAccount, getTerms]);

  // Convert terms to buyer's currency when terms are loaded
  useEffect(() => {
    if (terms && selectedAccount && terms.currency !== selectedAccount.currency) {
      console.log('[BNPL Modal] Converting terms to buyer currency:', {
        termsCurrency: terms.currency,
        buyerCurrency: selectedAccount.currency
      });
      convertTermsToBuyerCurrency(terms.id, selectedAccount.currency);
      setShowConvertedAmounts(true); // Automatically show converted amounts
    } else if (terms && selectedAccount && terms.currency === selectedAccount.currency) {
      // If currencies match, don't show conversion
      setShowConvertedAmounts(false);
    }
  }, [terms, selectedAccount, convertTermsToBuyerCurrency]);

  // Convert payment amount when modal opens
  useEffect(() => {
    const convertPaymentAmount = async () => {
      if (paymentData && selectedAccount && paymentData.currency !== selectedAccount.currency) {
        try {
          // Generate quote from merchant currency to user currency
          const quote = await generateQuote({
            buyerAccountId: selectedAccount.account_id,
            merchantAccountId: paymentData.merchantAccountId,
            amount: paymentData.totalAmount,
            buyerCurrency: selectedAccount.currency,
            merchantCurrency: paymentData.currency
          });

          console.log('[BNPL Modal] Quote result:', quote);
          
          if (quote) {
            setConvertedPaymentAmount(quote.toAmount * quote.exchangeRate);
          }
        } catch (error) {
          console.error('Failed to convert payment amount:', error);
          setConvertedPaymentAmount(null);
        }
      } else {
        setConvertedPaymentAmount(null);
      }
    };

    if (visible && paymentData && selectedAccount) {
      convertPaymentAmount();
    }
  }, [visible, paymentData, selectedAccount, generateQuote]);

  // Debug empty state rendering
  useEffect(() => {
    if (visible && !terms) {
      console.log('[BNPL Modal] Rendering empty state - paymentData:', paymentData);
    }
  }, [visible, terms, paymentData]);

  const handleCreateTerms = async () => {
    if (!paymentData || !selectedAccount) {
      console.log('[BNPL Modal] Missing payment data or selected account:', { paymentData, selectedAccount });
      return;
    }

    console.log('[BNPL Modal] Creating terms with data:', paymentData);
    setIsCreatingTerms(true);
    clearError();

    const termsRequest = {
      paymentId: paymentData.paymentId,
      buyerAccountId: paymentData.buyerAccountId,
      merchantAccountId: paymentData.merchantAccountId,
      totalAmount: paymentData.totalAmount,
      currency: paymentData.currency,
      installmentCount: 3, // 3 week installments
      interestRate: 5, // 5% interest
      expiresInMinutes: 30, // 30 minutes to accept
    };

    console.log('[BNPL Modal] Terms request:', termsRequest);
    const createdTerms = await createTerms(termsRequest);
    
    if (createdTerms) {
      Alert.alert(
        'Terms Created',
        'BNPL terms have been sent to the merchant. They have 30 minutes to respond.',
        [{ text: 'OK' }]
      );
    }
    
    setIsCreatingTerms(false);
  };


  const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toFixed(2)} ${currency}`;
  };

  const handleCurrencyConversion = async () => {
    if (!terms || !selectedAccount) return;
    
    setIsConvertingCurrency(true);
    try {
      await convertTermsToBuyerCurrency(terms.id, selectedAccount.currency);
      setShowConvertedAmounts(true);
    } catch (error) {
      console.error('Error converting currency:', error);
      Alert.alert('Conversion Error', 'Failed to convert currency. Please try again.');
    } finally {
      setIsConvertingCurrency(false);
    }
  };

  const formatTimeRemaining = (expiresAt: number) => {
    const now = Date.now();
    const remaining = expiresAt - now;
    
    if (remaining <= 0) return 'Expired';
    
    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: BNPLTerms['status']) => {
    switch (status) {
      case 'PENDING':
        return <Clock size={20} color="#F39C12" />;
      case 'ACCEPTED':
        return <CheckCircle size={20} color="#27AE60" />;
      case 'REJECTED':
      case 'EXPIRED':
        return <XCircle size={20} color="#E74C3C" />;
      default:
        return <Clock size={20} color="#8E8E93" />;
    }
  };

  const getStatusColor = (status: BNPLTerms['status']) => {
    switch (status) {
      case 'PENDING':
        return '#F39C12';
      case 'ACCEPTED':
        return '#27AE60';
      case 'REJECTED':
      case 'EXPIRED':
        return '#E74C3C';
      default:
        return '#8E8E93';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Buy Now Pay Later</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={clearError} style={styles.dismissErrorButton}>
                  <Text style={styles.dismissErrorText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            )}

            {!terms ? (
              <View style={styles.emptyState}>
                <CreditCard size={48} color="#8E8E93" />
                <Text style={styles.emptyTitle}>No BNPL Terms Yet</Text>
                <Text style={styles.emptyDescription}>
                  Create BNPL terms to split your payment into 3 weekly installments at 5% interest.
                </Text>
                
                {paymentData ? (
                  <View style={[styles.paymentSummary, { backgroundColor: '#E8F5E8', borderWidth: 2, borderColor: '#0C7C59' }]}>
                    <Text style={styles.summaryTitle}>Payment Summary</Text>
                    {selectedAccount && paymentData.currency !== selectedAccount.currency ? (
                      <>
                        <Text style={[styles.summaryAmount, { fontSize: 28, color: '#0C7C59' }]}>
                          {convertedPaymentAmount ? formatCurrency(convertedPaymentAmount, selectedAccount.currency) : 'Converting...'}
                        </Text>
                        <Text style={[styles.summaryAmount, { fontSize: 16, color: '#8E8E93', marginTop: 4 }]}>
                          ≈ {formatCurrency(paymentData.totalAmount, paymentData.currency)}
                        </Text>
                      </>
                    ) : (
                      <Text style={[styles.summaryAmount, { fontSize: 28, color: '#0C7C59' }]}>
                        {formatCurrency(paymentData.totalAmount, paymentData.currency)}
                      </Text>
                    )}
                    <Text style={styles.summaryDetails}>
                      3 installments • 5% interest
                    </Text>
                    <Text style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                      DEBUG: Payment data received ✓
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.paymentSummary, { backgroundColor: '#FFE6E6', borderWidth: 2, borderColor: '#E74C3C' }]}>
                    <Text style={styles.summaryTitle}>No Payment Data</Text>
                    <Text style={styles.summaryAmount}>Missing payment information</Text>
                    <Text style={{ fontSize: 12, color: '#E74C3C', marginTop: 8 }}>
                      DEBUG: No payment data received ✗
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.createButton, isCreatingTerms && styles.createButtonDisabled]}
                  onPress={handleCreateTerms}
                  disabled={isCreatingTerms || !paymentData}
                >
                  <Text style={styles.createButtonText}>
                    {isCreatingTerms ? 'Creating Terms...' : 'Create BNPL Terms'}
                  </Text>
                </TouchableOpacity>
                
                {/* Debug info */}
                <View style={{ marginTop: 16, padding: 12, backgroundColor: '#F0F0F0', borderRadius: 8 }}>
                  <Text style={{ fontSize: 10, color: '#666' }}>
                    DEBUG INFO:
                  </Text>
                  <Text style={{ fontSize: 10, color: '#666' }}>
                    Payment Data: {paymentData ? 'Present' : 'Missing'}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#666' }}>
                    Selected Account: {selectedAccount ? 'Present' : 'Missing'}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#666' }}>
                    Terms: {terms ? 'Present' : 'None'}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#666' }}>
                    Converted Terms: {convertedTerms ? 'Present' : 'None'}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#666' }}>
                    Show Converted: {showConvertedAmounts ? 'Yes' : 'No'}
                  </Text>
                  {paymentData && selectedAccount && (
                    <Text style={{ fontSize: 10, color: '#666' }}>
                      Currency Match: {paymentData.currency === selectedAccount.currency ? 'Yes' : 'No'}
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.termsContainer}>
                <View style={styles.termsHeader}>
                  <View style={styles.statusContainer}>
                    {getStatusIcon(terms.status)}
                    <Text style={[styles.statusText, { color: getStatusColor(terms.status) }]}>
                      {terms.status}
                    </Text>
                  </View>
                  {terms.status === 'PENDING' && (
                    <Text style={styles.timeRemaining}>
                      {formatTimeRemaining(terms.expiresAt)}
                    </Text>
                  )}
                </View>

                <View style={styles.termsDetails}>
                  {/* Currency conversion header */}
                  {terms.currency !== selectedAccount?.currency && (
                    <View style={styles.currencyConversionHeader}>
                      <Text style={styles.currencyConversionText}>
                        {showConvertedAmounts && convertedTerms 
                          ? `Showing amounts in ${selectedAccount?.currency}`
                          : `Showing amounts in ${terms.currency}`
                        }
                      </Text>
                      {!showConvertedAmounts && convertedTerms && (
                        <TouchableOpacity
                          style={styles.convertButton}
                          onPress={handleCurrencyConversion}
                          disabled={isConvertingCurrency}
                        >
                          <RefreshCw 
                            size={16} 
                            color="#007AFF" 
                            style={isConvertingCurrency ? { transform: [{ rotate: '360deg' }] } : {}}
                          />
                          <Text style={styles.convertButtonText}>
                            {isConvertingCurrency ? 'Converting...' : `Show in ${selectedAccount?.currency}`}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Amounts display */}
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Total Amount</Text>
                    <View style={styles.amountContainer}>
                      {showConvertedAmounts && convertedTerms ? (
                        <Text style={styles.amountValue}>
                          {formatCurrency(convertedTerms.totalAmount * convertedTerms.exchangeRate, convertedTerms.currency)}
                        </Text>
                      ) : (
                        <Text style={styles.amountValue}>
                          {formatCurrency(terms.totalAmount, terms.currency)}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Interest (5%)</Text>
                    <View style={styles.amountContainer}>
                      {showConvertedAmounts && convertedTerms ? (
                        <Text style={styles.amountValue}>
                          {formatCurrency(convertedTerms.totalInterest * convertedTerms.exchangeRate, convertedTerms.currency)}
                        </Text>
                      ) : (
                        <Text style={styles.amountValue}>
                          {formatCurrency(terms.totalInterest, terms.currency)}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Total with Interest</Text>
                    <View style={styles.amountContainer}>
                      {showConvertedAmounts && convertedTerms ? (
                        <Text style={[styles.amountValue, styles.totalAmount]}>
                          {formatCurrency(convertedTerms.totalAmountWithInterest * convertedTerms.exchangeRate, convertedTerms.currency)}
                        </Text>
                      ) : (
                        <Text style={[styles.amountValue, styles.totalAmount]}>
                          {formatCurrency(terms.totalAmountWithInterest, terms.currency)}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.installmentDetails}>
                    <Text style={styles.installmentLabel}>
                      {terms.installmentCount} Weekly Installments
                    </Text>
                    <View style={styles.installmentAmountContainer}>
                      {showConvertedAmounts && convertedTerms ? (
                        <Text style={styles.installmentAmount}>
                          {formatCurrency(convertedTerms.installmentAmount * (1 + terms.interestRate / 100) * convertedTerms.exchangeRate, convertedTerms.currency)} each
                        </Text>
                      ) : (
                        <Text style={styles.installmentAmount}>
                          {formatCurrency(terms.installmentAmount, terms.currency)} each
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Exchange rate info */}
                  {showConvertedAmounts && convertedTerms && (
                    <View style={styles.exchangeRateInfo}>
                      <Text style={styles.exchangeRateText}>
                        Original amount: {formatCurrency(terms.totalAmount, terms.currency)}
                      </Text>
                      <Text style={styles.exchangeRateText}>
                        Exchange rate: 1 {terms.currency} = {convertedTerms.exchangeRate.toFixed(4)} {convertedTerms.currency}
                      </Text>
                      <Text style={styles.exchangeRateNote}>
                        * Approximate amounts based on current exchange rate
                      </Text>
                    </View>
                  )}
                </View>

                {terms.status === 'PENDING' && (
                  <View style={styles.waitingContainer}>
                    <Clock size={24} color="#F39C12" />
                    <View style={styles.waitingTextContainer}>
                      <Text style={styles.waitingText}>
                        Waiting for merchant to accept the BNPL terms...
                      </Text>
                      <Text style={styles.waitingSubtext}>
                        You will be notified once the merchant responds.
                      </Text>
                    </View>
                  </View>
                )}

                {terms.status === 'ACCEPTED' && (
                  <View style={styles.acceptedContainer}>
                    <CheckCircle size={24} color="#27AE60" />
                    <Text style={styles.acceptedText}>
                      Terms accepted! Payment will be processed in installments.
                    </Text>
                  </View>
                )}

                {(terms.status === 'REJECTED' || terms.status === 'EXPIRED') && (
                  <View style={styles.rejectedContainer}>
                    <XCircle size={24} color="#E74C3C" />
                    <Text style={styles.rejectedText}>
                      {terms.status === 'REJECTED' ? 'Terms were rejected.' : 'Terms have expired.'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    height: '100%',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 8,
  },
  dismissErrorButton: {
    alignSelf: 'flex-end',
  },
  dismissErrorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  paymentSummary: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0C7C59',
    marginBottom: 4,
  },
  summaryDetails: {
    fontSize: 12,
    color: '#8E8E93',
  },
  createButton: {
    backgroundColor: '#0C7C59',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#BDC3C7',
    opacity: 0.6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  termsContainer: {
    flex: 1,
  },
  termsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timeRemaining: {
    fontSize: 14,
    color: '#F39C12',
    fontWeight: '500',
  },
  termsDetails: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C7C59',
  },
  installmentDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    alignItems: 'center',
  },
  installmentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  installmentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C7C59',
  },
  installmentAmountContainer: {
    alignItems: 'center',
  },
  convertedInstallmentAmount: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 2,
  },
  currencyConversionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  currencyConversionText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  convertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  convertButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  convertedAmount: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 2,
  },
  exchangeRateInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  exchangeRateText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  exchangeRateNote: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  acceptedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  acceptedText: {
    flex: 1,
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
  },
  rejectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  rejectedText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  waitingTextContainer: {
    flex: 1,
  },
  waitingText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  waitingSubtext: {
    fontSize: 12,
    color: '#A16207',
    marginTop: 4,
  },
});
