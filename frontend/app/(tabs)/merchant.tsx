import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChartBar as BarChart3, DollarSign, Users, TrendingUp, ShoppingCart, QrCode, Wifi, Download, FileText, Calculator, Bell, Settings } from 'lucide-react-native';
import { useAccount } from '../../contexts/AccountContext';
import { useMetrics } from '../../hooks/useMetrics';
import { useTransactionHistory } from '../../hooks/useTransactionHistory';

interface SalesData {
  period: string;
  amount: number;
  transactions: number;
}

interface RecentTransaction {
  id: string;
  customer: string;
  amount: number;
  method: string;
  timestamp: string;
  status: 'completed' | 'pending';
}

export default function MerchantScreen() {
  const [isOnline, setIsOnline] = useState(true);
  const [isAcceptingPayments, setIsAcceptingPayments] = useState(true);
  const { selectedAccount } = useAccount();
  const accountId = selectedAccount?.account_id || null;
  const { dailyRevenue, weeklySummary, monthlySummary, series, loading, error, refresh } = useMetrics(accountId);
  const { transactions } = useTransactionHistory(accountId || undefined, 10);

  const todaysRevenue = dailyRevenue?.revenue ?? 0;
  const monthlyRevenue = monthlySummary?.revenue ?? 0;
  const totalCustomers = weeklySummary?.count ?? 0; // placeholder: distinct customers metric not available yet
  const insets = useSafeAreaInsets();

  const salesData: SalesData[] = [
    { period: 'Today', amount: todaysRevenue, transactions: dailyRevenue?.count ?? 0 },
    { period: 'This Week', amount: weeklySummary?.revenue ?? 0, transactions: weeklySummary?.count ?? 0 },
    { period: 'This Month', amount: monthlySummary?.revenue ?? 0, transactions: monthlySummary?.count ?? 0 },
  ];

  const recentTransactions: RecentTransaction[] = (transactions || []).slice(0, 10).map((t, idx) => ({
    id: t.transactionId || String(idx),
    customer: t.fromAlias === (accountId || '') ? t.toAlias : t.fromAlias,
    amount: t.amount,
    method: t.type === 'RECEIVE' ? 'Incoming' : 'Outgoing',
    timestamp: new Date(t.time).toLocaleString(),
    status: 'completed',
  }));

  const handleTogglePayments = () => {
    setIsAcceptingPayments(!isAcceptingPayments);
    Alert.alert(
      'Payment Status',
      `Payment acceptance ${!isAcceptingPayments ? 'enabled' : 'disabled'}. ${!isAcceptingPayments ? 'You can now receive payments.' : 'New payments will be rejected.'}`,
    );
  };

  const generateQRCode = () => {
    Alert.alert(
      'QR Code Generated',
      'Your payment QR code has been generated. Customers can scan this code to make payments directly to your account.',
    );
  };

  const downloadReport = () => {
    Alert.alert(
      'Report Downloaded',
      'Sales report has been prepared and will be available in your downloads folder.',
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 34) + 82 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Mama Thandi's Spaza</Text>
            <Text style={styles.headerSubtitle}>Business Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Wifi size={20} color={isOnline ? '#0C7C59' : '#E74C3C'} />
              <Text style={[styles.statusText, { color: isOnline ? '#0C7C59' : '#E74C3C' }]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            <View style={styles.statusToggle}>
              <Text style={styles.toggleLabel}>Accept Payments</Text>
              <Switch
                value={isAcceptingPayments}
                onValueChange={handleTogglePayments}
                trackColor={{ false: '#E5E5E5', true: '#0C7C59' }}
                thumbColor={isAcceptingPayments ? '#FFFFFF' : '#BDC3C7'}
              />
            </View>
          </View>
        </View>

        {/* Revenue Overview */}
        <View style={styles.revenueContainer}>
          <View style={styles.revenueCard}>
            <DollarSign size={24} color="#0C7C59" />
            <Text style={styles.revenueAmount}>R {todaysRevenue.toFixed(2)}</Text>
            <Text style={styles.revenueLabel}>Today's Revenue</Text>
          </View>
          <View style={styles.revenueCard}>
            <TrendingUp size={24} color="#3498DB" />
            <Text style={styles.revenueAmount}>R {monthlyRevenue.toFixed(2)}</Text>
            <Text style={styles.revenueLabel}>This Month</Text>
          </View>
          <View style={styles.revenueCard}>
            <Users size={24} color="#9B59B6" />
            <Text style={styles.revenueAmount}>{totalCustomers}</Text>
            <Text style={styles.revenueLabel}>Total Customers</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton} onPress={generateQRCode}>
              <QrCode size={24} color="#0C7C59" />
              <Text style={styles.actionText}>Generate QR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <ShoppingCart size={24} color="#3498DB" />
              <Text style={styles.actionText}>New Sale</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Calculator size={24} color="#F1C40F" />
              <Text style={styles.actionText}>Calculator</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={downloadReport}>
              <Download size={24} color="#E67E22" />
              <Text style={styles.actionText}>Export Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sales Analytics */}
        <View style={styles.analyticsContainer}>
          <Text style={styles.sectionTitle}>Sales Analytics</Text>
          {salesData.map((data, index) => (
            <View key={index} style={styles.analyticsItem}>
              <View style={styles.analyticsInfo}>
                <Text style={styles.analyticsPeriod}>{data.period}</Text>
                <Text style={styles.analyticsTransactions}>
                  {data.transactions} transaction{data.transactions !== 1 ? 's' : ''}
                </Text>
              </View>
              <Text style={styles.analyticsAmount}>R {data.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionInfo}>
                <Text style={styles.customerName}>{transaction.customer}</Text>
                <Text style={styles.transactionDetails}>
                  {transaction.method} • {transaction.timestamp}
                </Text>
              </View>
              <View style={styles.transactionAmount}>
                <Text style={styles.amountText}>R {transaction.amount.toFixed(2)}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: transaction.status === 'completed' ? '#E8F5E8' : '#FFF3CD' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: transaction.status === 'completed' ? '#0C7C59' : '#856404' }
                  ]}>
                    {transaction.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Inventory Alerts */}
        {/* <View style={styles.alertsContainer}>
          <View style={styles.alertHeader}>
            <Bell size={20} color="#E67E22" />
            <Text style={styles.alertTitle}>Inventory Alerts</Text>
          </View>
          <View style={styles.alertItem}>
            <Text style={styles.alertText}>Coca-Cola 2L running low (3 left)</Text>
          </View>
          <View style={styles.alertItem}>
            <Text style={styles.alertText}>Bread needs restocking tomorrow</Text>
          </View>
          <TouchableOpacity style={styles.manageInventoryButton}>
            <FileText size={16} color="#0C7C59" />
            <Text style={styles.manageInventoryText}>Manage Inventory</Text>
          </TouchableOpacity>
        </View> */}

        {/* Hedera Benefits */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>⚡ Hedera Hashgraph Benefits</Text>
          <Text style={styles.benefitsDescription}>
            Your payments are processed on Hedera's enterprise-grade hashgraph network:
          </Text>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitText}>• Ultra-low, predictable fees (under $0.01 per transaction)</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitText}>• Lightning-fast settlement (3-5 seconds finality)</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitText}>• Enterprise-grade security with hashgraph consensus</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitText}>• Carbon-negative network with transparent governance</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitText}>• Immutable transaction records and smart contracts</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#0C7C59',
    paddingTop: 70,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -10,
    padding: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2C3E50',
  },
  revenueContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  revenueCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  revenueAmount: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#2C3E50',
    marginTop: 8,
  },
  revenueLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    textAlign: 'center',
    marginTop: 4,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#2C3E50',
    textAlign: 'center',
  },
  analyticsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  analyticsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  analyticsInfo: {
    flex: 1,
  },
  analyticsPeriod: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
  },
  analyticsTransactions: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    marginTop: 2,
  },
  analyticsAmount: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#0C7C59',
  },
  transactionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#0C7C59',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  transactionInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
  },
  transactionDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#0C7C59',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  alertsContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
  },
  alertItem: {
    paddingVertical: 4,
  },
  alertText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E67E22',
  },
  manageInventoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  manageInventoryText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#0C7C59',
  },
  benefitsContainer: {
    backgroundColor: '#E8F5E8',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#0C7C59',
    marginBottom: 8,
  },
  benefitsDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#0C7C59',
    marginBottom: 12,
    lineHeight: 20,
  },
  benefitItem: {
    paddingVertical: 2,
  },
  benefitText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#0C7C59',
  },
});