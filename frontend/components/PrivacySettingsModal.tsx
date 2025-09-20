import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  X, 
  Shield, 
  Eye, 
  MapPin, 
  Bell, 
  Users, 
  Database, 
  Share2, 
  Lock,
  Smartphone,
  ChevronRight,
  Info
} from 'lucide-react-native';

interface PrivacySettings {
  dataCollection: boolean;
  locationTracking: boolean;
  analyticsSharing: boolean;
  marketingCommunications: boolean;
  transactionNotifications: boolean;
  biometricData: boolean;
  thirdPartySharing: boolean;
  crashReporting: boolean;
  personalizedAds: boolean;
  activityTracking: boolean;
  contactsAccess: boolean;
  cameraAccess: boolean;
  microphoneAccess: boolean;
  storageAccess: boolean;
}

interface PrivacySettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PrivacySettingsModal({ visible, onClose }: PrivacySettingsModalProps) {
  const [settings, setSettings] = useState<PrivacySettings>({
    dataCollection: true,
    locationTracking: false,
    analyticsSharing: true,
    marketingCommunications: false,
    transactionNotifications: true,
    biometricData: true,
    thirdPartySharing: false,
    crashReporting: true,
    personalizedAds: false,
    activityTracking: true,
    contactsAccess: false,
    cameraAccess: true,
    microphoneAccess: false,
    storageAccess: true,
  });

