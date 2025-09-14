import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  CreditCard, 
  Link, 
  FileText, 
  ChevronRight, 
  RotateCcw,
  CheckCircle,
  FileEdit
} from 'lucide-react-native';

export default function SalesScreen() {
  const insets = useSafeAreaInsets();

  // Sample business data
  const businessName = "Mama Thandi's Spaza Shop";
  const userInitials = "MT";
  const last7DaysRevenue = 0.00;
  const motivationalText = "Today's the day to make things happen.";

  // Sample sales data
  const salesHistory = [
    { id: 1, type: 'Card', status: 'Approved', amount: -12.00, icon: 'card' },
    { id: 2, type: 'Card', status: 'Refunded', amount: 12.00, icon: 'refund' },
    { id: 3, type: 'Card', status: 'Approved', amount: 5.00, icon: 'card' },
  ];

  const invoices = [
    { id: 1, title: 'Draft • Nic', status: 'draft' },
  ];

  const handleActionPress = (action: string) => {
    Alert.alert(action, `Opening ${action} functionality...`);
  };

  const handleSalesHistoryPress = () => {
    Alert.alert('Sales History', 'Opening full sales history...');
  };

  const handleTransactionPress = (transaction: any) => {
    Alert.alert('Transaction Details', `${transaction.type} - ${transaction.status}: R${Math.abs(transaction.amount).toFixed(2)}`);
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
        <View style={styles.header}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
          <View style={styles.businessBadge}>
            <Text style={styles.businessBadgeText}>{businessName}</Text>
          </View>
        </View>

        {/* Revenue Display */}
        <View style={styles.revenueContainer}>
          <Text style={styles.periodText}>Last 7 days</Text>
          <Text style={styles.revenueAmount}>R{last7DaysRevenue.toFixed(2)}</Text>
          <Text style={styles.motivationalText}>{motivationalText}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
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
        </View>

        {/* Sales History Section */}
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={handleSalesHistoryPress}
        >
          <Text style={styles.sectionTitle}>Sales history</Text>
          <ChevronRight size={20} color="#8E8E93" />
        </TouchableOpacity>

        {/* Transaction List */}
        <View style={styles.transactionContainer}>
          {salesHistory.map((transaction) => (
            <TouchableOpacity
              key={transaction.id}
              style={styles.transactionItem}
              onPress={() => handleTransactionPress(transaction)}
            >
              <View style={styles.transactionLeft}>
                <View style={styles.transactionIcon}>
                  {transaction.status === 'Refunded' ? (
                    <RotateCcw size={16} color="#8E8E93" />
                  ) : (
                    <CheckCircle size={16} color="#0C7C59" />
                  )}
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionType}>{transaction.type}</Text>
                  <Text style={styles.transactionStatus}>{transaction.status}</Text>
                </View>
              </View>
              <Text style={[
                styles.transactionAmount,
                { color: transaction.amount < 0 ? '#FF3B30' : '#1C1C1E' }
              ]}>
                {transaction.amount < 0 ? '-' : ''}R{Math.abs(transaction.amount).toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))}
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
});
