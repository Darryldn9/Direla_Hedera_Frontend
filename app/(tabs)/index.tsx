import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { CreditCard, Plus, Eye, EyeOff, ArrowUpRight, ArrowDownLeft, ShoppingCart, Users, Minus, Zap } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppMode } from '../../contexts/AppContext';
import VirtualCard from '../../components/VirtualCard';
import AppleWalletModal from '../../components/AppleWalletModal';

interface Transaction {
  id: string;
  type: 'sent' | 'received' | 'topup';
  amount: number;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending';
}

export default function WalletScreen() {
  const [showBalance, setShowBalance] = useState(true);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { mode } = useAppMode();
  const insets = useSafeAreaInsets();

  // Mode-aware data
  const businessName = "Mama Thandi's Spaza Shop";
  const personalName = "Nomsa Khumalo";
  const userInitials = "NK"; // For consumer mode
  const businessInitials = "MT"; // For business mode
  
  const balance = 2847.50;
  const cardNumber = '4532 1234 5678 9012';
  const holderName = mode === 'business' ? 'Mama Thandi' : 'Nomsa Khumalo';
  const expiryDate = '12/28';

  const recentTransactions: Transaction[] = [
    {
      id: '1',
      type: 'received',
      amount: 250.00,
      description: 'Payment from Thabo M.',
      timestamp: '2 hours ago',
      status: 'completed',
    },
    {
      id: '2',
      type: 'sent',
      amount: 85.50,
      description: 'Mama Thandi\'s Spaza',
      timestamp: '5 hours ago',
      status: 'completed',
    },
    {
      id: '3',
      type: 'topup',
      amount: 500.00,
      description: 'Wallet top-up',
      timestamp: '1 day ago',
      status: 'completed',
    },
    {
      id: '4',
      type: 'sent',
      amount: 32.75,
      description: 'WhatsApp Pay to Lerato',
      timestamp: '2 days ago',
      status: 'completed',
    },
    {
      id: '5',
      type: 'received',
      amount: 120.00,
      description: 'Business payment',
      timestamp: '3 days ago',
      status: 'completed',
    },
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sent':
        return <ArrowUpRight size={20} color="#E74C3C" />;
      case 'received':
        return <ArrowDownLeft size={20} color="#0C7C59" />;
      case 'topup':
        return <Zap size={20} color="#3498DB" />;
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
          <Text style={styles.pageTitle}>Wallet</Text>
          <Text style={styles.pageSubtitle}>Your digital wallet powered by Hedera</Text>
        </View>

        <View style={styles.cardContainer}>
          <VirtualCard 
            balance={balance} 
            cardNumber={cardNumber}
            expiryDate={expiryDate}
            holderName={holderName}
            showBalance={showBalance} 
            onAddToWallet={() => setShowWalletModal(true)}
            onToggleBalance={() => setShowBalance(!showBalance)}
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
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentTransactions.map((transaction) => (
            <TouchableOpacity key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionIcon}>
                {getTransactionIcon(transaction.type)}
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionDescription}>{transaction.description}</Text>
                <Text style={styles.transactionTime}>{transaction.timestamp}</Text>
              </View>
              <View style={styles.transactionAmount}>
                <Text style={[
                  styles.transactionAmountText,
                  { 
                    color: transaction.type === 'sent' ? '#E74C3C' : '#0C7C59' 
                  }
                ]}>
                  {transaction.type === 'sent' ? '-' : '+'}R {transaction.amount.toFixed(2)}
                </Text>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: transaction.status === 'completed' ? '#0C7C59' : '#F1C40F' }
                ]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

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
});