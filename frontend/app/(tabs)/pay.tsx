import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  Linking, // Added
  Platform, // Added
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import { useAppMode } from '../../contexts/AppContext';
import { useAccount } from '../../contexts/AccountContext';
import { useUserManagement } from '../../hooks/useAuth';
import { usePaymentManager } from '../../hooks/usePayments';
import { usePaymentPollingWithToast } from '../../hooks/usePaymentPollingWithToast';
import { useToast } from '../../hooks/useToast';
import { useQuote } from '../../hooks/useQuote';
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
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
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
  fromCurrency?: string; // Sender's preferred currency
  toCurrency?: string; // Receiver's preferred currency
  quoteId?: string; // For quote-based payments
}

export default function PayScreen() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send');
  
  // Send payment states
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'whatsapp' | 'tap' | 'contacts' | null>(null);
  const [recipient, setRecipient] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Receive payment states
  const [amount, setAmount] = useState('');
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [autoPollingStarted, setAutoPollingStarted] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const [receiverCurrency, setReceiverCurrency] = useState('HBAR');
  const [senderCurrency, setSenderCurrency] = useState('HBAR');

  // State for optional features
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<QuickContact | null>(null);
  
  const [permission, requestPermission] = useCameraPermissions();
  const { mode } = useAppMode();
  const insets = useSafeAreaInsets();
  
  // Payment processing hooks
  const { selectedAccount } = useAccount();
  const { currentUser } = useUserManagement();
  const { makePayment } = usePaymentManager();
  const { showSuccess, showError, showInfo } = useToast();
  const { generateQuote, quote, isLoading: isQuoteLoading, error: quoteError } = useQuote();

  // Initialize the polling hook for receive payments
  const poller = usePaymentPollingWithToast(
    selectedAccount && amount
      ? {
          toAccountId: selectedAccount.account_id,
          amountHBAR: parseFloat(amount), // Direct HBAR input
          expectedMemoContains: selectedAccount.alias || selectedAccount.account_id,
          timeoutMs: 60000,
          intervalMs: 10000,
          amountTolerance: Math.max(0.00000001, parseFloat(amount) * 0.01),
        }
      : undefined
  );

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

  // Generate QR code data for receive payments
  useEffect(() => {
    if (showQRDialog && selectedAccount && amount) {
      const qrData: QRPaymentData = {
        toAccountId: selectedAccount.account_id,
        amount: parseFloat(amount),
        currency: receiverCurrency,
        accountAlias: selectedAccount.alias || `Account ${selectedAccount.account_id}`,
        memo: `Payment to ${selectedAccount.alias || selectedAccount.account_id}`,
        merchant_user_id: currentUser?.user_id,
        timestamp: new Date().toISOString(),
        fromCurrency: senderCurrency,
        toCurrency: receiverCurrency,
      };
      setQrValue(JSON.stringify(qrData));
    }
  }, [showQRDialog, selectedAccount, amount, currentUser?.user_id, receiverCurrency, senderCurrency]);

  // Handle polling lifecycle
  useEffect(() => {
    if (showQRDialog && !autoPollingStarted && poller?.start && selectedAccount && amount) {
      poller.start();
      setAutoPollingStarted(true);
    }
    if (!showQRDialog && autoPollingStarted) {
      poller?.cancel();
      setAutoPollingStarted(false);
    }
  }, [showQRDialog, autoPollingStarted, poller?.start, poller?.cancel, selectedAccount, amount]);

  // Handle payment confirmation
  useEffect(() => {
    if (poller?.status === 'confirmed') {
      setShowQRDialog(false);
      setAutoPollingStarted(false);
      // Handle successful payment
      onPaymentSuccess(parseFloat(amount));
    } else if (poller?.status === 'timeout') {
      Alert.alert('Payment timed out', 'No payment detected within 1 minute.');
      setAutoPollingStarted(false);
    }
  }, [poller?.status]);

  const onPaymentSuccess = (amountReceived: number) => {
    showSuccess(
      'Payment Received!',
      `Successfully received ${amountReceived.toFixed(2)} HBAR`,
      5000
    );
    setAmount('');
  };

  const generateWhatsAppPaymentLink = () => {
    if (!selectedAccount) {
      Alert.alert('No Account', 'No payment account selected. Please select an account in settings.');
      return;
    }
  
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount first');
      return;
    }
  
    const paymentAmount = parseFloat(amount);
    const merchantName = mode === 'business' ? businessName : personalName;
    const accountAlias = selectedAccount.alias || `Account ${selectedAccount.account_id}`;
    
    // Clean, professional message format (same as sendWhatsAppToContact)
    const message = `💳 Payment Request from ${merchantName}
  
  💰 Amount: ${paymentAmount.toFixed(2)} HBAR
  📝 For: Payment to ${accountAlias}
  
  🚀 EASY WAY - Tap to pay:
  https://pay.direla.app/demo-payment-link
  
  📱 MANUAL WAY - Use your Direla app or WhatsApp Bot:
  Account: ${selectedAccount.account_id}
  Amount: ${paymentAmount.toFixed(2)} HBAR
  Memo: Payment to ${accountAlias}
  
  ⏰ Request expires in 24 hours
  ⚡ Powered by Hedera TestNet`;
  
    // Create WhatsApp URL (no specific contact)
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
  
    // Try to open WhatsApp directly
    Linking.openURL(whatsappUrl)
      .catch((err) => {
        console.error('Error opening WhatsApp:', err);
        Alert.alert(
          'WhatsApp Not Found',
          'WhatsApp is not installed on this device. Please install WhatsApp to send payment requests.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open App Store',
              onPress: () => {
                const appStoreUrl = Platform.OS === 'ios'
                  ? 'https://apps.apple.com/app/whatsapp-messenger/id310633997'
                  : 'https://play.google.com/store/apps/details?id=com.whatsapp';
                Linking.openURL(appStoreUrl);
              }
            }
          ]
        );
      });
  };
  
  const sendWhatsAppToContact = (contact: QuickContact) => {
    // Add the null check here
    if (!selectedAccount) {
      Alert.alert('No Account', 'No payment account selected. Please select an account in settings.');
      return;
    }
  
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount first');
      return;
    }
  
    const paymentAmount = parseFloat(amount);
    const merchantName = mode === 'business' ? businessName : personalName;
    const accountAlias = selectedAccount.alias || `Account ${selectedAccount.account_id}`;
    
    // Clean, professional message format (same as generateWhatsAppPaymentLink)
    const message = `💳 Payment Request from ${merchantName}
  
  💰 Amount: ${paymentAmount.toFixed(2)} HBAR
  📝 For: Payment to ${accountAlias}
  
  🚀 EASY WAY - Tap to pay:
  https://pay.direla.app/demo-payment-link
  
  📱 MANUAL WAY - Use your Direla app:
  Account: ${selectedAccount.account_id}
  Amount: ${paymentAmount.toFixed(2)} HBAR
  Memo: Payment to ${accountAlias}
  
  ⏰ Request expires in 24 hours
  ⚡ Powered by Hedera TestNet`;
  
    // WhatsApp URL with specific phone number
    const whatsappUrl = `whatsapp://send?phone=${contact.phone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(message)}`;
  
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Error', 'Could not open WhatsApp for this contact.');
    });
  };
  
  const copyPaymentData = async () => {
    // Add the null check here
    if (!selectedAccount) {
      Alert.alert('No Account', 'No payment account selected. Please select an account in settings.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount first');
      return;
    }
  
    const paymentAmount = parseFloat(amount);
    const merchantName = mode === 'business' ? businessName : personalName;
    const accountAlias = selectedAccount.alias || `Account ${selectedAccount.account_id}`;
  
    // Clean format for copying (same as WhatsApp messages)
    const message = `💳 Payment Request from ${merchantName}
  
  💰 Amount: ${paymentAmount.toFixed(2)} HBAR
  📝 For: Payment to ${accountAlias}
  
  🚀 EASY WAY - Tap to pay:
  https://pay.direla.app/demo-payment-link
  
  📱 MANUAL WAY - Use your Direla app:
  Account: ${selectedAccount.account_id}
  Amount: ${paymentAmount.toFixed(2)} HBAR
  Memo: Payment to ${accountAlias}
  
  ⏰ Request expires in 24 hours
  ⚡ Powered by Hedera TestNet`;
  
    // Copy to clipboard (requires @react-native-clipboard/clipboard)
    // Clipboard.setString(message);
  
    // For now, show alert with data
    Alert.alert(
      'Payment Request Data',
      message,
      [
        { text: 'OK' }
      ]
    );
  };

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
    
    // Determine currencies
    const fromCurrency = paymentData.fromCurrency || selectedAccount.currency || 'HBAR';
    const toCurrency = paymentData.toCurrency || paymentData.currency;
    
    // Check if currencies are different and fetch quote if needed
    let quoteId: string | undefined;
    if (fromCurrency !== toCurrency) {
      showInfo(
        'Getting Quote',
        `Fetching exchange rate for ${fromCurrency} to ${toCurrency}...`,
        0
      );
      
      try {
        const quote = await generateQuote({
          fromAccountId: selectedAccount.account_id,
          toAccountId: paymentData.toAccountId,
          amount: paymentData.amount,
          fromCurrency,
          toCurrency
        });
        
        if (quote) {
          quoteId = quote.quoteId;
          showInfo(
            'Quote Received',
            `Exchange rate: 1 ${fromCurrency} = ${quote.exchangeRate.toFixed(4)} ${toCurrency}\nYou will send: ${quote.fromAmount.toFixed(2)} ${fromCurrency}\nRecipient will receive: ${quote.toAmount.toFixed(2)} ${toCurrency}`,
            5000
          );
        } else {
          showError('Quote Error', 'Failed to get exchange rate. Proceeding with payment...');
        }
      } catch (error) {
        console.error('Quote generation failed:', error);
        showError('Quote Error', 'Failed to get exchange rate. Proceeding with payment...');
      }
    }
    
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
        merchant_user_id: paymentData.merchant_user_id,
        fromCurrency,
        toCurrency,
        quoteId
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

  const handleQRCodeScanned = async ({ data }: { data: string }) => {
    setShowCamera(false);
    
    try {
      // Parse the QR code data as JSON
      const paymentData: QRPaymentData = JSON.parse(data);
      
      // Validate that it contains the expected payment fields
      if (paymentData.toAccountId && paymentData.amount && paymentData.currency) {
        // Determine currencies
        const fromCurrency = paymentData.fromCurrency || selectedAccount?.currency || 'HBAR';
        const toCurrency = paymentData.toCurrency || paymentData.currency;
        
        let confirmationMessage = `Pay ${paymentData.amount.toFixed(2)} ${paymentData.currency} to ${paymentData.accountAlias || paymentData.toAccountId}?`;
        
        // If currencies are different, fetch and show quote
        if (fromCurrency !== toCurrency && selectedAccount) {
          try {
            const quote = await generateQuote({
              fromAccountId: selectedAccount.account_id,
              toAccountId: paymentData.toAccountId,
              amount: paymentData.amount,
              fromCurrency,
              toCurrency
            });
            
            if (quote) {
              confirmationMessage = `Pay ${paymentData.amount.toFixed(2)} ${paymentData.currency} to ${paymentData.accountAlias || paymentData.toAccountId}?\n\nExchange Rate: 1 ${fromCurrency} = ${quote.exchangeRate.toFixed(4)} ${toCurrency}\nYou will send: ${quote.fromAmount.toFixed(2)} ${fromCurrency}\nRecipient will receive: ${quote.toAmount.toFixed(2)} ${toCurrency}`;
            }
          } catch (error) {
            console.error('Failed to fetch quote:', error);
            confirmationMessage += `\n\nNote: Unable to fetch exchange rate for ${fromCurrency} to ${toCurrency}. Payment will proceed with estimated conversion.`;
          }
        }
        
        // Display payment confirmation with extracted data
        Alert.alert(
          'Payment Request Detected',
          confirmationMessage,
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

  const handleQRPayment = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    setShowQRDialog(true);
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

        {/* Tab Toggle */}
        <View style={styles.tabToggleContainer}>
          <View style={styles.tabOptions}>
            <TouchableOpacity
              style={[
                styles.tabOption,
                activeTab === 'send' && styles.tabOptionActive
              ]}
              onPress={() => setActiveTab('send')}
            >
              <ArrowUpRight size={20} color={activeTab === 'send' ? '#FFFFFF' : '#0C7C59'} />
              <Text style={[
                styles.tabOptionText,
                activeTab === 'send' && styles.tabOptionTextActive
              ]}>
                Send Payment
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tabOption,
                activeTab === 'receive' && styles.tabOptionActive
              ]}
              onPress={() => setActiveTab('receive')}
            >
              <ArrowDownLeft size={20} color={activeTab === 'receive' ? '#FFFFFF' : '#0C7C59'} />
              <Text style={[
                styles.tabOptionText,
                activeTab === 'receive' && styles.tabOptionTextActive
              ]}>
                Request Payment
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Send Payment Tab Content */}
        {activeTab === 'send' && (
          <>
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
                 paymentMethod === 'tap' ? 'Ready to Tap' :
                 paymentMethod === 'qr' ? 'Scan QR Code' :
                 'Send Payment'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Receive Payment Tab Content */}
        {activeTab === 'receive' && (
          <>
            {/* Amount Input */}
            <View style={styles.receiveContainer}>
              <Text style={styles.methodsSectionTitle}>Request Payment Amount</Text>
              
              <View style={styles.amountInputContainer}>
                <DollarSign size={24} color="#0C7C59" />
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor="#BDC3C7"
                />
                <Text style={styles.currencyText}>{receiverCurrency}</Text>
              </View>

              {/* Currency Selection */}
              <View style={styles.currencySelectionContainer}>
                <Text style={styles.currencyLabel}>Receiver Currency:</Text>
                <View style={styles.currencyButtons}>
                  {['HBAR', 'USD', 'EUR', 'GBP'].map((currency) => (
                    <TouchableOpacity
                      key={currency}
                      style={[
                        styles.currencyButton,
                        receiverCurrency === currency && styles.currencyButtonSelected
                      ]}
                      onPress={() => setReceiverCurrency(currency)}
                    >
                      <Text style={[
                        styles.currencyButtonText,
                        receiverCurrency === currency && styles.currencyButtonTextSelected
                      ]}>
                        {currency}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Generate QR Button */}
              <TouchableOpacity 
                style={[styles.generateQRButton, (!amount || parseFloat(amount) <= 0) && styles.generateQRButtonDisabled]} 
                onPress={handleQRPayment}
                disabled={!amount || parseFloat(amount) <= 0}
              >
                <QrCode size={20} color="#FFFFFF" />
                <Text style={styles.generateQRButtonText}>Generate Payment QR Code</Text>
              </TouchableOpacity>

              {/* Request Methods */}
              <View style={styles.requestMethodsContainer}>
                <Text style={styles.sectionTitle}>Other Request Methods</Text>
                
                <TouchableOpacity
                  style={styles.requestMethodButton}
                  onPress={generateWhatsAppPaymentLink}
                >
                  <MessageCircle size={20} color="#25D366" />
                  <Text style={styles.requestMethodText}>Send via WhatsApp</Text>
                  <ArrowRight size={16} color="#BDC3C7" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.requestMethodButton}>
                  <Users size={20} color="#9B59B6" />
                  <Text style={styles.requestMethodText}>Send to Contacts</Text>
                  <ArrowRight size={16} color="#BDC3C7" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.requestMethodButton}>
                  <Nfc size={20} color="#3498DB" />
                  <Text style={styles.requestMethodText}>Request via NFC</Text>
                  <ArrowRight size={16} color="#BDC3C7" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Hedera Info */}
        <View style={styles.hederaInfo}>
          <Text style={styles.infoTitle}>⚡ Hedera Hashgraph</Text>
          <Text style={styles.infoText}>
            Payments are processed on Hedera's enterprise-grade hashgraph network, ensuring ultra-fast settlement (3-5 seconds), predictable low fees, and carbon-negative transactions.
          </Text>
        </View>
      </ScrollView>

      {/* QR Code Modal for Receive Payments */}
      <Modal visible={showQRDialog} transparent animationType="fade">
        <View style={styles.qrOverlay}>
          <View style={styles.qrDialog}>
            <Text style={styles.qrTitle}>Payment Request QR Code</Text>
            <View style={styles.qrCodeContainer}>
              {qrValue ? (
                <QRCode
                  value={qrValue}
                  size={180}
                  color="#1C1C1E"
                  backgroundColor="#FFFFFF"
                />
              ) : (
                <Text>Generating QR...</Text>
              )}
            </View>
            <Text style={styles.qrAmountText}>{parseFloat(amount || '0').toFixed(2)} {receiverCurrency}</Text>
            <Text style={styles.qrSubtitle}>Ask the payer to scan this QR code</Text>
            {poller && (
              <Text style={styles.countdown}>
                Time remaining: {Math.floor((poller.remainingMs || 0) / 1000)}s
              </Text>
            )}
            <TouchableOpacity
              style={styles.cancelQRButton}
              onPress={() => {
                poller?.cancel();
                setShowQRDialog(false);
                setAutoPollingStarted(false);
              }}
            >
              <Text style={styles.cancelQRButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  // Tab Toggle Styles
  tabToggleContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabOptions: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tabOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  tabOptionActive: {
    backgroundColor: '#0C7C59',
  },
  tabOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C7C59',
  },
  tabOptionTextActive: {
    color: '#FFFFFF',
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
  // Receive Payment Styles
  receiveContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  currencySelectionContainer: {
    marginBottom: 20,
  },
  currencyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  currencyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  currencyButtonSelected: {
    backgroundColor: '#0C7C59',
    borderColor: '#0C7C59',
  },
  currencyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  currencyButtonTextSelected: {
    color: '#FFFFFF',
  },
  generateQRButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C7C59',
    padding: 16,
    borderRadius: 16,
    gap: 8,
    marginBottom: 24,
  },
  generateQRButtonDisabled: {
    backgroundColor: '#BDC3C7',
    opacity: 0.6,
  },
  generateQRButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  requestMethodsContainer: {
    gap: 12,
  },
  requestMethodButton: {
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
  requestMethodText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  // QR Code Modal Styles
  qrOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrDialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    maxWidth: 300,
    width: '100%',
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 20,
    textAlign: 'center',
  },
  qrCodeContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrAmountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0C7C59',
    marginBottom: 8,
  },
  qrSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
  },
  countdown: {
    fontSize: 14,
    color: '#E74C3C',
    marginBottom: 20,
    textAlign: 'center',
  },
  cancelQRButton: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  cancelQRButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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