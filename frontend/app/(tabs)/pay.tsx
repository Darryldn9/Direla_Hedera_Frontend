import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAppMode } from '../../contexts/AppContext';
import { useAccount } from '../../contexts/AccountContext';
import { useUserManagement } from '../../hooks/useAuth';
import { usePaymentManager } from '../../hooks/usePayments';
import { useToast } from '../../hooks/useToast';
import { ProcessPaymentWithDIDRequest } from '../../types/api';
import {
  QrCode,
  MessageCircle,
  Nfc,
  Users,
  ShoppingCart,
  Zap,
  ArrowRight,
  MapPin,
  X,
} from 'lucide-react-native';

interface QuickContact {
  id: string;
  name: string;
  phone: string;
  avatar: string;
}

interface NearbyMerchant {
  id: string;
  name: string;
  distance: string;
  category: string;
  rating: number;
}

interface QRPaymentData {
  toAccountId: string; // Backend expects 'toAccountId'
  amount: number;
  currency: string;
  accountAlias?: string;
  memo?: string; // Optional memo for transaction
  merchant_user_id?: string; // For DID logging
  timestamp: string;
}

export default function PayScreen() {
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'whatsapp' | 'tap' | 'contacts' | null>(null);
  const [recipient, setRecipient] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const { mode } = useAppMode();
  const insets = useSafeAreaInsets();
  
  // Payment processing hooks
  const { selectedAccount } = useAccount();
  const { currentUser } = useUserManagement();
  const { makePayment } = usePaymentManager();
  const { showSuccess, showError, showInfo } = useToast();

  // Mode-aware data
  const businessName = "Mama Thandi's Spaza Shop";
  const personalName = "Nomsa Khumalo";
  const userInitials = "NK"; // For consumer mode
  const businessInitials = "MT"; // For business mode

  const quickContacts: QuickContact[] = [
    { id: '1', name: 'Thabo', phone: '+27123456789', avatar: '👨🏾' },
    { id: '2', name: 'Lerato', phone: '+27123456790', avatar: '👩🏾' },
    { id: '3', name: 'Sipho', phone: '+27123456791', avatar: '👨🏾' },
    { id: '4', name: 'Nomsa', phone: '+27123456792', avatar: '👩🏾' },
  ];

  const nearbyMerchants: NearbyMerchant[] = [
    { id: '1', name: 'Mama Thandi\'s Spaza', distance: '0.2km', category: 'Groceries', rating: 4.8 },
    { id: '2', name: 'Bra Joe\'s Electronics', distance: '0.5km', category: 'Electronics', rating: 4.6 },
    { id: '3', name: 'Corner Store', distance: '0.8km', category: 'General', rating: 4.3 },
    { id: '4', name: 'Petrol Station Shop', distance: '1.2km', category: 'Fuel & Snacks', rating: 4.5 },
  ];


  const processQRPayment = async (paymentData: QRPaymentData) => {
    // Validate that we have a selected account to send from
    if (!selectedAccount) {
      Alert.alert(
        'No Account Selected',
        'Please select an account to send from in the settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Set the recipient to the account ID from QR code
    setRecipient(paymentData.toAccountId);
    setIsProcessingPayment(true);
    
    // Show processing toast
    showInfo(
      'Processing Payment',
      `Sending ${paymentData.amount.toFixed(2)} ${paymentData.currency} to ${paymentData.accountAlias || paymentData.toAccountId}`,
      0 // No auto-dismiss for processing toast
    );
    
    try {
      // Prepare payment request for backend
      const paymentRequest: ProcessPaymentWithDIDRequest = {
        fromAccountId: selectedAccount.account_id,
        toAccountId: paymentData.toAccountId,
        amount: paymentData.amount,
        memo: paymentData.memo || `Payment to ${paymentData.accountAlias || paymentData.toAccountId}`,
        merchant_user_id: paymentData.merchant_user_id
      };

      // Process the payment
      const result = await makePayment(paymentRequest);

      // console.log("[DEBUG] PAYMENT RESULT", result);
      
      if (result?.success && result.transactionId) {
        // Payment successful - show success toast
        showSuccess(
          'Payment Successful!',
          `${paymentData.amount.toFixed(2)} ${paymentData.currency} sent successfully\nTransaction ID: ${result.transactionId}`,
          5000
        );
        
        // Also show the detailed alert
        Alert.alert(
          'Payment Successful!',
          `${paymentData.amount.toFixed(2)} ${paymentData.currency} sent to ${paymentData.accountAlias || paymentData.toAccountId}\n\nTransaction ID: ${result.transactionId}\n\nTransaction processed on Hedera Hashgraph for instant settlement.`,
          [
            { text: 'OK', onPress: () => {
              setPaymentMethod(null);
              setRecipient('');
            }}
          ]
        );
      } else {
        // Payment failed - show error toast
        showError(
          'Payment Failed',
          result?.error || 'Unknown error occurred while processing payment.',
          5000
        );
        
        // Also show the detailed alert
        Alert.alert(
          'Payment Failed',
          result?.error || 'Unknown error occurred while processing payment.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      
      // Show error toast
      showError(
        'Payment Error',
        'An error occurred while processing the payment. Please try again.',
        5000
      );
      
      // Also show the detailed alert
      Alert.alert(
        'Payment Error',
        'An error occurred while processing the payment. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      Alert.alert('Error', 'Please select a payment method first');
      return;
    }

    if (paymentMethod === 'qr') {
      Alert.alert('Info', 'Please scan a QR code to proceed with payment');
      return;
    }

    // For other payment methods, we need a recipient
    if (!recipient) {
      Alert.alert('Error', 'Please enter a recipient for the payment');
      return;
    }

    // Validate that we have a selected account to send from
    if (!selectedAccount) {
      Alert.alert(
        'No Account Selected',
        'Please select an account to send from in the settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsProcessingPayment(true);

    // Show processing toast
    showInfo(
      'Processing Payment',
      `Sending payment via ${paymentMethod.toUpperCase()}`,
      0 // No auto-dismiss for processing toast
    );

    try {
      // For now, we'll treat other payment methods as transfers to the recipient
      // In a real app, you'd have different logic for each payment method
      const paymentRequest: ProcessPaymentWithDIDRequest = {
        fromAccountId: selectedAccount.account_id,
        toAccountId: recipient, // Assuming recipient is an account ID
        amount: 1.0, // Default amount - in real app, this would come from user input
        memo: `Payment via ${paymentMethod.toUpperCase()}`,
        merchant_user_id: currentUser?.user_id
      };

      const result = await makePayment(paymentRequest);
      
      if (result?.success && result.transactionId) {
        // Payment successful - show success toast
        showSuccess(
          'Payment Successful!',
          `Payment sent via ${paymentMethod.toUpperCase()}\nTransaction ID: ${result.transactionId}`,
          5000
        );
        
        // Also show the detailed alert
        Alert.alert(
          'Payment Successful!',
          `Payment sent via ${paymentMethod.toUpperCase()}\n\nTransaction ID: ${result.transactionId}\n\nTransaction processed on Hedera Hashgraph for instant settlement.`,
          [
            { text: 'OK', onPress: () => {
              setRecipient('');
              setPaymentMethod(null);
            }}
          ]
        );
      } else {
        // Payment failed - show error toast
        showError(
          'Payment Failed',
          result?.error || 'Unknown error occurred while processing payment.',
          5000
        );
        
        // Also show the detailed alert
        Alert.alert(
          'Payment Failed',
          result?.error || 'Unknown error occurred while processing payment.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      
      // Show error toast
      showError(
        'Payment Error',
        'An error occurred while processing the payment. Please try again.',
        5000
      );
      
      // Also show the detailed alert
      Alert.alert(
        'Payment Error',
        'An error occurred while processing the payment. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleQRCodeScanned = ({ data }: { data: string }) => {
    setShowCamera(false);
    
    try {
      // Parse the QR code data as JSON
      const paymentData: QRPaymentData = JSON.parse(data);
      
      // Validate that it contains the expected payment fields
      if (paymentData.toAccountId && paymentData.amount && paymentData.currency) {
        // Display payment confirmation with extracted data
        Alert.alert(
          'Payment Request Detected',
          `Pay ${paymentData.amount.toFixed(2)} ${paymentData.currency} to ${paymentData.accountAlias || paymentData.toAccountId}?`,
          [
            { 
              text: 'Cancel', 
              style: 'cancel',
              onPress: () => {
                setPaymentMethod(null);
                setRecipient('');
              }
            },
            { 
              text: 'Pay Now', 
              onPress: () => {
                processQRPayment(paymentData);
              }
            }
          ]
        );
      } else {
        // Handle invalid QR code format
        Alert.alert(
          'Invalid QR Code',
          'This QR code does not contain valid payment information.',
          [
            { text: 'OK', onPress: () => {
              setPaymentMethod(null);
              setRecipient('');
            }}
          ]
        );
      }
    } catch (error) {
      // Handle non-JSON QR codes or parsing errors
      console.error('Error parsing QR code data:', error);
      Alert.alert(
        'Invalid QR Code',
        'This QR code is not a valid payment request.',
        [
          { text: 'OK', onPress: () => {
            setPaymentMethod(null);
            setRecipient('');
          }}
        ]
      );
    }
  };

  const handleMethodSelect = async (method: 'qr' | 'whatsapp' | 'tap' | 'contacts') => {
    console.log('Method selected:', method);
    
    if (method === 'qr') {
      console.log('QR method selected, current permission:', permission?.granted);
      
      if (permission?.granted) {
        setPaymentMethod(method);
        setShowCamera(true);
        console.log('Camera should now show');
      } else {
        console.log('Requesting camera permission...');
        setRequestingPermission(true);
        try {
          const permissionResponse = await requestPermission();
          console.log('Permission response:', permissionResponse);
          
          if (permissionResponse.granted) {
            setPaymentMethod(method);
            setShowCamera(true);
            console.log('Camera should now show after permission grant');
          } else {
            Alert.alert('Camera Permission', 'Camera access is required to scan QR codes. Please enable camera access in your device settings.');
          }
        } catch (error) {
          console.error('Error requesting permission:', error);
          Alert.alert('Error', 'Failed to request camera permission');
        } finally {
          setRequestingPermission(false);
        }
      }
    } else {
      setPaymentMethod(method);
    }
  };

  const PaymentMethodButton = ({ 
    method, 
    icon, 
    title, 
    description 
  }: { 
    method: 'qr' | 'whatsapp' | 'tap' | 'contacts', 
    icon: React.ReactNode, 
    title: string, 
    description: string 
  }) => (
    <TouchableOpacity
      style={[
        styles.methodCard,
        paymentMethod === method && styles.methodCardActive
      ]}
      onPress={() => handleMethodSelect(method)}
    >
      <View style={styles.methodCardContent}>
        <View style={[
          styles.methodCardIcon,
          { backgroundColor: paymentMethod === method ? 'rgba(255, 255, 255, 0.2)' : '#F8F9FA' }
        ]}>
          {icon}
        </View>
        <Text style={[
          styles.methodCardTitle,
          paymentMethod === method && styles.methodCardTitleActive
        ]}>
          {title}
        </Text>
        <Text style={[
          styles.methodCardDescription,
          paymentMethod === method && styles.methodCardDescriptionActive
        ]}>
          {description}
        </Text>
      </View>
      {paymentMethod === method && (
        <View style={styles.methodActiveIndicator} />
      )}
    </TouchableOpacity>
  );

  if (showCamera) {
    return (
      <View style={[styles.cameraContainer, { paddingTop: insets.top }]}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={handleQRCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
        <View style={styles.cameraOverlay}>
          <TouchableOpacity
            style={styles.closeCameraButton}
            onPress={() => setShowCamera(false)}
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.scanArea} />
          <Text style={styles.scanInstructions}>
            Point your camera at a QR code to scan
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} edges={[]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 34) + 82 }}
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
          <Text style={styles.pageTitle}>Send Payment</Text>
          <Text style={styles.pageSubtitle}>Choose your payment method</Text>
        </View>

        {/* Payment Methods - 2x2 Grid */}
        <View style={styles.methodsContainer}>
          <Text style={styles.methodsSectionTitle}>Payment Methods</Text>
          
          {/* Top Row */}
          <View style={styles.methodsRow}>
            <PaymentMethodButton
              method="qr"
              icon={<QrCode size={20} color={paymentMethod === 'qr' ? '#FFFFFF' : '#0C7C59'} />}
              title={requestingPermission ? "Requesting..." : "QR Code"}
              description="Scan to pay"
            />
            <PaymentMethodButton
              method="whatsapp"
              icon={<MessageCircle size={20} color={paymentMethod === 'whatsapp' ? '#FFFFFF' : '#25D366'} />}
              title="WhatsApp"
              description="Send via chat"
            />
          </View>

          {/* Bottom Row */}
          <View style={styles.methodsRow}>
            <PaymentMethodButton
              method="tap"
              icon={<Nfc size={20} color={paymentMethod === 'tap' ? '#FFFFFF' : '#3498DB'} />}
              title="Tap to Pay"
              description="NFC payment"
            />
            <PaymentMethodButton
              method="contacts"
              icon={<Users size={20} color={paymentMethod === 'contacts' ? '#FFFFFF' : '#9B59B6'} />}
              title="Contacts"
              description="Phone number"
            />
          </View>
        </View>


        {/* Quick Contacts - Show when contacts method is selected */}
        {paymentMethod === 'contacts' && (
          <View style={styles.quickContactsContainer}>
            <Text style={styles.sectionTitle}>Quick Contacts</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.contactsList}>
                {quickContacts.map((contact) => (
                  <TouchableOpacity
                    key={contact.id}
                    style={styles.contactItem}
                    onPress={() => setRecipient(contact.phone)}
                  >
                    <Text style={styles.contactAvatar}>{contact.avatar}</Text>
                    <Text style={styles.contactName}>{contact.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            {/* Manual Phone Number Input */}
            <TextInput
              style={styles.phoneInput}
              value={recipient}
              onChangeText={setRecipient}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              placeholderTextColor="#BDC3C7"
            />
          </View>
        )}

        {/* Nearby Merchants */}
        <View style={styles.merchantsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Merchants on Direla</Text>
            <TouchableOpacity>
              <MapPin size={20} color="#0C7C59" />
            </TouchableOpacity>
          </View>
          {nearbyMerchants.map((merchant) => (
            <TouchableOpacity key={merchant.id} style={styles.merchantItem}>
              <View style={styles.merchantIcon}>
                <ShoppingCart size={20} color="#0C7C59" />
              </View>
              <View style={styles.merchantInfo}>
                <Text style={styles.merchantName}>{merchant.name}</Text>
                <Text style={styles.merchantCategory}>
                  {merchant.category} • {merchant.distance} • ⭐ {merchant.rating}
                </Text>
              </View>
              <ArrowRight size={16} color="#BDC3C7" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Bill Splitting Feature */}
        <View style={styles.billSplitContainer}>
          <TouchableOpacity style={styles.billSplitButton}>
            <Users size={20} color="#9B59B6" />
            <Text style={styles.billSplitText}>Split Bill with Friends</Text>
            <ArrowRight size={16} color="#9B59B6" />
          </TouchableOpacity>
        </View>

        {/* Payment Button */}
        <TouchableOpacity 
          style={[styles.payButton, isProcessingPayment && styles.payButtonProcessing]} 
          onPress={handlePayment}
          disabled={isProcessingPayment}
        >
          <Zap size={20} color="#FFFFFF" />
          <Text style={styles.payButtonText}>
            {isProcessingPayment ? 'Processing...' :
             paymentMethod === 'whatsapp' ? 'Send via WhatsApp' :
             paymentMethod === 'tap' ? 'Ready to Tap' :
             paymentMethod === 'qr' ? 'Scan QR Code' :
             'Send Payment'}
          </Text>
        </TouchableOpacity>

        {/* Hedera Info */}
        <View style={styles.hederaInfo}>
          <Text style={styles.infoTitle}>⚡ Hedera Hashgraph</Text>
          <Text style={styles.infoText}>
            Payments are processed on Hedera's enterprise-grade hashgraph network, ensuring ultra-fast settlement (3-5 seconds), predictable low fees, and carbon-negative transactions.
          </Text>
        </View>
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
  methodsContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  methodsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  methodsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  methodCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    minHeight: 120,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardActive: {
    backgroundColor: '#0C7C59',
    borderColor: '#0C7C59',
    shadowOpacity: 0.15,
  },
  methodCardContent: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  methodCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  methodCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
    textAlign: 'center',
  },
  methodCardTitleActive: {
    color: '#FFFFFF',
  },
  methodCardDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
    textAlign: 'center',
  },
  methodCardDescriptionActive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  methodActiveIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1C40F',
  },
  quickContactsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  contactsList: {
    flexDirection: 'row',
    gap: 16,
  },
  contactItem: {
    alignItems: 'center',
    gap: 8,
  },
  contactAvatar: {
    fontSize: 32,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F9FA',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  contactName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  phoneInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontWeight: '400',
    color: '#1C1C1E',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  merchantsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  merchantItem: {
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
  merchantIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  merchantCategory: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
  },
  billSplitContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  billSplitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  billSplitText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#9B59B6',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C7C59',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    gap: 8,
    marginBottom: 20,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  payButtonProcessing: {
    backgroundColor: '#95A5A6',
    opacity: 0.7,
  },
  hederaInfo: {
    backgroundColor: '#FFF3CD',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#856404',
    lineHeight: 20,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeCameraButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#0C7C59',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  scanInstructions: {
    position: 'absolute',
    bottom: 100,
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});