  const updateSetting = (key: keyof PrivacySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const showInfo = (title: string, description: string) => {
    Alert.alert(title, description, [{ text: 'OK' }]);
  };

  const handleResetToDefaults = () => {
    Alert.alert(
      'Reset Privacy Settings',
      'Are you sure you want to reset all privacy settings to their default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setSettings({
              dataCollection: true,
              locationTracking: false,
              analyticsSharing: true,
              marketingCommunications: false,
              transactionNotifications: true,
              biometricData: true,
              thirdPartySharing: false,
              crashReporting: true,
              personalizedAds: false,
              activityTracking: true,
              contactsAccess: false,
              cameraAccess: true,
              microphoneAccess: false,
              storageAccess: true,
            });
            Alert.alert('Settings Reset', 'Privacy settings have been reset to defaults.');
          }
        }
      ]
    );
  };

  const handleDataDeletion = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your personal data from our servers. This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Data Deletion Requested',
              'Your data deletion request has been submitted. You will receive an email confirmation within 24 hours.'
            );
          }
        }
      ]
    );
  };

  const SettingItem = ({
    icon,
    title,
    description,
    value,
    onValueChange,
    infoTitle,
    infoDescription,
    showToggle = true,
    onPress
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    infoTitle?: string;
    infoDescription?: string;
    showToggle?: boolean;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingIcon}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <View style={styles.settingHeader}>
          <Text style={styles.settingTitle}>{title}</Text>
          {infoTitle && (
            <TouchableOpacity 
              onPress={() => showInfo(infoTitle, infoDescription || '')}
              style={styles.infoButton}
            >
              <Info size={16} color="#7F8C8D" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      {showToggle && value !== undefined && onValueChange && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#E5E5E5', true: '#0C7C59' }}
          thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
        />
      )}
      {!showToggle && (
        <ChevronRight size={20} color="#7F8C8D" />
      )}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Settings</Text>
          <TouchableOpacity onPress={handleResetToDefaults} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.description}>
            Control how your data is collected, used, and shared. You can change these settings anytime.
          </Text>

          <SectionHeader title="Data Collection & Usage" />
          
          <SettingItem
            icon={<Database size={20} color="#0C7C59" />}
            title="Data Collection"
            description="Allow collection of usage data to improve app performance"
            value={settings.dataCollection}
            onValueChange={(value) => updateSetting('dataCollection', value)}
            infoTitle="Data Collection"
            infoDescription="We collect anonymized usage data to understand how you use the app and improve your experience. This includes feature usage, error logs, and performance metrics."
          />

          <SettingItem
            icon={<MapPin size={20} color="#0C7C59" />}
            title="Location Tracking"
            description="Use location data for nearby merchants and fraud prevention"
            value={settings.locationTracking}
            onValueChange={(value) => updateSetting('locationTracking', value)}
            infoTitle="Location Tracking"
            infoDescription="Location data helps us show nearby merchants, detect suspicious activity, and provide location-based services. Your precise location is never stored permanently."
          />

          <SettingItem
            icon={<Share2 size={20} color="#0C7C59" />}
            title="Analytics Sharing"
            description="Share anonymized analytics with trusted partners"
            value={settings.analyticsSharing}
            onValueChange={(value) => updateSetting('analyticsSharing', value)}
            infoTitle="Analytics Sharing"
            infoDescription="We may share anonymized usage statistics with our partners to improve financial services. No personally identifiable information is ever shared."
          />

          <SettingItem
            icon={<Eye size={20} color="#0C7C59" />}
            title="Activity Tracking"
            description="Track app usage patterns for personalized experience"
            value={settings.activityTracking}
            onValueChange={(value) => updateSetting('activityTracking', value)}
            infoTitle="Activity Tracking"
            infoDescription="We track how you navigate through the app to provide personalized recommendations and improve the user interface."
          />

          <SectionHeader title="Communications" />

          <SettingItem
            icon={<Bell size={20} color="#3498DB" />}
            title="Marketing Communications"
            description="Receive promotional offers and product updates"
            value={settings.marketingCommunications}
            onValueChange={(value) => updateSetting('marketingCommunications', value)}
            infoTitle="Marketing Communications"
            infoDescription="Get notified about new features, special offers, and financial tips. You can unsubscribe at any time."
          />

          <SettingItem
            icon={<Bell size={20} color="#3498DB" />}
            title="Transaction Notifications"
            description="Get notified about account activity and transactions"
            value={settings.transactionNotifications}
            onValueChange={(value) => updateSetting('transactionNotifications', value)}
            infoTitle="Transaction Notifications"
            infoDescription="Receive real-time notifications about payments, deposits, withdrawals, and other account activity for security purposes."
          />

          <SectionHeader title="Data Sharing" />

          <SettingItem
            icon={<Users size={20} color="#9B59B6" />}
            title="Third-Party Sharing"
            description="Share data with verified financial partners"
            value={settings.thirdPartySharing}
            onValueChange={(value) => updateSetting('thirdPartySharing', value)}
            infoTitle="Third-Party Sharing"
            infoDescription="Allow sharing of necessary data with our verified financial partners to provide services like credit scoring, loan processing, and investment opportunities."
          />

          <SettingItem
            icon={<Database size={20} color="#9B59B6" />}
            title="Crash Reporting"
            description="Automatically send crash reports to improve stability"
            value={settings.crashReporting}
            onValueChange={(value) => updateSetting('crashReporting', value)}
            infoTitle="Crash Reporting"
            infoDescription="When the app crashes, send technical details to help us fix bugs and improve stability. No personal data is included in crash reports."
          />

          <SettingItem
            icon={<Eye size={20} color="#9B59B6" />}
            title="Personalized Ads"
            description="Show relevant advertisements based on your activity"
            value={settings.personalizedAds}
            onValueChange={(value) => updateSetting('personalizedAds', value)}
            infoTitle="Personalized Ads"
            infoDescription="Use your app activity and preferences to show more relevant advertisements. This helps us keep the app free while showing you offers that might interest you."
          />

          <SectionHeader title="Device Permissions" />

          <SettingItem
            icon={<Users size={20} color="#E67E22" />}
            title="Contacts Access"
            description="Access contacts for easy money transfers"
            value={settings.contactsAccess}
            onValueChange={(value) => updateSetting('contactsAccess', value)}
            infoTitle="Contacts Access"
            infoDescription="Access your contacts to make it easier to send money to friends and family. Contact information is never stored on our servers."
          />

          <SettingItem
            icon={<Eye size={20} color="#E67E22" />}
            title="Camera Access"
            description="Use camera for QR code scanning and document capture"
            value={settings.cameraAccess}
            onValueChange={(value) => updateSetting('cameraAccess', value)}
            infoTitle="Camera Access"
            infoDescription="Camera access is used for QR code payments, document verification, and profile photo updates. Images are processed locally when possible."
          />

          <SettingItem
            icon={<Smartphone size={20} color="#E67E22" />}
            title="Microphone Access"
            description="Use microphone for voice commands and support calls"
            value={settings.microphoneAccess}
            onValueChange={(value) => updateSetting('microphoneAccess', value)}
            infoTitle="Microphone Access"
            infoDescription="Microphone access enables voice commands and customer support calls. Audio is never recorded without your explicit consent."
          />

          <SettingItem
            icon={<Database size={20} color="#E67E22" />}
            title="Storage Access"
            description="Store transaction receipts and documents locally"
            value={settings.storageAccess}
            onValueChange={(value) => updateSetting('storageAccess', value)}
            infoTitle="Storage Access"
            infoDescription="Store receipts, statements, and other documents on your device for offline access. You control what gets stored locally."
          />

          <SectionHeader title="Security" />

          <SettingItem
            icon={<Lock size={20} color="#E74C3C" />}
            title="Biometric Data"
            description="Store biometric data locally for authentication"
            value={settings.biometricData}
            onValueChange={(value) => updateSetting('biometricData', value)}
            infoTitle="Biometric Data"
            infoDescription="Biometric data (fingerprint, face) is stored securely on your device only and never transmitted to our servers. It's used solely for app authentication."
          />

          <SectionHeader title="Data Management" />

          <SettingItem
            icon={<Database size={20} color="#E74C3C" />}
            title="Download My Data"
            description="Get a copy of all your personal data"
            showToggle={false}
            onPress={() => Alert.alert('Feature Coming Soon', 'Data export functionality will be available in the next update.')}
            infoTitle="Download My Data"
            infoDescription="Request a complete copy of all personal data we have about you in a portable format."
          />

          <SettingItem
            icon={<X size={20} color="#E74C3C" />}
            title="Delete All Data"
            description="Permanently delete all your data from our servers"
            showToggle={false}
            onPress={handleDataDeletion}
            infoTitle="Delete All Data"
            infoDescription="This will permanently delete all your personal data, transaction history, and account information. This action cannot be undone."
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              For more information about how we handle your data, please read our{' '}
              <Text style={styles.linkText}>Privacy Policy</Text> and{' '}
              <Text style={styles.linkText}>Terms of Service</Text>.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resetButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#0C7C59',
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#2C3E50',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
    flex: 1,
  },
  infoButton: {
    padding: 4,
    marginLeft: 8,
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    lineHeight: 18,
    textAlign: 'center',
  },
  linkText: {
    color: '#0C7C59',
    fontFamily: 'Inter-SemiBold',
  },
});
