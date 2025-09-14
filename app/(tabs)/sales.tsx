import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingCart, BarChart3, Target, TrendingUp } from 'lucide-react-native';

export default function SalesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top - 10 }]} edges={[]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 34) + 82 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sales Dashboard</Text>
          <Text style={styles.headerSubtitle}>Track and manage your sales performance</Text>
        </View>

        {/* Placeholder Content */}
        <View style={styles.placeholderContainer}>
          <View style={styles.placeholderIcon}>
            <ShoppingCart size={48} color="#0C7C59" />
          </View>
          <Text style={styles.placeholderTitle}>Sales Management</Text>
          <Text style={styles.placeholderDescription}>
            This page will contain your sales analytics, performance metrics, 
            customer insights, and sales management tools.
          </Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <BarChart3 size={20} color="#3498DB" />
              <Text style={styles.featureText}>Sales Analytics</Text>
            </View>
            <View style={styles.featureItem}>
              <Target size={20} color="#E74C3C" />
              <Text style={styles.featureText}>Sales Targets</Text>
            </View>
            <View style={styles.featureItem}>
              <TrendingUp size={20} color="#27AE60" />
              <Text style={styles.featureText}>Performance Tracking</Text>
            </View>
          </View>
        </View>

        {/* Coming Soon Badge */}
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
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
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  placeholderIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  placeholderTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#2C3E50',
    marginBottom: 12,
    textAlign: 'center',
  },
  placeholderDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  featuresList: {
    alignSelf: 'stretch',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  featureText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
  },
  comingSoonBadge: {
    alignSelf: 'center',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 20,
  },
  comingSoonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#856404',
  },
});
