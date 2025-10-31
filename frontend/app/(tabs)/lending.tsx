import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrendingUp, Shield, Clock, Users, DollarSign, Award, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, ArrowRight, CreditCard, CheckCircle2, XCircle, History } from 'lucide-react-native';
import { useAppMode } from '../../contexts/AppContext';
import { useAccount } from '../../contexts/AccountContext';
import { useBNPL } from '../../hooks/useBNPL';
import { BNPLTerms } from '../../types/api';
import { formatCurrency as formatCurrencyUtil } from '../../utils/currency';
import PageHeader from '../../components/PageHeader';
import { Colors } from '../../lib/colors';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';

interface LoanOffer {
  id: string;
  amount: number;
  interestRate: number;
  term: string;
  monthlyPayment: number;
  lender: string;
  rating: number;
}

interface LendingOpportunity {
  id: string;
  borrower: string;
  amount: number;
  purpose: string;
  interestRate: number;
  term: string;
  creditScore: number;
  risk: 'Low' | 'Medium' | 'High';
}

// BNPL Terms Section Component
function BNPLTermsSection() {
  const { selectedAccount } = useAccount();
  const { showInfo, showSuccess, showError, hideAllToasts } = useToast();
  const { 
    getPendingTermsForMerchant, 
    getTermsForMerchant,
    acceptTerms, 
    rejectTerms, 
    isLoading, 
    error 
  } = useBNPL();
  
  const [pendingTerms, setPendingTerms] = useState<BNPLTerms[]>([]);
  const [historyTerms, setHistoryTerms] = useState<BNPLTerms[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [accountAliasMap, setAccountAliasMap] = useState<Record<string, string>>({});

  // Custom alert modal state
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    agreementId?: string;
    buttons: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>;
  }>({
    title: '',
    message: '',
    buttons: []
  });

  // Custom alert function
  const showCustomAlertModal = (title: string, message: string, buttons: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>, agreementId?: string) => {
    setAlertConfig({ title, message, buttons, agreementId });
    setShowCustomAlert(true);
  };

  const loadPendingTerms = async () => {
    if (!selectedAccount) return;
    
    const terms = await getPendingTermsForMerchant(selectedAccount.account_id);
    setPendingTerms(terms || []);
  };

  const loadHistoryTerms = async () => {
    if (!selectedAccount) return;

    const terms = await getTermsForMerchant(selectedAccount.account_id);
    setHistoryTerms(terms || []);
  };

  const loadAccountAliases = async () => {
    try {
      const response = await api.hedera.getActiveAccounts();
      if (response?.success && response.data) {
        const map: Record<string, string> = {};
        response.data.forEach(acc => {
          if (acc.account_id && acc.alias) {
            map[acc.account_id] = acc.alias;
          }
        });
        setAccountAliasMap(map);
      }
    } catch {}
  };

  useEffect(() => {
    loadPendingTerms();
    loadHistoryTerms();
    loadAccountAliases();
  }, [selectedAccount]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPendingTerms();
    await loadHistoryTerms();
    setRefreshing(false);
  };

  const handleAcceptTerms = async (termsId: string) => {
    if (!selectedAccount) return;

    console.log('[Lending] Accepting terms:', termsId, 'for account:', selectedAccount.account_id);

    showCustomAlertModal(
      'Accept BNPL Terms',
      'Are you sure you want to accept these BNPL terms? The customer will be charged in installments.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setShowCustomAlert(false) },
        {
          text: 'Accept',
          onPress: async () => {
            setShowCustomAlert(false);
            console.log('[Lending] Attempting to accept terms:', termsId, 'for account:', selectedAccount.account_id);
            try {
              // Show loading toast while waiting for acceptance confirmation
              showInfo('Confirming BNPL acceptance…', 'Please wait while we confirm with the network.', 30000);
              const result = await acceptTerms(termsId, selectedAccount.account_id);
              console.log('[Lending] Accept terms result:', result);
              if (result.success) {
                hideAllToasts();
                showSuccess('BNPL terms accepted', 'The customer will be charged in installments.', 4000);
                
                showCustomAlertModal(
                  'Success',
                  'BNPL terms accepted successfully!',
                  [
                    { text: 'OK', onPress: () => setShowCustomAlert(false) }
                  ],
                  result.smartContractAgreementId
                );
                await loadPendingTerms();
                await loadHistoryTerms();
              } else {
                hideAllToasts();
                showError('Failed to accept BNPL terms', 'Please try again.');
                showCustomAlertModal('Error', 'Failed to accept BNPL terms. Please try again.', [
                  { text: 'OK', onPress: () => setShowCustomAlert(false) }
                ]);
              }
            } catch (error) {
              console.error('[Lending] Error accepting terms:', error);
              hideAllToasts();
              showError('Failed to accept BNPL terms', `${error instanceof Error ? error.message : 'Unknown error'}`);
              showCustomAlertModal('Error', `Failed to accept BNPL terms: ${error instanceof Error ? error.message : 'Unknown error'}`, [
                { text: 'OK', onPress: () => setShowCustomAlert(false) }
              ]);
            }
          }
        }
      ]
    );
  };

  const handleRejectTerms = async (termsId: string) => {
    if (!selectedAccount) return;

    Alert.alert(
      'Reject BNPL Terms',
      'Are you sure you want to reject these BNPL terms?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            const success = await rejectTerms(termsId, selectedAccount.account_id, 'Merchant rejected');
            if (success) {
              Alert.alert('Rejected', 'BNPL terms have been rejected.');
              await loadPendingTerms();
              await loadHistoryTerms();
            }
          }
        }
      ]
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    return formatCurrencyUtil(amount, currency);
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
        return <CheckCircle2 size={20} color="#27AE60" />;
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
    <ScrollView 
      style={styles.bnplContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.bnplHeader}>
        <CreditCard size={24} color="#0C7C59" />
        <Text style={styles.bnplTitle}>Buy Now Pay Later Terms</Text>
      </View>
      <View style={styles.bnplLinkContainerLeft}>
        <TouchableOpacity 
          style={styles.bnplPlainLink}
          onPress={async () => {
            if (!showHistory) {
              // Reload history when opening
              await loadHistoryTerms();
            }
            setShowHistory(prev => !prev);
          }}
        >
          <Clock size={16} color="#6B7280" />
          <Text style={styles.bnplLinkTextMuted}>View Previous Terms</Text>
          <ArrowRight size={14} color="#6B7280" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.bnplDescription}>
        Manage BNPL terms from customers who want to split their payments into installments.
      </Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!Array.isArray(pendingTerms) || pendingTerms.length === 0 ? (
        <View style={styles.emptyState}>
          <CreditCard size={48} color="#8E8E93" />
          <Text style={styles.emptyTitle}>No Pending BNPL Terms</Text>
          <Text style={styles.emptyDescription}>
            When customers request BNPL terms, they will appear here for your review.
          </Text>
        </View>
      ) : (
        <View style={styles.termsList}>
          {pendingTerms.map((terms) => {
            if (!terms || !terms.id) {
              return null;
            }
            return (
            <TouchableOpacity 
              key={terms.id} 
              style={styles.termsCard}
              onPress={() => {
                if (terms.smartContractAgreementId) {
                  showCustomAlertModal(
                    'Smart Contract Agreement ID',
                    'The Hedera smart contract agreement ID for these BNPL terms:',
                    [
                      { text: 'OK', onPress: () => setShowCustomAlert(false) }
                    ],
                    terms.smartContractAgreementId
                  );
                } else {
                  showCustomAlertModal(
                    'Smart Contract Agreement ID',
                    'Smart contract agreement ID is not available for this terms yet. It will be generated when the terms are accepted.',
                    [
                      { text: 'OK', onPress: () => setShowCustomAlert(false) }
                    ]
                  );
                }
              }}
              activeOpacity={0.7}
            >
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
                <View style={styles.bnplAmountRow}>
                  <Text style={styles.bnplAmountLabel}>Total Amount</Text>
                  <Text style={styles.bnplAmountValue}>
                    {formatCurrency(terms.totalAmount, terms.currency)}
                  </Text>
                </View>

                <View style={styles.bnplAmountRow}>
                  <Text style={styles.bnplAmountLabel}>Interest (5%)</Text>
                  <Text style={styles.bnplAmountValue}>
                    {formatCurrency(terms.totalInterest, terms.currency)}
                  </Text>
                </View>

                <View style={styles.bnplAmountRow}>
                  <Text style={styles.bnplAmountLabel}>Total with Interest</Text>
                  <Text style={[styles.bnplAmountValue, styles.bnplTotalAmount]}>
                    {formatCurrency(terms.totalAmountWithInterest, terms.currency)}
                  </Text>
                </View>

                <View style={styles.installmentDetails}>
                  <Text style={styles.installmentLabel}>
                    {terms.installmentCount} Weekly Installments
                  </Text>
                  <Text style={styles.installmentAmount}>
                    {formatCurrency(terms.installmentAmount, terms.currency)} each
                  </Text>
                </View>

                <View style={styles.customerInfo}>
                  <Text style={styles.customerLabel}>Customer Account:</Text>
                  <Text style={styles.customerAccount}>{accountAliasMap[terms.buyerAccountId] || terms.buyerAccountId}</Text>
                </View>
              </View>

              {terms.status === 'PENDING' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => handleAcceptTerms(terms.id)}
                    disabled={isLoading}
                  >
                    <CheckCircle2 size={20} color="#FFFFFF" />
                    <Text style={styles.acceptButtonText}>Accept Terms</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleRejectTerms(terms.id)}
                    disabled={isLoading}
                  >
                    <XCircle size={20} color="#E74C3C" />
                    <Text style={styles.rejectButtonText}>Reject Terms</Text>
                  </TouchableOpacity>
                </View>
              )}

              {terms.status === 'ACCEPTED' && (
                <View style={styles.acceptedContainer}>
                  <CheckCircle2 size={24} color="#27AE60" />
                  <Text style={styles.acceptedText}>
                    Terms accepted! Customer will be charged in installments.
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
            </TouchableOpacity>
          );
          })}
        </View>
      )}

      {/* Custom Alert Modal */}
      <Modal
        visible={showCustomAlert}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomAlert(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertModal}>
            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
            <Text style={styles.alertMessage}>{alertConfig.message}</Text>
            {alertConfig.agreementId && (
              <View style={styles.agreementIdContainer}>
                <Text style={styles.agreementIdLabel}>Smart Contract Agreement ID:</Text>
                <View style={styles.agreementIdValueContainer}>
                  <Text style={styles.agreementIdValue} selectable>
                    {alertConfig.agreementId}
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.alertButtons}>
              {alertConfig.buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.alertButton,
                    button.style === 'cancel' && styles.alertButtonCancel,
                    button.style === 'destructive' && styles.alertButtonDestructive,
                  ]}
                  onPress={button.onPress}
                >
                  <Text style={[
                    styles.alertButtonText,
                    button.style === 'cancel' && styles.alertButtonTextCancel,
                    button.style === 'destructive' && styles.alertButtonTextDestructive,
                  ]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Inline History */}
      {showHistory && (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.sectionTitle}>Previous BNPL Terms</Text>
          {(() => {
            // Filter out PENDING terms - they're shown in the main list above
            const nonPendingTerms = historyTerms.filter(t => t.status !== 'PENDING');
            return nonPendingTerms.length === 0 ? (
              <View style={styles.emptyState}>
                <Clock size={48} color="#8E8E93" />
                <Text style={styles.emptyTitle}>No Previous Terms</Text>
                <Text style={styles.emptyDescription}>Accepted, rejected, and expired terms will appear here.</Text>
              </View>
            ) : (
              <View style={styles.historyContainerTight}>
                <View style={styles.historyList}>
                  {nonPendingTerms.map((t) => (
                    <TouchableOpacity 
                      key={t.id} 
                      style={styles.historyItem}
                      onPress={() => {
                        if (t.smartContractAgreementId) {
                          showCustomAlertModal(
                            'Smart Contract Agreement ID',
                            'The Hedera smart contract agreement ID for these BNPL terms:',
                            [
                              { text: 'OK', onPress: () => setShowCustomAlert(false) }
                            ],
                            t.smartContractAgreementId
                          );
                        } else {
                          showCustomAlertModal(
                            'Smart Contract Agreement ID',
                            'Smart contract agreement ID is not available for this terms.',
                            [
                              { text: 'OK', onPress: () => setShowCustomAlert(false) }
                            ]
                          );
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.historyTopRow}>
                        <Text style={styles.historyAmount}>{formatCurrency(t.totalAmount, t.currency)}</Text>
                        <Text style={[styles.historyStatus, { color: getStatusColor(t.status) }]}>{t.status}</Text>
                      </View>
                      <View style={styles.historyMetaRow}>
                        <Text style={styles.historyMeta}>Installments: {t.installmentCount}</Text>
                        <Text style={styles.historyMeta}>Buyer: {accountAliasMap[t.buyerAccountId] || t.buyerAccountId}</Text>
                      </View>
                      <Text style={styles.historyDate}>{new Date(t.createdAt).toLocaleString()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })()}
        </View>
      )}
    </ScrollView>
  );
}

export default function LendingScreen() {
  const { mode } = useAppMode();
  const [activeTab, setActiveTab] = useState<'borrow' | 'lend' | 'business' | 'bnpl'>('borrow');
  const [loanAmount, setLoanAmount] = useState('');
  const [creditScore] = useState(742); // Based on transaction history
  const insets = useSafeAreaInsets();

  // Set default tab based on mode
  useEffect(() => {
    if (mode === 'business') {
      setActiveTab('bnpl');
    } else {
      setActiveTab('borrow');
    }
  }, [mode]);

  const loanOffers: LoanOffer[] = [
    {
      id: '1',
      amount: 5000,
      interestRate: 12.5,
      term: '12 months',
      monthlyPayment: 447.92,
      lender: 'Community Bank',
      rating: 4.8,
    },
    {
      id: '2',
      amount: 5000,
      interestRate: 14.2,
      term: '12 months',
      monthlyPayment: 455.83,
      lender: 'Peer Lender Group',
      rating: 4.6,
    },
    {
      id: '3',
      amount: 5000,
      interestRate: 16.8,
      term: '12 months',
      monthlyPayment: 469.25,
      lender: 'Quick Cash SA',
      rating: 4.2,
    },
  ];

  const lendingOpportunities: LendingOpportunity[] = [
    {
      id: '1',
      borrower: 'Small Business Owner',
      amount: 2500,
      purpose: 'Stock for spaza shop',
      interestRate: 15.0,
      term: '6 months',
      creditScore: 680,
      risk: 'Low',
    },
    {
      id: '2',
      borrower: 'Taxi Driver',
      amount: 8000,
      purpose: 'Vehicle repairs',
      interestRate: 18.5,
      term: '12 months',
      creditScore: 620,
      risk: 'Medium',
    },
    {
      id: '3',
      borrower: 'Market Vendor',
      amount: 1200,
      purpose: 'Equipment purchase',
      interestRate: 12.8,
      term: '4 months',
      creditScore: 725,
      risk: 'Low',
    },
  ];

  const businessLoanOffers = [
    {
      id: '1',
      amount: 25000,
      interestRate: 10.5,
      term: '24 months',
      monthlyPayment: 1156.25,
      lender: 'SME Development Fund',
      rating: 4.9,
      requirements: 'Min. 6 months transaction history',
    },
    {
      id: '2',
      amount: 50000,
      interestRate: 12.8,
      term: '36 months',
      monthlyPayment: 1678.50,
      lender: 'Business Growth Capital',
      rating: 4.7,
      requirements: 'Min. R10k monthly revenue',
    },
  ];

  const businessMetrics = {
    monthlyRevenue: 18420.75,
    transactionHistory: 8, // months
    avgTransactionValue: 127.50,
    customerBase: 89,
    creditScore: 785, // Business credit score
  };

  const getCreditScoreColor = (score: number) => {
    if (score >= 700) return '#0C7C59';
    if (score >= 600) return '#F1C40F';
    return '#E74C3C';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return '#0C7C59';
      case 'Medium': return '#F1C40F';
      case 'High': return '#E74C3C';
      default: return '#7F8C8D';
    }
  };

  const handleLoanApplication = () => {
    if (!loanAmount || parseFloat(loanAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid loan amount');
      return;
    }

    Alert.alert(
      'Loan Application',
      `Application for R${loanAmount} submitted. Your credit score of ${creditScore} qualifies you for competitive rates. You'll receive offers within 24 hours.`,
      [{ text: 'OK', onPress: () => setLoanAmount('') }]
    );
  };


  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} edges={[]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 34) + 82 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Consistent with Hub/Sales/Money */}
        <PageHeader />

        {/* Page Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>
            {mode === 'consumer' ? 'Lending Hub' : 'Business Lending'}
          </Text>
          <Text style={styles.pageSubtitle}>
            {mode === 'consumer' ? 'Powered by community trust' : 'Business financing solutions'}
          </Text>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          {mode === 'consumer' ? (
            <>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'borrow' && styles.activeTab]}
                onPress={() => setActiveTab('borrow')}
              >
                <Text style={[styles.tabText, activeTab === 'borrow' && styles.activeTabText]}>
                  Borrow Money
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'lend' && styles.activeTab]}
                onPress={() => setActiveTab('lend')}
              >
                <Text style={[styles.tabText, activeTab === 'lend' && styles.activeTabText]}>
                  Lend Money
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'bnpl' && styles.activeTab]}
                onPress={() => setActiveTab('bnpl')}
              >
                <Text style={[styles.tabText, activeTab === 'bnpl' && styles.activeTabText]}>
                  BNPL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'business' && styles.activeTab]}
                onPress={() => setActiveTab('business')}
              >
                <Text style={[styles.tabText, activeTab === 'business' && styles.activeTabText]}>
                  Loans
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'lend' && styles.activeTab]}
                onPress={() => setActiveTab('lend')}
              >
                <Text style={[styles.tabText, activeTab === 'lend' && styles.activeTabText]}>
                  Lending
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Credit Score Card */}
        <View style={styles.creditScoreCard}>
          <View style={styles.creditScoreHeader}>
            <View>
              <Text style={styles.creditScoreLabel}>Your Credit Score</Text>
              <Text style={[styles.creditScoreValue, { color: getCreditScoreColor(creditScore) }]}>
                {creditScore}
              </Text>
            </View>
            <View style={styles.creditScoreIcon}>
              <TrendingUp size={24} color={getCreditScoreColor(creditScore)} />
            </View>
          </View>
          <Text style={styles.creditScoreDescription}>
            Based on your transaction history and payment behavior
          </Text>
          <View style={styles.creditFactors}>
            <View style={styles.factorItem}>
              <CheckCircle size={16} color="#0C7C59" />
              <Text style={styles.factorText}>Regular payments</Text>
            </View>
            <View style={styles.factorItem}>
              <CheckCircle size={16} color="#0C7C59" />
              <Text style={styles.factorText}>Good spending habits</Text>
            </View>
            <View style={styles.factorItem}>
              <Clock size={16} color="#F1C40F" />
              <Text style={styles.factorText}>Account age: 2 years</Text>
            </View>
          </View>
        </View>

        {(activeTab === 'borrow' && mode === 'consumer') ? (
          <>
            {/* Loan Application */}
            <View style={styles.applicationContainer}>
              <Text style={styles.sectionTitle}>Apply for a Loan</Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.amountLabel}>How much do you need?</Text>
                <View style={styles.amountInput}>
                  <Text style={styles.currencySymbol}>R</Text>
                  <TextInput
                    style={styles.input}
                    value={loanAmount}
                    onChangeText={setLoanAmount}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor="#BDC3C7"
                  />
                </View>
              </View>
              <TouchableOpacity style={styles.applyButton} onPress={handleLoanApplication}>
                <Text style={styles.applyButtonText}>Get Loan Offers</Text>
              </TouchableOpacity>
            </View>

            {/* Loan Offers */}
            <View style={styles.offersContainer}>
              <Text style={styles.sectionTitle}>Available Loan Offers</Text>
              {loanOffers.map((offer) => (
                <View key={offer.id} style={styles.offerCard}>
                  <View style={styles.offerHeader}>
                    <Text style={styles.offerAmount}>R {offer.amount.toLocaleString()}</Text>
                    <View style={styles.lenderInfo}>
                      <Text style={styles.lenderName}>{offer.lender}</Text>
                      <Text style={styles.lenderRating}>⭐ {offer.rating}</Text>
                    </View>
                  </View>
                  <View style={styles.offerDetails}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Interest Rate</Text>
                      <Text style={styles.detailValue}>{offer.interestRate}% p.a.</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Term</Text>
                      <Text style={styles.detailValue}>{offer.term}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Monthly Payment</Text>
                      <Text style={styles.detailValue}>R {offer.monthlyPayment.toFixed(2)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.selectOfferButton}>
                    <Text style={styles.selectOfferText}>Select This Offer</Text>
                    <ArrowRight size={16} color="#0C7C59" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        ) : (activeTab === 'bnpl' && mode === 'business') ? (
          <BNPLTermsSection />
        ) : (activeTab === 'business' && (mode === 'consumer' || mode === 'business')) ? (
          <>
            {/* Business Metrics */}
            <View style={styles.businessMetricsCard}>
              <Text style={styles.sectionTitle}>Business Performance</Text>
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>R {businessMetrics.monthlyRevenue.toLocaleString()}</Text>
                  <Text style={styles.metricLabel}>Monthly Revenue</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{businessMetrics.transactionHistory}</Text>
                  <Text style={styles.metricLabel}>Months History</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>R {businessMetrics.avgTransactionValue}</Text>
                  <Text style={styles.metricLabel}>Avg Transaction</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{businessMetrics.customerBase}</Text>
                  <Text style={styles.metricLabel}>Customers</Text>
                </View>
              </View>
              <View style={styles.businessCreditScore}>
                <Text style={styles.businessCreditLabel}>Business Credit Score</Text>
                <Text style={[styles.businessCreditValue, { color: getCreditScoreColor(businessMetrics.creditScore) }]}>
                  {businessMetrics.creditScore}
                </Text>
              </View>
            </View>

            {/* Business Loan Application */}
            <View style={styles.applicationContainer}>
              <Text style={styles.sectionTitle}>Business Loan Application</Text>
              <Text style={styles.businessLoanDescription}>
                Based on your {businessMetrics.transactionHistory} months of transaction history and R{businessMetrics.monthlyRevenue.toLocaleString()} monthly revenue, you qualify for business expansion loans.
              </Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.amountLabel}>Loan Amount Needed</Text>
                <View style={styles.amountInput}>
                  <Text style={styles.currencySymbol}>R</Text>
                  <TextInput
                    style={styles.input}
                    value={loanAmount}
                    onChangeText={setLoanAmount}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor="#BDC3C7"
                  />
                </View>
              </View>
              <TouchableOpacity style={styles.applyButton} onPress={handleLoanApplication}>
                <Text style={styles.applyButtonText}>Get Business Loan Offers</Text>
              </TouchableOpacity>
            </View>

            {/* Business Loan Offers */}
            <View style={styles.offersContainer}>
              <Text style={styles.sectionTitle}>Business Loan Offers</Text>
              {businessLoanOffers.map((offer) => (
                <View key={offer.id} style={styles.businessOfferCard}>
                  <View style={styles.offerHeader}>
                    <Text style={styles.offerAmount}>R {offer.amount.toLocaleString()}</Text>
                    <View style={styles.lenderInfo}>
                      <Text style={styles.lenderName}>{offer.lender}</Text>
                      <Text style={styles.lenderRating}>⭐ {offer.rating}</Text>
                    </View>
                  </View>
                  <View style={styles.offerDetails}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Interest Rate</Text>
                      <Text style={styles.detailValue}>{offer.interestRate}% p.a.</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Term</Text>
                      <Text style={styles.detailValue}>{offer.term}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Monthly Payment</Text>
                      <Text style={styles.detailValue}>R {offer.monthlyPayment.toFixed(2)}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Requirements</Text>
                      <Text style={styles.requirementText}>{offer.requirements}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.selectOfferButton}>
                    <Text style={styles.selectOfferText}>Apply for Business Loan</Text>
                    <ArrowRight size={16} color="#0C7C59" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Business Loan Benefits */}
            <View style={styles.businessBenefitsContainer}>
              <Text style={styles.benefitsTitle}>Business Loan Benefits</Text>
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <CheckCircle size={16} color="#0C7C59" />
                  <Text style={styles.benefitText}>No collateral required for loans under R50,000</Text>
                </View>
                <View style={styles.benefitItem}>
                  <CheckCircle size={16} color="#0C7C59" />
                  <Text style={styles.benefitText}>Qualification based on transaction history</Text>
                </View>
                <View style={styles.benefitItem}>
                  <CheckCircle size={16} color="#0C7C59" />
                  <Text style={styles.benefitText}>Flexible repayment terms</Text>
                </View>
                <View style={styles.benefitItem}>
                  <CheckCircle size={16} color="#0C7C59" />
                  <Text style={styles.benefitText}>Instant approval for qualified businesses</Text>
                </View>
              </View>
            </View>
          </>
        ) : (activeTab === 'lend') ? (
          <>
            {/* Lending Stats */}
            <View style={styles.lendingStats}>
              <View style={styles.statCard}>
                <DollarSign size={24} color="#0C7C59" />
                <Text style={styles.statValue}>R 12,450</Text>
                <Text style={styles.statLabel}>Currently Lent</Text>
              </View>
              <View style={styles.statCard}>
                <Award size={24} color="#F1C40F" />
                <Text style={styles.statValue}>15.2%</Text>
                <Text style={styles.statLabel}>Avg Return</Text>
              </View>
              <View style={styles.statCard}>
                <Shield size={24} color="#3498DB" />
                <Text style={styles.statValue}>98.5%</Text>
                <Text style={styles.statLabel}>Repayment Rate</Text>
              </View>
            </View>

            {/* Lending Opportunities */}
            <View style={styles.opportunitiesContainer}>
              <Text style={styles.sectionTitle}>Lending Opportunities</Text>
              {lendingOpportunities.map((opportunity) => (
                <View key={opportunity.id} style={styles.opportunityCard}>
                  <View style={styles.opportunityHeader}>
                    <View>
                      <Text style={styles.borrowerType}>{opportunity.borrower}</Text>
                      <Text style={styles.loanPurpose}>{opportunity.purpose}</Text>
                    </View>
                    <View style={[styles.riskBadge, { backgroundColor: getRiskColor(opportunity.risk) + '20' }]}>
                      <Text style={[styles.riskText, { color: getRiskColor(opportunity.risk) }]}>
                        {opportunity.risk} Risk
                      </Text>
                    </View>
                  </View>
                  <View style={styles.opportunityDetails}>
                    <Text style={styles.loanAmount}>R {opportunity.amount.toLocaleString()}</Text>
                    <Text style={styles.returnRate}>{opportunity.interestRate}% return</Text>
                  </View>
                  <View style={styles.creditInfo}>
                    <Text style={styles.creditLabel}>Credit Score: </Text>
                    <Text style={[styles.creditValue, { color: getCreditScoreColor(opportunity.creditScore) }]}>
                      {opportunity.creditScore}
                    </Text>
                    <Text style={styles.termInfo}> • {opportunity.term}</Text>
                  </View>
                  <TouchableOpacity style={styles.lendButton}>
                    <Text style={styles.lendButtonText}>Lend Money</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Risk Warning */}
            <View style={styles.riskWarning}>
              <AlertTriangle size={20} color="#E67E22" />
              <Text style={styles.warningText}>
                Lending involves risk. Only lend what you can afford to lose. All loans are facilitated through secure Hedera smart contracts with transparent, immutable records.
              </Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.semantic.background,
  },
  scrollView: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.semantic.textPrimary,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.semantic.textSecondary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 20,
    backgroundColor: Colors.semantic.border,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: Colors.semantic.surface,
    elevation: 2,
    shadowColor: Colors.semantic.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.semantic.textSecondary,
  },
  activeTabText: {
    color: Colors.semantic.primary,
  },
  creditScoreCard: {
    backgroundColor: Colors.semantic.surface,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: Colors.semantic.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  creditScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  creditScoreLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.semantic.textSecondary,
  },
  creditScoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  creditScoreIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditScoreDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.semantic.textSecondary,
    marginBottom: 12,
  },
  creditFactors: {
    gap: 8,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  factorText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#1C1C1E',
  },
  applicationContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  amountInputContainer: {
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0C7C59',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    paddingVertical: 16,
  },
  applyButton: {
    backgroundColor: '#0C7C59',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  offersContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  offerCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  offerAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0C7C59',
  },
  lenderInfo: {
    alignItems: 'flex-end',
  },
  lenderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  lenderRating: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
  },
  offerDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  selectOfferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 16,
  },
  selectOfferText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C7C59',
  },
  lendingStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  statCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    height: 110,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '400',
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
  },
  opportunitiesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  opportunityCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  opportunityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  borrowerType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  loanPurpose: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 2,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600',
  },
  opportunityDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loanAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0C7C59',
  },
  returnRate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1C40F',
  },
  creditInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  creditLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
  },
  creditValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  termInfo: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
  },
  lendButton: {
    backgroundColor: '#0C7C59',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  lendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  riskWarning: {
    flexDirection: 'row',
    backgroundColor: '#FDF2E9',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: '#E67E22',
    lineHeight: 20,
  },
  businessMetricsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C7C59',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
    textAlign: 'center',
  },
  businessCreditScore: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 8,
  },
  businessCreditLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C7C59',
  },
  businessCreditValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  businessLoanDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 16,
  },
  businessOfferCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#0C7C59',
  },
  requirementText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  businessBenefitsContainer: {
    backgroundColor: '#E8F5E8',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C7C59',
    marginBottom: 12,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#0C7C59',
    flex: 1,
  },
  // BNPL Styles
  bnplContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  bnplHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  bnplTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  bnplLinkContainer: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  bnplLinkContainerLeft: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bnplPlainLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bnplLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#0C7C59',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  bnplLinkButtonMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  bnplLinkText: {
    color: '#0C7C59',
    fontSize: 14,
    fontWeight: '600',
  },
  bnplLinkTextMuted: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  bnplDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 24,
    lineHeight: 20,
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
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
    paddingHorizontal: 20,
  },
  termsList: {
    gap: 16,
  },
  termsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  termsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timeRemaining: {
    fontSize: 12,
    color: '#F39C12',
    fontWeight: '500',
  },
  termsDetails: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  bnplAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bnplAmountLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  bnplAmountValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  bnplTotalAmount: {
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
  customerInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  customerLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  customerAccount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#0C7C59',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E74C3C',
  },
  rejectButtonText: {
    color: '#E74C3C',
    fontSize: 14,
    fontWeight: '600',
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
  // Custom Alert Modal Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: Colors.utility.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    minWidth: 280,
    maxWidth: 320,
    shadowColor: Colors.semantic.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.semantic.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 14,
    color: Colors.semantic.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  agreementIdContainer: {
    marginBottom: 24,
    marginTop: -12,
  },
  agreementIdLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.semantic.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  agreementIdValueContainer: {
    backgroundColor: Colors.semantic.surface,
    borderWidth: 1,
    borderColor: Colors.semantic.border,
    borderRadius: 8,
    padding: 12,
  },
  agreementIdValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: Colors.semantic.textPrimary,
    textAlign: 'center',
  },
  alertButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  alertButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.semantic.primary,
    alignItems: 'center',
  },
  alertButtonCancel: {
    backgroundColor: Colors.semantic.surface,
    borderWidth: 1,
    borderColor: Colors.semantic.border,
  },
  alertButtonDestructive: {
    backgroundColor: Colors.semantic.error,
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.utility.white,
  },
  alertButtonTextCancel: {
    color: Colors.semantic.primary,
  },
  alertButtonTextDestructive: {
    color: Colors.utility.white,
  },
  // History Modal Styles
  historyOverlay: {
    flex: 1,
    backgroundColor: Colors.utility.overlay,
    justifyContent: 'flex-end',
  },
  historyModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  historyList: {
    gap: 8,
  },
  historyContainerTight: {
    marginHorizontal: -12,
  },
  historyItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0C7C59',
  },
  historyStatus: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  historyMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  historyDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});