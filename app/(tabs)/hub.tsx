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
  BarChart3, 
  DollarSign, 
  AlertTriangle, 
  Wifi, 
  ChevronRight,
  Plus 
} from 'lucide-react-native';

export default function HubScreen() {
  const insets = useSafeAreaInsets();
  
  // Sample business data
  const businessName = "Mama Thandi's Spaza Shop";
  const userInitials = "MT";
  const todaysRevenue = 1247.50;
  const inventoryAlerts = 3;
  const monthlySales = 142;
  const isOnline = true;

  const handleNewSale = () => {
    Alert.alert('New Sale', 'Starting new sale transaction...');
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
        <View style={styles.header}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
          <View style={styles.businessBadge}>
            <Text style={styles.businessBadgeText}>{businessName}</Text>
          </View>
        </View>

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
              <Text style={styles.largeNumber}>R {todaysRevenue.toFixed(2)}</Text>
              <Text style={styles.cardSubtext}>Daily earnings</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.card, styles.alertsCard]}
              onPress={() => handleCardPress("Inventory Alerts")}
            >
              <Text style={styles.cardTitle}>Inventory Alerts</Text>
              <Text style={styles.largeNumber}>{inventoryAlerts}</Text>
              <Text style={styles.cardSubtext}>alerts</Text>
            </TouchableOpacity>
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
              <View style={styles.graphBar}>
                <View style={[styles.bar, { height: 40, backgroundColor: '#0C7C59' }]} />
                <Text style={styles.barLabel}>Mon</Text>
              </View>
              <View style={styles.graphBar}>
                <View style={[styles.bar, { height: 60, backgroundColor: '#0C7C59' }]} />
                <Text style={styles.barLabel}>Tue</Text>
              </View>
              <View style={styles.graphBar}>
                <View style={[styles.bar, { height: 35, backgroundColor: '#0C7C59' }]} />
                <Text style={styles.barLabel}>Wed</Text>
              </View>
              <View style={styles.graphBar}>
                <View style={[styles.bar, { height: 80, backgroundColor: '#0C7C59' }]} />
                <Text style={styles.barLabel}>Thu</Text>
              </View>
              <View style={styles.graphBar}>
                <View style={[styles.bar, { height: 55, backgroundColor: '#0C7C59' }]} />
                <Text style={styles.barLabel}>Fri</Text>
              </View>
              <View style={styles.graphBar}>
                <View style={[styles.bar, { height: 70, backgroundColor: '#0C7C59' }]} />
                <Text style={styles.barLabel}>Sat</Text>
              </View>
              <View style={styles.graphBar}>
                <View style={[styles.bar, { height: 45, backgroundColor: '#0C7C59' }]} />
                <Text style={styles.barLabel}>Sun</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
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
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    shadowColor: '#000',
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
    color: '#8E8E93',
    marginBottom: 8,
  },
  largeNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
  },
  reportsSection: {
    paddingVertical: 16,
    marginBottom: 12,
  },
  reportsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  graphContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: -15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
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
    backgroundColor: '#0C7C59',
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
