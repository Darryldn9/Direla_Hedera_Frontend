import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppMode } from '../contexts/AppContext';

interface PageHeaderProps {
  // Optional props to override default values
  businessName?: string;
  personalName?: string;
  userInitials?: string;
  businessInitials?: string;
}

export default function PageHeader({
  businessName = "Mama Thandi's Spaza Shop",
  personalName = "Nomsa Khumalo",
  userInitials = "NK",
  businessInitials = "MT"
}: PageHeaderProps) {
  const { mode } = useAppMode();

  return (
    <View style={styles.header}>
      <View style={styles.userAvatar}>
        <Text style={styles.avatarText}>
          {mode === 'business' ? businessInitials : userInitials}
        </Text>
      </View>
      <View style={styles.businessBadge}>
        <Text style={styles.businessBadgeText}>
          {mode === 'business' ? businessName : personalName}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
