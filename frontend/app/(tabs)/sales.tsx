import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  CreditCard, 
  Link, 
  FileText, 
  ChevronRight, 
  RotateCcw,
  CheckCircle,
  FileEdit,
  AlertCircle
} from 'lucide-react-native';
import { useAccount } from '../../contexts/AccountContext';
import { useCachedTransactions } from '../../hooks/useCachedTransactions';
import { TransactionHistoryItem } from '../../types/api';
import PageHeader from '../../components/PageHeader';

export default function SalesScreen() {
  const insets = useSafeAreaInsets();
  const { selectedAccount } = useAccount();
  
  // State for showing more transactions
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(10);
  
  // Get cached transaction history for the selected account
  let { 
    transactions, 
    isLoading: isLoadingTransactions, 
    error: transactionError,
    revenue,
    isLoadingRevenue,
    revenueError,
    refreshCache: refreshTransactions,
    fetchTransactions,
    fetchRevenue
  } = useCachedTransactions(selectedAccount?.account_id);

  transactions = transactions.filter(tx => tx.to === selectedAccount?.account_id);

  const motivationalText = "Today's the day to make things happen.";

  // Calculate revenue from cached data or fetch it
  const last7DaysRevenue = useMemo(() => {
    if (revenue) {
      return revenue.totalRevenue;
    }
    
    // Fallback to calculating from transactions if revenue not available
    if (!transactions || transactions.length === 0) return 0.00;
    
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return transactions
      .filter(tx => tx.time >= sevenDaysAgo && tx.type === 'MINT')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [revenue, transactions]);

  // Fetch revenue for 7-day period when component mounts
  useEffect(() => {
    if (selectedAccount?.account_id) {
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const now = Date.now();
      fetchRevenue('weekly', sevenDaysAgo, now);
    }
  }, [selectedAccount?.account_id, fetchRevenue]);

  // Transform transaction history for display - filter for incoming transactions only
  const salesHistory = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    // Filter for incoming transactions only (MINT type)
    const incomingTransactions = transactions.filter(tx => tx.type === 'MINT');
    
    const limit = showAllTransactions ? incomingTransactions.length : displayLimit;
    return incomingTransactions.slice(0, limit).map((tx, index) => ({
      id: tx.transactionId,
      type: 'Sale', // All incoming transactions are sales
      status: 'Completed', // All transactions from Hedera are completed
      amount: tx.amount, // Incoming transactions are always positive
      icon: 'sale',
      timestamp: tx.time,
      from: tx.fromAlias || tx.from,
      to: tx.toAlias || tx.to,
      gasFee: tx.gasFee,
      currency: tx.currency
    }));
  }, [transactions, showAllTransactions, displayLimit]);

  const invoices = [
    { id: 1, title: 'Draft • Nic', status: 'draft' },
  ];

  const handleActionPress = (action: string) => {
    Alert.alert(action, `Opening ${action} functionality...`);
  };

  const handleSalesHistoryPress = () => {
    if (showAllTransactions) {
      // If showing all, collapse back to 10
      setShowAllTransactions(false);
      setDisplayLimit(10);
    } else {
      // If showing limited, show all incoming transactions
      const incomingCount = transactions?.filter(tx => tx.type === 'MINT').length || 0;
      setShowAllTransactions(true);
      setDisplayLimit(incomingCount);
    }
  };

  const handleLoadMore = () => {
    // Increase the display limit by 10 more incoming transactions
    const incomingCount = transactions?.filter(tx => tx.type === 'MINT').length || 0;
    setDisplayLimit(prev => Math.min(prev + 10, incomingCount));
  };

  const handleTransactionPress = (transaction: any) => {
    const date = new Date(transaction.timestamp).toLocaleString();
    Alert.alert(
      'Transaction Details', 
      `${transaction.type} - ${transaction.status}\n` +
      `Amount: ${transaction.currency} ${Math.abs(transaction.amount).toFixed(2)}\n` +
      `From: ${transaction.from}\n` +
      `To: ${transaction.to}\n` +
      `Date: ${date}\n` +
      `Gas Fee: ${transaction.currency} ${transaction.gasFee.toFixed(2)}`
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const handleInvoicePress = (invoice: any) => {
    Alert.alert('Invoice', `Opening ${invoice.title}...`);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 34) + 82 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <PageHeader />

        {/* Revenue Display */}
        <View style={styles.revenueContainer}>
          <Text style={styles.periodText}>Last 7 days</Text>
          <Text style={styles.revenueAmount}>
            {isLoadingRevenue || isLoadingTransactions ? '...' : `${selectedAccount?.currency} ${last7DaysRevenue.toFixed(2)}`}
          </Text>
          <Text style={styles.motivationalText}>
            {isLoadingRevenue || isLoadingTransactions ? 'Loading revenue...' : 
             revenueError ? 'Error loading revenue' : motivationalText}
          </Text>
        </View>

        {/* Action Buttons */}
        {/* <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleActionPress('Card sale')}
          >
            <CreditCard size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Card sale</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleActionPress('Payment Link')}
          >
            <Link size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Payment Link</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleActionPress('New invoice')}
          >
            <FileText size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>New invoice</Text>
          </TouchableOpacity>
        </View> */}

        {/* Sales History Section */}
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={handleSalesHistoryPress}
        >
          <Text style={styles.sectionTitle}>
            Incoming transactions {transactions && transactions.filter(tx => tx.type === 'MINT').length > 10 && 
              `(${showAllTransactions ? 'all' : '10'} of ${transactions.filter(tx => tx.type === 'MINT').length})`}
          </Text>
          <ChevronRight 
            size={20} 
            color="#8E8E93" 
            style={{ transform: [{ rotate: showAllTransactions ? '90deg' : '0deg' }] }}
          />
        </TouchableOpacity>

        {/* Transaction List */}
        <View style={styles.transactionContainer}>
          {isLoadingTransactions ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0C7C59" />
              <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
          ) : transactionError ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={20} color="#FF3B30" />
              <Text style={styles.errorText}>Failed to load transactions</Text>
              <TouchableOpacity onPress={refreshTransactions} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : salesHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Your sales will appear here</Text>
            </View>
          ) : (
            salesHistory.map((transaction) => (
              <TouchableOpacity
                key={transaction.id}
                style={styles.transactionItem}
                onPress={() => handleTransactionPress(transaction)}
              >
                <View style={styles.transactionLeft}>
                  <View style={styles.transactionIcon}>
                    {transaction.type === 'Payment' ? (
                      <RotateCcw size={16} color="#8E8E93" />
                    ) : (
                      <CheckCircle size={16} color="#0C7C59" />
                    )}
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionType}>{transaction.type}</Text>
                    <Text style={styles.transactionStatus}>{transaction.status}</Text>
                    <Text style={styles.transactionTime}>{formatDate(transaction.timestamp)}</Text>
                  </View>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: transaction.amount < 0 ? '#FF3B30' : '#1C1C1E' }
                ]}>
                  {transaction.amount < 0 ? '-' : '+'}{transaction.currency} {Math.abs(transaction.amount).toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))
          )}
          
          {/* Load More Button - only show if there are more transactions and not showing all */}
          {!showAllTransactions && transactions && transactions.filter(tx => tx.type === 'MINT').length > displayLimit && (
            <TouchableOpacity 
              style={styles.loadMoreButton}
              onPress={handleLoadMore}
            >
              <Text style={styles.loadMoreText}>
                Load more ({transactions.filter(tx => tx.type === 'MINT').length - displayLimit} remaining)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Invoices Section */}
        <View style={styles.invoicesSection}>
          <Text style={styles.sectionTitle}>Invoices</Text>
          
          {invoices.map((invoice) => (
            <TouchableOpacity
              key={invoice.id}
              style={styles.invoiceItem}
              onPress={() => handleInvoicePress(invoice)}
            >
              <View style={styles.invoiceLeft}>
                <View style={styles.invoiceIcon}>
                  <FileEdit size={16} color="#8E8E93" />
                </View>
                <Text style={styles.invoiceTitle}>{invoice.title}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7', // iOS-like light gray (same as Hub)
  },
  scrollView: {
    flex: 1,
  },
  revenueContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: '#F5F5F7',
  },
  periodText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
  },
  revenueAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  motivationalText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#8E8E93',
    textAlign: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F5F5F7',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  transactionContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 30,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  transactionStatus: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  transactionTime: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FF3B30',
  },
  retryButton: {
    backgroundColor: '#0C7C59',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
  },
  invoicesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  invoiceItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  invoiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  invoiceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  loadMoreButton: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8F9FA',
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0C7C59',
  },
});
