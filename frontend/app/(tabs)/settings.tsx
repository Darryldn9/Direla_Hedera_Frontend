import React, { useState } from 'react';
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
import { User, Shield, Bell, Globe, CircleHelp as HelpCircle, LogOut, CreditCard, Smartphone, Lock, Eye, FileText, Phone, Mail, ChevronRight, Users2, Building2 } from 'lucide-react-native';
import { useAppMode } from '../../contexts/AppContext';
import { useUserManagement } from '../../hooks/useAuth';
import { router } from 'expo-router';
import PersonalInfoModal from '../../components/PersonalInfoModal';
import PaymentMethodsModal from '../../components/PaymentMethodsModal';
import TransactionHistoryModal from '../../components/TransactionHistoryModal';
import PinChangeModal from '../../components/PinChangeModal';
import PrivacySettingsModal from '../../components/PrivacySettingsModal';
import AccountDropdown from '../../components/AccountDropdown';
import PageHeader from '../../components/PageHeader';
import { useAccount } from '../../contexts/AccountContext';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [offlineMode, setOfflineMode] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  
  // Modal states
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [showPinChange, setShowPinChange] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  
  const { mode, setMode } = useAppMode();
  const { logout } = useUserManagement();
  const { selectedAccount, accounts, isLoading: accountsLoading } = useAccount();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: async () => {
          await logout();
          router.push('/login');
        }}
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIcon}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || <ChevronRight size={20} color="#BDC3C7" />}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );


  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} edges={[]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 34) + 82 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Consistent with Hub/Sales/Money/Lending */}
        <PageHeader />

        {/* Page Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>Settings</Text>
          <Text style={styles.pageSubtitle}>Manage your account and preferences</Text>
        </View>

        {/* App Mode Toggle */}
        <View style={styles.modeToggleContainer}>
          <View style={styles.modeToggleHeader}>
            <Text style={styles.modeToggleTitle}>Account Type</Text>
            <Text style={styles.modeToggleSubtitle}>
              Switch between consumer and business features
            </Text>
          </View>
          <View style={styles.modeOptions}>
            <TouchableOpacity
              style={[
                styles.modeOption,
                mode === 'consumer' && styles.modeOptionActive
              ]}
              onPress={() => {
                setMode('consumer');
                router.push('/(tabs)');
              }}
            >
              <Users2 size={20} color={mode === 'consumer' ? '#FFFFFF' : '#0C7C59'} />
              <Text style={[
                styles.modeOptionText,
                mode === 'consumer' && styles.modeOptionTextActive
              ]}>
                Consumer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeOption,
                mode === 'business' && styles.modeOptionActive
              ]}
              onPress={() => {
                setMode('business');
                router.push('/(tabs)/hub');
              }}
            >
              <Building2 size={20} color={mode === 'business' ? '#FFFFFF' : '#0C7C59'} />
              <Text style={[
                styles.modeOptionText,
                mode === 'business' && styles.modeOptionTextActive
              ]}>
                Business
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Section */}
        <SectionHeader title="Profile" />
        <View style={styles.section}>
          <SettingItem
            icon={<User size={18} color="#0C7C59" />}
            title="Personal Information"
            subtitle="Nomsa Khumalo • +27 12 345 6789"
            onPress={() => setShowPersonalInfo(true)}
          />
          
          {/* Account Selection */}
          <View style={styles.accountSelectionContainer}>
            <View style={styles.accountSelectionHeader}>
              <View style={styles.accountSelectionIcon}>
                <CreditCard size={18} color="#0C7C59" />
              </View>
              <View style={styles.accountSelectionContent}>
                <Text style={styles.accountSelectionTitle}>Active Account</Text>
                <Text style={styles.accountSelectionSubtitle}>
                  {accountsLoading 
                    ? 'Loading accounts...' 
                    : accounts.length === 0 
                      ? 'No accounts available' 
                      : `Select from ${accounts.length} account${accounts.length === 1 ? '' : 's'}`
                  }
                </Text>
              </View>
            </View>
            <View style={styles.accountDropdownContainer}>
              <AccountDropdown 
                onAccountSelect={(account) => {
                  console.log('Account selected:', account?.alias || account?.account_id);
                }}
                disabled={accountsLoading || accounts.length === 0}
              />
            </View>
          </View>
          
          <SettingItem
            icon={<CreditCard size={18} color="#3498DB" />}
            title="Payment Methods"
            subtitle="Manage cards and bank accounts"
            onPress={() => setShowPaymentMethods(true)}
          />
          <SettingItem
            icon={<Eye size={18} color="#9B59B6" />}
            title="Transaction History"
            subtitle="View all your transactions"
            onPress={() => setShowTransactionHistory(true)}
          />
        </View>

        {/* Security Section */}
        <SectionHeader title="Security & Privacy" />
        <View style={styles.section}>
          <SettingItem
            icon={<Lock size={18} color="#E74C3C" />}
            title="Change PIN"
            subtitle="Update your security PIN"
            onPress={() => setShowPinChange(true)}
          />
          <SettingItem
            icon={<Smartphone size={18} color="#F39C12" />}
            title="Biometric Authentication"
            subtitle="Use fingerprint or face ID"
            rightElement={
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: '#E5E5E5', true: '#0C7C59' }}
                thumbColor={biometricEnabled ? '#FFFFFF' : '#BDC3C7'}
              />
            }
          />
          <SettingItem
            icon={<Shield size={18} color="#2ECC71" />}
            title="Privacy Settings"
            subtitle="Control data sharing and visibility"
            onPress={() => setShowPrivacySettings(true)}
          />
        </View>

        {/* Notifications Section */}
        <SectionHeader title="Notifications" />
        <View style={styles.section}>
          <SettingItem
            icon={<Bell size={18} color="#F1C40F" />}
            title="Push Notifications"
            subtitle="Get notified about transactions"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#E5E5E5', true: '#0C7C59' }}
                thumbColor={notificationsEnabled ? '#FFFFFF' : '#BDC3C7'}
              />
            }
          />
          <SettingItem
            icon={<Mail size={18} color="#3498DB" />}
            title="Email Notifications"
            subtitle="Receive updates via email"
            onPress={() => Alert.alert('Email', 'Email notification settings')}
          />
        </View>

        {/* App Settings */}
        <SectionHeader title="App Settings" />
        <View style={styles.section}>
          <SettingItem
            icon={<Globe size={18} color="#16A085" />}
            title="Language"
            subtitle="English (South Africa)"
            onPress={() => Alert.alert('Language', 'Language selection')}
          />
          <SettingItem
            icon={<Globe size={18} color="#8E44AD" />}
            title="Offline Mode"
            subtitle="Allow transactions without internet"
            rightElement={
              <Switch
                value={offlineMode}
                onValueChange={setOfflineMode}
                trackColor={{ false: '#E5E5E5', true: '#0C7C59' }}
                thumbColor={offlineMode ? '#FFFFFF' : '#BDC3C7'}
              />
            }
          />
          <SettingItem
            icon={<Globe size={18} color="#E67E22" />}
            title="Auto Sync"
            subtitle="Sync data when connected"
            rightElement={
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: '#E5E5E5', true: '#0C7C59' }}
                thumbColor={autoSync ? '#FFFFFF' : '#BDC3C7'}
              />
            }
          />
        </View>

        {/* Support Section */}
        <SectionHeader title="Support" />
        <View style={styles.section}>
          <SettingItem
            icon={<HelpCircle size={18} color="#3498DB" />}
            title="Help Center"
            subtitle="Get help and find answers"
            onPress={() => Alert.alert('Help', 'Help center functionality')}
          />
          <SettingItem
            icon={<Phone size={18} color="#27AE60" />}
            title="Contact Support"
            subtitle="Speak to our support team"
            onPress={() => Alert.alert('Support', 'Contact: +27 11 123 4567')}
          />
          <SettingItem
            icon={<FileText size={18} color="#8E8E93" />}
            title="Terms & Privacy Policy"
            subtitle="Read our terms and privacy policy"
            onPress={() => Alert.alert('Legal', 'Terms and privacy policy')}
          />
        </View>

        {/* Hedera Information */}
        <View style={styles.hederaSection}>
          <Text style={styles.hederaTitle}>⚡ Hedera Hashgraph</Text>
          <Text style={styles.hederaDescription}>
            Your payments are secured and processed through Hedera's enterprise-grade network:
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Asynchronous Byzantine Fault Tolerance (aBFT)</Text>
            <Text style={styles.featureItem}>• Predictable low fees (under $0.01 per transaction)</Text>
            <Text style={styles.featureItem}>• 3-5 second transaction finality</Text>
            <Text style={styles.featureItem}>• Carbon-negative consensus mechanism</Text>
            <Text style={styles.featureItem}>• Immutable audit trail and smart contracts</Text>
            <Text style={styles.featureItem}>• Enterprise-grade security and governance</Text>
          </View>
        </View>

        {/* App Information */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoTitle}>Direla</Text>
          <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
          <Text style={styles.appInfoDescription}>
            Bridging the digital-cash divide in South Africa
          </Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#E74C3C" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Modals */}
      <PersonalInfoModal
        visible={showPersonalInfo}
        onClose={() => setShowPersonalInfo(false)}
      />
      
      <PaymentMethodsModal
        visible={showPaymentMethods}
        onClose={() => setShowPaymentMethods(false)}
      />
      
      <TransactionHistoryModal
        visible={showTransactionHistory}
        onClose={() => setShowTransactionHistory(false)}
      />
      
      <PinChangeModal
        visible={showPinChange}
        onClose={() => setShowPinChange(false)}
      />
      
      <PrivacySettingsModal
        visible={showPrivacySettings}
        onClose={() => setShowPrivacySettings(false)}
      />
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
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 16,
    marginLeft: 20,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  settingSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 2,
  },
  hederaSection: {
    backgroundColor: '#E8F4FD',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  hederaTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2980B9',
    marginBottom: 8,
  },
  hederaDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#2980B9',
    marginBottom: 12,
    lineHeight: 20,
  },
  featureList: {
    gap: 4,
  },
  featureItem: {
    fontSize: 14,
    fontWeight: '400',
    color: '#2980B9',
  },
  appInfo: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  appInfoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0C7C59',
    marginBottom: 4,
  },
  appInfoVersion: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
    marginBottom: 8,
  },
  appInfoDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E74C3C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E74C3C',
  },
  modeToggleContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  modeToggleHeader: {
    marginBottom: 16,
  },
  modeToggleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  modeToggleSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
  },
  modeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  modeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 8,
  },
  modeOptionActive: {
    backgroundColor: '#0C7C59',
    borderColor: '#0C7C59',
  },
  modeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C7C59',
  },
  modeOptionTextActive: {
    color: '#FFFFFF',
  },
  accountSelectionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  accountSelectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountSelectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  accountSelectionContent: {
    flex: 1,
  },
  accountSelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  accountSelectionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
  },
  accountDropdownContainer: {
    marginTop: 4,
  },
});