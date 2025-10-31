import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppMode } from '../contexts/AppContext';
import { useAccount } from '../contexts/AccountContext';
import { Bell } from 'lucide-react-native';
import NotificationModal from './NotificationModal';

interface PageHeaderProps {
  // Optional props to override default values
  businessName?: string;
  personalName?: string;
  userInitials?: string;
  businessInitials?: string;
}

export default function PageHeader({
  businessName = "",
  personalName = "",
  userInitials = "",
  businessInitials = ""
}: PageHeaderProps) {
  const { mode } = useAppMode();
  const { selectedAccount } = useAccount();
  const [showNotifications, setShowNotifications] = useState(false);

  // Get display name and initials from selected account
  const getDisplayName = () => {
    if (selectedAccount?.alias) {
      return selectedAccount.alias;
    }
    return mode === 'business' ? businessName : personalName;
  };

  const getDisplayInitials = () => {
    if (selectedAccount?.alias) {
      // Extract initials from alias (first letter of each word)
      return selectedAccount.alias
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 2); // Limit to 2 characters
    }
    return mode === 'business' ? businessInitials : userInitials;
  };

  return (
    <View style={styles.header}>
      <View style={styles.userAvatar}>
        <Text style={styles.avatarText}>
          {getDisplayInitials()}
        </Text>
      </View>
      <View style={styles.rightSection}>
        <View style={styles.businessBadge}>
          <Text style={styles.businessBadgeText}>
            {getDisplayName()}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowNotifications(true)} style={styles.bellButton}>
          <Bell size={22} color="#1C1C1E" />
        </TouchableOpacity>
      </View>
      <NotificationModal visible={showNotifications} onClose={() => setShowNotifications(false)} />
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
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  businessBadge: {
    backgroundColor: '#E8E8EA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bellButton: {
    padding: 6,
    borderRadius: 16,
  },
  businessBadgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
});
