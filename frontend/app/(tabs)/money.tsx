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
  Zap, 
  ChevronRight, 
  Calendar,
  DollarSign
} from 'lucide-react-native';
import PageHeader from '../../components/PageHeader';

export default function MoneyScreen() {
  const insets = useSafeAreaInsets();

  const currentPayoutAmount = 4.34;
  const minimumPayoutAmount = 50.00;
  const isAboveMinimum = currentPayoutAmount >= minimumPayoutAmount;

  // Sample payout history
  const payoutHistory = [
    { 
      id: 1, 
      type: 'Payout', 
      date: '9 May 2024', 
      amount: 16.34, 
      fees: 35.16,
      net: 16.34 - 35.16
    },
    { 
      id: 2, 
      type: 'Instant Payout', 
      date: '8 May 2024', 
      amount: -12.45, 
      fees: 17.25,
      net: -12.45 - 17.25
    },
    { 
      id: 3, 
      type: 'Instant Payout', 
      date: '8 May 2024', 
      amount: -12.45, 
      fees: 17.25,
      net: -12.45 - 17.25
    },
  ];

  const handleInstantPayout = () => {
    if (isAboveMinimum) {
      Alert.alert('Instant Payout', 'Processing instant payout...');
    } else {
      Alert.alert(
        'Payout Unavailable', 
        `You need at least R${minimumPayoutAmount.toFixed(2)} to make a payout. Current amount: R${currentPayoutAmount.toFixed(2)}`
      );
    }
  };

  const handlePayoutsPress = () => {
    Alert.alert('Payouts', 'Opening full payout history...');
  };

  const handlePayoutItemPress = (payout: any) => {
    Alert.alert(
      'Payout Details', 
      `${payout.type}\nDate: ${payout.date}\nAmount: R${Math.abs(payout.amount).toFixed(2)}\nFees: R${payout.fees.toFixed(2)}`
    );
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

        {/* Payout Amount Display */}
        <View style={styles.payoutContainer}>
          <Text style={styles.payoutLabel}>Payout amount</Text>
          <Text style={styles.payoutAmount}>R{currentPayoutAmount.toFixed(2)}</Text>
          <Text style={styles.statusMessage}>
            {isAboveMinimum 
              ? 'Ready for payout' 
              : 'You are below the minimum payout amount'
            }
          </Text>
        </View>

        {/* Instant Payout Button */}
        <View style={styles.instantPayoutContainer}>
          <TouchableOpacity 
            style={[
              styles.instantPayoutButton,
              !isAboveMinimum && styles.instantPayoutButtonDisabled
            ]}
            onPress={handleInstantPayout}
            disabled={!isAboveMinimum}
          >
            <Zap size={20} color={isAboveMinimum ? "#0C7C59" : "#C7C7CC"} />
            <Text style={[
              styles.instantPayoutText,
              !isAboveMinimum && styles.instantPayoutTextDisabled
            ]}>
              Instant payout
            </Text>
          </TouchableOpacity>
        </View>

        {/* Payouts Section */}
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={handlePayoutsPress}
        >
          <Text style={styles.sectionTitle}>Payouts</Text>
          <ChevronRight size={20} color="#8E8E93" />
        </TouchableOpacity>

        {/* Payout History List */}
        <View style={styles.payoutContainer}>
          {payoutHistory.map((payout) => (
            <TouchableOpacity
              key={payout.id}
              style={styles.payoutItem}
              onPress={() => handlePayoutItemPress(payout)}
            >
              <View style={styles.payoutLeft}>
                <View style={styles.payoutDetails}>
                  <Text style={styles.payoutType}>{payout.type}</Text>
                  <Text style={styles.payoutDate}>{payout.date}</Text>
                </View>
              </View>
              <View style={styles.payoutRight}>
                <Text style={[
                  styles.payoutAmountText,
                  { color: payout.amount < 0 ? '#FF3B30' : '#1C1C1E' }
                ]}>
                  {payout.amount < 0 ? '-' : ''}R{Math.abs(payout.amount).toFixed(2)}
                </Text>
                <Text style={styles.payoutFees}>
                  Fees • R{payout.fees.toFixed(2)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Direla Section */}
        <View style={styles.yocoCapitalSection}>
          <Text style={styles.yocoCapitalTitle}>Direla</Text>
          
          <TouchableOpacity 
            style={styles.findOutMoreButton}
            onPress={() => Alert.alert('Find out more', 'Opening Direla information...')}
          >
            <Text style={styles.findOutMoreText}>Find out more</Text>
          </TouchableOpacity>
        </View>

        {/* Fees Section */}
        <View style={styles.feesSection}>
          <View style={styles.feesHeader}>
            <Text style={styles.feesTitle}>Fees</Text>
            <Text style={styles.feesDescription}>All the fees related to your business</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.feesButton}
            onPress={() => Alert.alert('Fees', 'Opening detailed fee breakdown...')}
          >
            <View style={styles.feesIcon}>
              <Text style={styles.percentageSymbol}>%</Text>
            </View>
          </TouchableOpacity>
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
  payoutContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: '#F5F5F7',
  },
  payoutLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
  },
  payoutAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  statusMessage: {
    fontSize: 16,
    fontWeight: '400',
    color: '#8E8E93',
    textAlign: 'center',
  },
  instantPayoutContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  instantPayoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  instantPayoutButtonDisabled: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E5E5E5',
  },
  instantPayoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C7C59',
  },
  instantPayoutTextDisabled: {
    color: '#C7C7CC',
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
  payoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F5F5F7',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  payoutLeft: {
    flex: 1,
  },
  payoutDetails: {
    flex: 1,
  },
  payoutType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  payoutDate: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
  },
  payoutRight: {
    alignItems: 'flex-end',
  },
  payoutAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  payoutFees: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
  },
  yocoCapitalSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  yocoCapitalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  findOutMoreButton: {
    alignSelf: 'flex-start',
  },
  findOutMoreText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  feesSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feesHeader: {
    flex: 1,
  },
  feesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  feesDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
    lineHeight: 20,
  },
  feesButton: {
    marginLeft: 16,
  },
  feesIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageSymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
});
