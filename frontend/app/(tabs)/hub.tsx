import React, { useMemo, useState } from 'react';
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
  BarChart3, 
  DollarSign, 
  AlertTriangle, 
  Wifi, 
  ChevronRight,
  Plus 
} from 'lucide-react-native';

import NewSaleModal from '../../components/NewSaleModal';
import PageHeader from '../../components/PageHeader';
import { Colors } from '../../lib/colors';
import { useAccount } from '../../contexts/AccountContext';
import { useMetrics } from '../../hooks/useMetrics';

export default function HubScreen() {
  const insets = useSafeAreaInsets();
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const { selectedAccount } = useAccount();
  const accountId = selectedAccount?.account_id || null;
  const { dailyRevenue, monthlySummary, series, loading, error, refresh } = useMetrics(accountId);
  
  const todaysRevenue = dailyRevenue?.revenue ?? 0;
  const monthlySales = monthlySummary?.count ?? 0;
  const isOnline = true;

  const handleNewSale = () => {
    setShowNewSaleModal(true);
  };

  const handleSaleComplete = (amount: number, method: string) => {
    console.log(`Sale completed: ${amount.toFixed(2)} ${selectedAccount?.currency} via ${method}`);
    refresh();
  };

  const handleCardPress = (cardName: string) => {
    Alert.alert(cardName, `Opening ${cardName} details...`);
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

        {/* Page Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>Hub</Text>
        </View>

        {/* Most Visited Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Most visited</Text>
        </View>

        {/* Main Content Grid */}
        <View style={styles.contentContainer}>
          {/* Top Row - Today's Revenue and Inventory Alerts */}
          <View style={styles.topRow}>
            <TouchableOpacity 
              style={[styles.card, styles.revenueCard]}
              onPress={() => handleCardPress("Today's Revenue")}
            >
              <Text style={styles.cardTitle}>Today's Revenue</Text>
              <Text style={styles.largeNumber}>{todaysRevenue.toFixed(2)} {selectedAccount?.currency}</Text>
              <Text style={styles.cardSubtext}>Daily earnings</Text>
            </TouchableOpacity>

            {/* <TouchableOpacity 
              style={[styles.card, styles.alertsCard]}
              onPress={() => handleCardPress("Inventory Alerts")}
            >
              <Text style={styles.cardTitle}>Inventory Alerts</Text>
              <Text style={styles.largeNumber}>{inventoryAlerts}</Text>
              <Text style={styles.cardSubtext}>alerts</Text>
            </TouchableOpacity> */}
          </View>

          {/* Middle Row - Summary and Business Status */}
          <View style={styles.middleRow}>
            <TouchableOpacity 
              style={[styles.card, styles.summaryCard]}
              onPress={() => handleCardPress("Summary")}
            >
              <Text style={styles.cardTitle}>Summary</Text>
              <Text style={styles.largeNumber}>{monthlySales}</Text>
              <Text style={styles.cardSubtext}>Monthly Sales</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.card, styles.statusCard]}
              onPress={() => handleCardPress("Business Status")}
            >
              <Text style={styles.cardTitle}>Business Status</Text>
              <Text style={[styles.largeNumber, { color: isOnline ? '#0C7C59' : '#FF3B30' }]}>
                {isOnline ? "Online" : "Offline"}
              </Text>
              <Text style={styles.cardSubtext}>Current status</Text>
            </TouchableOpacity>
          </View>

          {/* New Sale Button */}
          <TouchableOpacity style={styles.newSaleButton} onPress={handleNewSale}>
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.newSaleButtonText}>New Sale</Text>
          </TouchableOpacity>

          {/* Reports Section */}
          <View style={styles.reportsSection}>
            <Text style={styles.reportsText}>Reports</Text>
          </View>

          {/* Sales Graph */}
          <View style={styles.graphContainer}>
            <Text style={styles.graphTitle}>Weekly Sales Overview</Text>
            <View style={styles.graphBars}>
              {(series || []).map((pt) => {
                const max = Math.max(...(series || []).map(s => s.revenue), 1);
                const height = Math.max(10, Math.round((pt.revenue / max) * 90));
                const label = pt.date.slice(5); // MM-DD
                return (
                  <View key={pt.date} style={styles.graphBar}>
                    <View style={[styles.bar, { height, backgroundColor: '#0C7C59' }]} />
                    <Text style={styles.barLabel}>{label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* New Sale Modal */}
      <NewSaleModal
        visible={showNewSaleModal}
        onClose={() => setShowNewSaleModal(false)}
        onSaleComplete={handleSaleComplete}
      />
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
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.semantic.textPrimary,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.semantic.textSecondary,
  },
  contentContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  middleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  card: {
    backgroundColor: Colors.semantic.surface,
    borderRadius: 16,
    padding: 16,
    flex: 1,
    shadowColor: Colors.semantic.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    minHeight: 120,
  },
  revenueCard: {},
  alertsCard: {},
  summaryCard: {},
  statusCard: {},
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.semantic.textSecondary,
    marginBottom: 8,
  },
  largeNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.semantic.textPrimary,
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.semantic.textSecondary,
  },
  reportsSection: {
    paddingVertical: 16,
    marginBottom: 12,
  },
  reportsText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.semantic.textPrimary,
  },
  graphContainer: {
    backgroundColor: Colors.semantic.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: -15,
    shadowColor: Colors.semantic.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.semantic.textPrimary,
    marginBottom: 20,
  },
  graphBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  graphBar: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    borderRadius: 4,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#8E8E93',
  },
  newSaleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.semantic.primary,
    marginTop: 0,
    marginBottom: 0,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newSaleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
