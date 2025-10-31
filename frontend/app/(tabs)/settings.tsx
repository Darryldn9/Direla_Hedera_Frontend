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
import { useKYC } from '../../hooks/useKYC';
import { router } from 'expo-router';
import PersonalInfoModal from '../../components/PersonalInfoModal';
import PaymentMethodsModal from '../../components/PaymentMethodsModal';
import TransactionHistoryModal from '../../components/TransactionHistoryModal';
import PinChangeModal from '../../components/PinChangeModal';
import PrivacySettingsModal from '../../components/PrivacySettingsModal';
import CurrencySwitchModal from '../../components/CurrencySwitchModal';
import AccountDropdown from '../../components/AccountDropdown';
import PageHeader from '../../components/PageHeader';
import { useAccount } from '../../contexts/AccountContext';
import { formatCurrency, getCurrencyInfo } from '../../utils/currency';
import React, { useState, useEffect } from 'react';
import { HederaService } from '../../services/api/hedera.service';
import { CurrencyBalance } from '../../types/api';

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
  const [showCurrencySwitch, setShowCurrencySwitch] = useState(false);
  
  // Currency balance state
  const [currencyBalances, setCurrencyBalances] = useState<CurrencyBalance[]>([]);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const hederaService = new HederaService();
  
  const { mode, setMode } = useAppMode();
  const { logout } = useUserManagement();
  const { selectedAccount, accounts, isLoading: accountsLoading } = useAccount();
  const { kycData } = useKYC();
  const insets = useSafeAreaInsets();

  // Fetch currency balances for the selected account
  const fetchCurrencyBalances = async () => {
    if (!selectedAccount?.account_id) {
      setCurrencyBalances([]);
      return;
    }

    setLoadingBalances(true);
    try {
      const response = await hederaService.getAccountBalance(selectedAccount.account_id);
      if (response.success && response.data) {
        setCurrencyBalances(response.data.balances);
      } else {
        setCurrencyBalances([]);
      }
    } catch (error) {
      console.error('Error fetching currency balances:', error);
      setCurrencyBalances([]);
    } finally {
      setLoadingBalances(false);
    }
  };

  // Load balances when account changes
  useEffect(() => {
    if (selectedAccount) {
      fetchCurrencyBalances();
    }
  }, [selectedAccount?.account_id]);

  // Get balance for a specific currency
  const getBalanceForCurrency = (currency: string): number => {
    const balance = currencyBalances.find(b => b.code === currency);
    return balance?.amount || 0;
  };

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
            subtitle={
              kycData 
                ? `${kycData.first_name || ''} ${kycData.last_name || ''}`.trim() || kycData.occupation || 'User'
                : 'Tap to add your information'
            }
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
            icon={<Globe size={18} color="#0C7C59" />}
            title="Account Currency"
            subtitle={
              selectedAccount 
                ? `${getCurrencyInfo(selectedAccount.currency).name} (${formatCurrency(getBalanceForCurrency(selectedAccount.currency), selectedAccount.currency, true)})`
                : 'Select currency for your account'
            }
            onPress={() => setShowCurrencySwitch(true)}
          />
        </View>

        {/* Security Section */}
        <SectionHeader title="Security & Privacy" />
        <View style={styles.section}>
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
        </View>

        {/* Notifications Section */}
        <SectionHeader title="Notifications" />
        <View style={styles.section}>
          <SettingItem
            icon={<Mail size={18} color="#3498DB" />}
            title="WhatsApp Notifications"
            subtitle="Receive updates via WhatsApp"
            onPress={() => Alert.alert('WhatsApp', 'WhatsApp notification settings')}
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
      
      <CurrencySwitchModal
        visible={showCurrencySwitch}
        onClose={() => setShowCurrencySwitch(false)}
        onCurrencyChanged={(currency) => {
          console.log('Currency changed to:', currency);
        }}
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