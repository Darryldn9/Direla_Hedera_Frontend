import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { CreditCard, Plus, Eye, EyeOff, ArrowUpRight, ArrowDownLeft, ShoppingCart, Users, Minus, Zap } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppMode } from '@/contexts/AppContext';
import VirtualCard from '@/components/VirtualCard';
import AppleWalletModal from '@/components/AppleWalletModal';
import { useUserManagement } from '@/hooks/useAuth';
import { useAccount } from '@/contexts/AccountContext';
import { useTransactionHistory } from '@/hooks/useTransactionHistory';
import { useHederaOperations } from '@/hooks/useHedera';
import { useQuote } from '@/hooks/useQuote';
import moment from 'moment';

interface Transaction {
  id: string;
  type: 'sent' | 'received' | 'topup';
  amount: number;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending';
}

function WalletScreen() {
  const [showBalance, setShowBalance] = useState(true);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { mode } = useAppMode();
  const insets = useSafeAreaInsets();

  const { currentUser } = useUserManagement();

  const { selectedAccount, debugState } = useAccount();
  const { getMultiCurrencyBalance } = useHederaOperations();
  const { generateQuote } = useQuote();
  const accountId = useMemo(() => selectedAccount?.account_id, [selectedAccount?.account_id]);

  // Fetch transaction history for the selected account
  const {
    transactions: hederaTransactions,
    isLoading: isLoadingTransactions,
    error: transactionError,
    refresh: refreshTransactions,
    lastUpdated: transactionLastUpdated
  } = useTransactionHistory(accountId, 10);

  // State for live balance
  const [liveBalance, setLiveBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  
  // State for converted transactions
  const [convertedTransactions, setConvertedTransactions] = useState<Array<{
    transaction: any;
    displayAmount: number;
    displayCurrency: string;
  }>>([]);

  // Fetch live balance function using the existing multicurrency system
  const fetchLiveBalance = async () => {
    if (!selectedAccount?.account_id) {
      setLiveBalance(0);
      setBalanceLoading(false);
      return;
    }

    setBalanceLoading(true);
    try {
      const balance = await getMultiCurrencyBalance(selectedAccount.account_id);
      if (balance && balance.balances && balance.balances.length > 0) {
        // Find the balance for the account's currency from the database
        const accountCurrency = selectedAccount.currency || 'HBAR';
        const currencyBalance = balance.balances.find(b => b.code === accountCurrency);
        
        if (currencyBalance) {
          setLiveBalance(currencyBalance.amount);
        } else {
          // Fallback to HBAR if account currency not found
          const hbarBalance = balance.balances.find(b => b.code === 'HBAR');
          setLiveBalance(hbarBalance?.amount ?? 0);
        }
      } else {
        setLiveBalance(0);
      }
    } catch (error) {
      console.error('Error fetching live balance:', error);
      setLiveBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  };

  // Fetch live balance when account changes
  useEffect(() => {
    fetchLiveBalance();
  }, [selectedAccount?.account_id]);

  // Convert transactions when they change
  useEffect(() => {
    const convertTransactions = async () => {
      if (!hederaTransactions.length || !selectedAccount?.currency) {
        setConvertedTransactions([]);
        return;
      }

      const accountCurrency = selectedAccount.currency;
      const filteredTransactions = hederaTransactions.filter(transaction => 
        transaction.currency !== 'HBAR'
      );

      const converted = await Promise.all(
        filteredTransactions.map(async (transaction) => {
          const converted = await convertTransactionAmount(
            transaction.amount,
            transaction.currency,
            accountCurrency
          );
          return {
            transaction,
            displayAmount: converted.amount,
            displayCurrency: converted.currency
          };
        })
      );

      setConvertedTransactions(converted);
    };

    convertTransactions();
  }, [hederaTransactions, selectedAccount?.currency, accountId]);

  // Function to convert transaction amount to account currency
  const convertTransactionAmount = async (amount: number, fromCurrency: string, toCurrency: string): Promise<{ amount: number; currency: string }> => {
    if (fromCurrency === toCurrency) {
      return { amount, currency: fromCurrency };
    }

    try {
      // Use the existing quote system to get exchange rate
      const quote = await generateQuote({
        fromAccountId: accountId || '',
        toAccountId: accountId || '', // Same account for conversion
        amount: amount,
        fromCurrency: fromCurrency,
        toCurrency: toCurrency
      });

      if (quote) {
        return {
          amount: quote.toAmount,
          currency: toCurrency
        };
      }
    } catch (error) {
      console.warn('Failed to convert currency, showing original:', error);
    }

    // Fallback to original amount if conversion fails
    return { amount, currency: fromCurrency };
  };

  const balance = liveBalance ?? 0;
  
  // Console log loading and error states
  useEffect(() => {
    if (isLoadingTransactions) {
      console.log('Loading transaction history...');
    }
    if (transactionError) {
      console.error('Transaction history error:', transactionError);
    }
  }, [isLoadingTransactions, transactionError]);

  // Mode-aware data
  const businessName = "Mama Thandi's Spaza Shop";
  const personalName = "Nomsa Khumalo";
  const userInitials = "NK"; // For consumer mode
  const businessInitials = "MT"; // For business mode
  
  const cardNumber = '4532 1234 5678 9012';
  const holderName = mode === 'business' ? 'Mama Thandi' : 'Nomsa Khumalo';
  const expiryDate = '12/28';


  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sent':
        return <ArrowUpRight size={20} color="#E74C3C" />;
      case 'received':
        return <ArrowDownLeft size={20} color="#0C7C59" />;
      case 'topup':
        return <Zap size={20} color="#3498DB" />;
      case 'burn':
        return <Minus size={20} color="#F39C12" />;
      default:
        return <ShoppingCart size={20} color="#7F8C8D" />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} edges={[]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 34) + 82 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Consistent with other pages */}
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
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.pageTitle}>Wallet</Text>
              <Text style={styles.pageSubtitle}>Your digital wallet powered by Hedera</Text>
            </View>
             <View style={styles.buttonRow}>
               <TouchableOpacity
                 onPress={() => {
                   fetchLiveBalance();
                   refreshTransactions();
                 }}
                 style={styles.refreshButton}
               >
                 <Text style={styles.refreshButtonText}>
                   {balanceLoading ? 'Loading...' : 'Refresh'}
                 </Text>
               </TouchableOpacity>
               <TouchableOpacity
                 onPress={debugState}
                 style={[styles.refreshButton, { backgroundColor: '#FF6B6B', marginLeft: 8 }]}
               >
                 <Text style={styles.refreshButtonText}>Debug</Text>
               </TouchableOpacity>
             </View>
          </View>
        </View>

        <View style={styles.cardContainer}>
          <VirtualCard
            balance={balance}
            currency={selectedAccount?.currency}
            cardNumber={cardNumber}
            expiryDate={expiryDate}
            holderName={holderName}
            showBalance={showBalance}
            onAddToWallet={() => setShowWalletModal(true)}
            onToggleBalance={() => setShowBalance(!showBalance)}
            isLoading={balanceLoading}
          />
        </View>

        <View style={styles.quickActions}>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <Plus size={20} color="#0C7C59" />
              </View>
              <Text style={styles.actionText}>Deposit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <ArrowUpRight size={20} color="#E74C3C" />
              </View>
              <Text style={styles.actionText}>Send</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <ArrowDownLeft size={20} color="#3498DB" />
              </View>
              <Text style={styles.actionText}>Request</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <Minus size={20} color="#F39C12" />
              </View>
              <Text style={styles.actionText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={refreshTransactions}>
              <Text style={styles.viewAllText}>
                {isLoadingTransactions ? 'Loading...' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {isLoadingTransactions ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
          ) : convertedTransactions.length > 0 ? (
            convertedTransactions.map(({ transaction, displayAmount, displayCurrency }) => {
              const getTransactionDescription = () => {
                switch (transaction.type) {
                  case 'SEND':
                    return `Sent to ${transaction.toAlias}`;
                  case 'RECEIVE':
                    return `Received from ${transaction.fromAlias}`;
                  case 'BURN':
                    return `Paid ${displayAmount.toFixed(2)} ${displayCurrency}`;
                  default:
                    return 'Transaction';
                }
              };

              const getTransactionIconType = () => {
                switch (transaction.type) {
                  case 'SEND':
                    return 'sent';
                  case 'RECEIVE':
                    return 'received';
                  case 'BURN':
                    return 'burn';
                  default:
                    return 'sent';
                }
              };

              const getAmountColor = () => {
                switch (transaction.type) {
                  case 'SEND':
                    return '#E74C3C';
                  case 'RECEIVE':
                    return '#0C7C59';
                  case 'BURN':
                    return '#F39C12';
                  default:
                    return '#7F8C8D';
                }
              };

              const getAmountPrefix = () => {
                switch (transaction.type) {
                  case 'SEND':
                    return '-';
                  case 'RECEIVE':
                    return '+';
                  case 'BURN':
                    return '-';
                  default:
                    return '';
                }
              };

              return (
                <TouchableOpacity key={transaction.transactionId} style={styles.transactionItem}>
                  <View style={styles.transactionIcon}>
                    {getTransactionIcon(getTransactionIconType())}
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDescription}>
                      {getTransactionDescription()}
                    </Text>
                    <Text style={styles.transactionTime}>
                      {moment(transaction.time).fromNow()}
                    </Text>
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text style={[
                      styles.transactionAmountText,
                      { color: getAmountColor() }
                    ]}>
                      {getAmountPrefix()}{displayAmount.toFixed(2)} {displayCurrency}
                    </Text>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: '#0C7C59' } // All transactions are completed
                    ]} />
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Your transaction history will appear here</Text>
            </View>
          )}
        </View>

        {/* Debug Section - Hedera Transaction History */}
        {hederaTransactions.length > 0 && (
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>🔍 Hedera Transaction History (Debug)</Text>
            <Text style={styles.debugText}>
              Account: {selectedAccount?.account_id}
            </Text>
            <Text style={styles.debugText}>
              Total Transactions: {hederaTransactions.length}
            </Text>
            <Text style={styles.debugText}>
              Non-HBAR Transactions: {hederaTransactions.filter(t => t.currency !== 'HBAR').length}
            </Text>
            <Text style={styles.debugText}>
              Burn Transactions: {hederaTransactions.filter(t => t.type === 'BURN').length}
            </Text>
            <Text style={styles.debugText}>
              Converted Transactions: {convertedTransactions.length}
            </Text>
            <Text style={styles.debugText}>
              Account Currency: {selectedAccount?.currency || 'HBAR'}
            </Text>
            {transactionError && (
              <Text style={styles.debugError}>Error: {transactionError}</Text>
            )}
          </View>
        )}

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.featureTitle}>Use anywhere Mastercard is accepted</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>⚡</Text>
            <Text style={styles.featureTitle}>Instant top-ups from your Direla balance</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🔒</Text>
            <Text style={styles.featureTitle}>Secured by Hedera Hashgraph technology</Text>
          </View>
        </View>

        <AppleWalletModal 
          visible={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          cardNumber={cardNumber}
          holderName={holderName}
          balance={balance}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

export default React.memo(WalletScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7', // iOS-like light gray (same as other pages)
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#0C7C59',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  cardContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  balanceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    padding: 10,
  },
  balanceToggleText: {
    marginLeft: 8,
    color: '#7F8C8D',
    fontSize: 14,
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 25,
    marginTop: -15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  features: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  featureEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  featureTitle: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
    flex: 1,
  },
  transactionsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0C7C59',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 14,
    color: '#8E8E93',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  debugSection: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
  },
  debugError: {
    fontSize: 14,
    color: '#DC3545',
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
  },
});