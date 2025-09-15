import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrendingUp, Shield, Clock, Users, DollarSign, Award, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, ArrowRight } from 'lucide-react-native';
import { useAppMode } from '../../contexts/AppContext';

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

export default function LendingScreen() {
  const { mode } = useAppMode();
  const [activeTab, setActiveTab] = useState<'borrow' | 'lend' | 'business'>('borrow');
  const [loanAmount, setLoanAmount] = useState('');
  const [creditScore] = useState(742); // Based on transaction history
  const insets = useSafeAreaInsets();

  // Set default tab based on mode
  useEffect(() => {
    if (mode === 'business') {
      setActiveTab('business');
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

  // Mode-aware data (consistent with other pages)
  const businessName = "Mama Thandi's Spaza Shop";
  const personalName = "Nomsa Khumalo";
  const userInitials = "NK"; // For consumer mode
  const businessInitials = "MT"; // For business mode

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} edges={[]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 34) + 82 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Consistent with Hub/Sales/Money */}
        <View style={styles.header}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>{mode === 'business' ? businessInitials : userInitials}</Text>
          </View>
          <View style={styles.businessBadge}>
            <Text style={styles.businessBadgeText}>
              {mode === 'business' ? businessName : personalName}
            </Text>
          </View>
        </View>

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
                style={[styles.tab, activeTab === 'business' && styles.activeTab]}
                onPress={() => setActiveTab('business')}
              >
                <Text style={[styles.tabText, activeTab === 'business' && styles.activeTabText]}>
                  Business Loans
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'lend' && styles.activeTab]}
                onPress={() => setActiveTab('lend')}
              >
                <Text style={[styles.tabText, activeTab === 'lend' && styles.activeTabText]}>
                  Business Lending
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
    backgroundColor: '#F5F5F7', // iOS-like light gray (same as Hub/Sales/Money)
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#F5F5F7',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0C7C59',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  businessBadge: {
    backgroundColor: '#E8E8EA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  businessBadgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  titleContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#8E8E93',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 20,
    backgroundColor: '#E5E5E5',
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
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#0C7C59',
  },
  creditScoreCard: {
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
  creditScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  creditScoreLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
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
    color: '#8E8E93',
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
    numberOfLines: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '400',
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
    numberOfLines: 2,
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
});