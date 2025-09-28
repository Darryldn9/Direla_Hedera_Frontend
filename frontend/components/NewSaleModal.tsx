import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { 
  X, 
  ArrowLeft, 
  CreditCard, 
  Banknote, 
  Nfc, 
  QrCode, 
  MessageCircle,
  CheckCircle 
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAccount } from '../contexts/AccountContext';
import { useUserManagement } from '../hooks/useAuth';
import { usePaymentPollingWithToast } from '../hooks/usePaymentPollingWithToast';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NewSaleModalProps {
  visible: boolean;
  onClose: () => void;
  onSaleComplete: (amount: number, method: string) => void;
}

type PaymentMethod = 'card' | 'cash' | 'nfc' | 'qr' | 'whatsapp';

export default function NewSaleModal({ visible, onClose, onSaleComplete }: NewSaleModalProps) {
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Amount, Step 2: Payment
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [autoPollingStarted, setAutoPollingStarted] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const [showCongratsDialog, setShowCongratsDialog] = useState(false);
  const { selectedAccount } = useAccount();
  const { currentUser } = useUserManagement();
  
  const [congratsText, setCongratsText] = useState<{ currency: string; amount: string; from: string; completedAt: string }>({ currency: selectedAccount?.currency || 'R', amount: '0.00', from: 'customer', completedAt: '' });

  const poller = usePaymentPollingWithToast(
    selectedAccount && amount
      ? {
          toAccountId: selectedAccount.account_id,
          amount: parseFloat(amount),
          currency: selectedAccount.currency || 'ZAR',
          expectedMemoContains: selectedAccount.alias || selectedAccount.account_id,
          timeoutMs: 120000, // 2 minutes
          intervalMs: 5000, // 5 seconds
          amountTolerance: Math.max(0.01, parseFloat(amount) * 0.02), // 2% tolerance
        }
      : undefined
  );

  const pollStart = poller?.start;
  const pollCancel = poller?.cancel;
  const pollStatus = poller?.status;

  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  React.useEffect(() => {
    if (visible) {
      setStep(1);
      setAmount('');
      setSelectedMethod(null);
      setIsProcessing(false);
      setShowQRDialog(false);
      // Reset animation value before starting
      slideAnim.setValue(SCREEN_HEIGHT);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: SCREEN_HEIGHT,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [visible]);

  // Update congratsText currency when selectedAccount changes
  React.useEffect(() => {
    if (selectedAccount?.currency) {
      setCongratsText(prev => ({ ...prev, currency: selectedAccount.currency }));
    }
  }, [selectedAccount?.currency]);

  const handleNumberPress = (num: string) => {
    if (amount.length < 10) { // Limit amount length
      if (num === '00' && amount === '') return; // Don't allow 00 as first input
      setAmount(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  const handleContinueToPayment = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    setStep(2);
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    if (method === 'qr') {
      setShowQRDialog(true);
    }
  };

  // Start polling when QR dialog opens with valid inputs
  React.useEffect(() => {
    if (showQRDialog && !autoPollingStarted && pollStart && selectedAccount && amount) {
      pollStart();
      setAutoPollingStarted(true);
    }
    if (!showQRDialog && autoPollingStarted) {
      pollCancel?.();
      setAutoPollingStarted(false);
    }
  }, [showQRDialog, autoPollingStarted, pollStart, pollCancel, selectedAccount, amount]);

  // React to polling status changes
  React.useEffect(() => {
    if (!poller) return;
    if (pollStatus === 'confirmed') {
      const saleAmount = parseFloat(amount || '0');
      if (saleAmount > 0) {
        onSaleComplete(saleAmount, 'qr');
        // Show congratulations after sale is completed
        const formattedAmount = formatAmount(amount);
        const completedAt = new Date().toLocaleString();
        setCongratsText({ currency: selectedAccount?.currency || 'R', amount: formattedAmount, from: 'customer', completedAt });
        setShowCongratsDialog(true);
      }
      setShowQRDialog(false);
      setIsProcessing(false);
      setAutoPollingStarted(false);
    } else if (pollStatus === 'timeout') {
      Alert.alert('Payment timed out', 'No payment detected within 2 minutes.');
      setAutoPollingStarted(false);
    }
  }, [pollStatus]);

  const handleProcessPayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Payment Method Required', 'Please select a payment method');
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      const saleAmount = parseFloat(amount);
      onSaleComplete(saleAmount, selectedMethod);
      const formattedAmount = formatAmount(amount);
      const completedAt = new Date().toLocaleString();
      setCongratsText({ currency: selectedAccount?.currency || 'R', amount: formattedAmount, from: 'customer', completedAt });
      setShowCongratsDialog(true);
    }, 2000);
  };

  const getMethodName = (method: PaymentMethod): string => {
    switch (method) {
      case 'card': return 'Card';
      case 'cash': return 'Cash';
      case 'nfc': return 'NFC';
      case 'qr': return 'QR Code';
      case 'whatsapp': return 'WhatsApp';
      default: return 'Unknown';
    }
  };

  const formatAmount = (value: string): string => {
    if (!value) return '0.00';
    const num = parseFloat(value) / 100;
    return num.toFixed(2);
  };

  const handleClearAmount = () => {
    setAmount('');
  };

  // Generate a stable QR payload once when dialog opens
  React.useEffect(() => {
    if (showQRDialog && selectedAccount && amount) {
      const qrData = {
        toAccountId: selectedAccount.account_id,
        amount: parseFloat(amount) / 100,
        currency: selectedAccount.currency || 'R',
        accountAlias: selectedAccount.alias || `Account ${selectedAccount.account_id}`,
        memo: `Payment to ${selectedAccount.alias || selectedAccount.account_id}`,
        merchant_user_id: currentUser?.user_id,
      };
      setQrValue(JSON.stringify(qrData));
    }
    if (!showQRDialog) {
      setQrValue('');
    }
  }, [showQRDialog, selectedAccount, amount, currentUser?.user_id]);

  const PaymentMethodButton = ({ 
    method, 
    icon, 
    title, 
    section 
  }: { 
    method: PaymentMethod;
    icon: React.ReactNode;
    title: string;
    section: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.paymentMethodButton,
        selectedMethod === method && styles.paymentMethodActive
      ]}
      onPress={() => handlePaymentMethodSelect(method)}
    >
      <View style={styles.paymentMethodIcon}>
        {icon}
      </View>
      <Text style={[
        styles.paymentMethodTitle,
        selectedMethod === method && styles.paymentMethodTitleActive
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouch} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
          onStartShouldSetResponder={() => true}
          onResponderGrant={() => {}}
        >
          {/* Header */}
          <View style={styles.header}>
            {step === 2 ? (
              <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
                <ArrowLeft size={24} color="#1C1C1E" />
              </TouchableOpacity>
            ) : (
              <View style={styles.placeholder} />
            )}
            
            <Text style={styles.headerTitle}>
              {step === 1 ? 'New Sale' : 'Payment Method'}
            </Text>
            
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          {/* Step 1: Amount Entry */}
          {step === 1 && (
            <View style={styles.amountStep}>
              <View style={styles.amountDisplay}>
                <View style={styles.amountRow}>
                  <TouchableOpacity 
                    style={styles.amountTextContainer}
                    onPress={handleClearAmount}
                  >
                    <Text style={styles.amountText}>{selectedAccount?.currency || 'R'} {formatAmount(amount)}</Text>
                  </TouchableOpacity>
                  {amount && (
                    <TouchableOpacity 
                      style={styles.clearButton}
                      onPress={handleClearAmount}
                    >
                      <X size={20} color="#E74C3C" />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.amountLabel}>Sale Amount</Text>
              </View>

              {/* Numpad */}
              <View style={styles.numpad}>
                <View style={styles.numpadRow}>
                  {['1', '2', '3'].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={styles.numpadButton}
                      onPress={() => handleNumberPress(num)}
                    >
                      <Text style={styles.numpadButtonText}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.numpadRow}>
                  {['4', '5', '6'].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={styles.numpadButton}
                      onPress={() => handleNumberPress(num)}
                    >
                      <Text style={styles.numpadButtonText}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.numpadRow}>
                  {['7', '8', '9'].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={styles.numpadButton}
                      onPress={() => handleNumberPress(num)}
                    >
                      <Text style={styles.numpadButtonText}>{num}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.numpadRow}>
                  <TouchableOpacity
                    style={styles.numpadButton}
                    onPress={handleBackspace}
                  >
                    <ArrowLeft size={24} color="#E74C3C" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.numpadButton}
                    onPress={() => handleNumberPress('0')}
                  >
                    <Text style={styles.numpadButtonText}>0</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.numpadButton}
                    onPress={() => handleNumberPress('00')}
                  >
                    <Text style={styles.numpadButtonText}>00</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinueToPayment}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: Payment Methods */}
          {step === 2 && (
            <View style={styles.paymentStep}>
              <View style={styles.paymentAmountDisplay}>
                <Text style={styles.paymentAmountText}>{selectedAccount?.currency || 'R'} {formatAmount(amount)}</Text>
                <Text style={styles.paymentAmountLabel}>Amount due</Text>
              </View>

              {/* Digital Payment Methods */}
              <View style={styles.paymentSection}>
                <Text style={styles.paymentSectionTitle}>PAY WITH DIRELA</Text>
                <PaymentMethodButton
                  method="card"
                  icon={<CreditCard size={20} color="#1C1C1E" />}
                  title="Card"
                  section="digital"
                />
              </View>

              {/* Manual Recording Methods */}
              <View style={styles.paymentSection}>
                <Text style={styles.paymentSectionTitle}>RECORD PAYMENT</Text>
                <PaymentMethodButton
                  method="cash"
                  icon={<Banknote size={20} color="#1C1C1E" />}
                  title="Cash"
                  section="manual"
                />
                <PaymentMethodButton
                  method="nfc"
                  icon={<Nfc size={20} color="#1C1C1E" />}
                  title="NFC"
                  section="manual"
                />
                <PaymentMethodButton
                  method="qr"
                  icon={<QrCode size={20} color="#1C1C1E" />}
                  title="QR Code"
                  section="manual"
                />
                <PaymentMethodButton
                  method="whatsapp"
                  icon={<MessageCircle size={20} color="#1C1C1E" />}
                  title="WhatsApp"
                  section="manual"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.processButton,
                  !selectedMethod && styles.processButtonDisabled
                ]}
                onPress={handleProcessPayment}
                disabled={!selectedMethod || isProcessing}
              >
                {isProcessing ? (
                  <Text style={styles.processButtonText}>Processing...</Text>
                ) : (
                  <Text style={styles.processButtonText}>
                    {selectedMethod === 'cash' ? 'Record Sale' : 'Process Payment'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>

      {/* QR Code Dialog */}
      <Modal
        visible={showQRDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQRDialog(false)}
      >
        <View style={styles.qrOverlay}>
          <View style={styles.qrDialog}>
            <View style={styles.qrHeader}>
              <Text style={styles.qrTitle}>QR Code Payment</Text>
              <TouchableOpacity 
                onPress={() => setShowQRDialog(false)}
                style={styles.qrCloseButton}
              >
                <X size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.qrContent}>
              <View style={styles.qrCodeContainer}>
                {selectedAccount && amount && qrValue ? (
                  <QRCode
                    value={qrValue}
                    size={180}
                    color="#1C1C1E"
                    backgroundColor="#FFFFFF"
                  />
                ) : (
                  <View style={styles.qrCodePlaceholder}>
                    <QrCode size={80} color="#8E8E93" />
                    <Text style={styles.qrPlaceholderText}>QR Code will appear here</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.qrAmountDisplay}>
                <Text style={styles.qrAmountText}>{formatAmount(amount)} {selectedAccount?.currency || 'R'}</Text>
                <Text style={styles.qrAmountLabel}>Amount to be paid</Text>
              </View>
              
              {selectedAccount && (
                <View style={styles.qrAccountInfo}>
                  <Text style={styles.qrAccountLabel}>Receiving Account:</Text>
                  <Text style={styles.qrAccountId}>{selectedAccount.alias}</Text>
                </View>
              )}
              
              <Text style={styles.qrInstructions}>
                Customer should scan this QR code with their mobile payment app to complete the transaction.
              </Text>
              {/* Countdown Timer */}
              {poller && (
                <View style={{ marginTop: 12, alignItems: 'center' }}>
                  <Text style={{ color: '#8E8E93' }}>
                    Time remaining: {Math.floor((poller.remainingMs || 0) / 1000)}s
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.qrActions}>
              <TouchableOpacity
                style={styles.qrCancelButton}
                onPress={() => {
                  poller?.cancel();
                  setShowQRDialog(false);
                  setAutoPollingStarted(false);
                }}
              >
                <Text style={styles.qrCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.qrConfirmButton}
                onPress={() => {
                  // Manual override still available
                  setShowQRDialog(false);
                  handleProcessPayment();
                }}
              >
                <Text style={styles.qrConfirmButtonText}>Mark as Paid</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Congratulations Dialog */}
      <Modal
        visible={showCongratsDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCongratsDialog(false)}
      >
        <View style={styles.congratsOverlay}>
          <View style={styles.congratsDialog}>
            <Text style={styles.congratsTitle}>🎉 Congrats!</Text>
            <Text style={styles.congratsSubtitle}>You made a new sale!</Text>
            <Text style={styles.congratsAmount}>{congratsText.currency} {congratsText.amount}</Text>
            <Text style={styles.congratsDetail}>from {congratsText.from}</Text>
            <Text style={styles.congratsDetail}>completed {congratsText.completedAt}</Text>
            <TouchableOpacity
              style={styles.congratsButton}
              onPress={() => {
                setShowCongratsDialog(false);
                onClose();
              }}
            >
              <Text style={styles.congratsButtonText}>Great!</Text>
            </TouchableOpacity>
            <ConfettiRain />
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

// Simple confetti rain without external dependencies
function ConfettiRain() {
  const pieces = Array.from({ length: 25 }).map((_, idx) => idx);
  return (
    <View pointerEvents="none" style={styles.confettiContainer}>
      {pieces.map((i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </View>
  );
}

function ConfettiPiece({ index }: { index: number }) {
  const fall = React.useRef(new Animated.Value(0)).current;
  const rotate = React.useRef(new Animated.Value(0)).current;
  const left = Math.random() * 260 + 20; // within dialog width
  const size = Math.random() * 8 + 6;
  const duration = 1400 + Math.random() * 900;
  const delay = Math.random() * 400;
  const colors = ['#FF6B6B', '#FFD166', '#06D6A0', '#4D96FF', '#9B5DE5'];
  const bg = colors[index % colors.length];

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fall, { toValue: 1, duration, delay, useNativeDriver: true }),
      Animated.timing(rotate, { toValue: 1, duration, delay, useNativeDriver: true }),
    ]).start();
  }, [fall, rotate, duration, delay]);

  const translateY = fall.interpolate({ inputRange: [0, 1], outputRange: [-20, 220] });
  const rotateZ = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${Math.random() * 720 - 360}deg`] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left,
        width: size,
        height: size * 0.6,
        backgroundColor: bg,
        transform: [{ translateY }, { rotateZ }],
        borderRadius: 2,
        opacity: 0.9,
      }}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouch: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: SCREEN_HEIGHT * 0.85,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Amount Step Styles
  amountStep: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  amountDisplay: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 30,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  amountTextContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  amountText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  clearButton: {
    marginLeft: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
    textAlign: 'center',
  },
  numpad: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  numpadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  numpadButton: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  numpadButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  continueButton: {
    backgroundColor: '#0C7C59',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Payment Step Styles
  paymentStep: {
    flex: 1,
    paddingHorizontal: 20,
  },
  paymentAmountDisplay: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  paymentAmountText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  paymentAmountLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#8E8E93',
  },
  paymentSection: {
    marginBottom: 24,
  },
  paymentSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
  },
  paymentMethodActive: {
    backgroundColor: '#E8F5E8',
    borderWidth: 2,
    borderColor: '#0C7C59',
  },
  paymentMethodIcon: {
    marginRight: 16,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  paymentMethodTitleActive: {
    color: '#0C7C59',
    fontWeight: '600',
  },
  processButton: {
    backgroundColor: '#0C7C59',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  processButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  processButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // QR Code Dialog Styles
  qrOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  qrDialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  qrCloseButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrContent: {
    padding: 20,
    alignItems: 'center',
  },
  qrCodeContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  qrCodePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholderText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 12,
    textAlign: 'center',
  },
  qrAmountDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrAmountText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  qrAmountLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  qrAccountInfo: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  qrAccountLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  qrAccountId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  qrAccountAlias: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
    textAlign: 'center',
  },
  qrInstructions: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  qrActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  qrCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  qrCancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  qrConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0C7C59',
    alignItems: 'center',
  },
  qrConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Congrats Dialog
  congratsOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  congratsDialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 320,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    overflow: 'hidden',
  },
  congratsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  congratsSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#8E8E93',
  },
  congratsAmount: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: '800',
    color: '#0C7C59',
  },
  congratsDetail: {
    marginTop: 4,
    fontSize: 12,
    color: '#8E8E93',
  },
  congratsButton: {
    marginTop: 16,
    backgroundColor: '#0C7C59',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  congratsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
    overflow: 'hidden',
  },
});
