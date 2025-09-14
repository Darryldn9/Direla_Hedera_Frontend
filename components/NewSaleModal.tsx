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

  const slideAnim = new Animated.Value(SCREEN_HEIGHT);

  React.useEffect(() => {
    if (visible) {
      setStep(1);
      setAmount('');
      setSelectedMethod(null);
      setIsProcessing(false);
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
  };

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
      onClose();
      
      // Show success message
      Alert.alert(
        'Sale Complete!', 
        `R${saleAmount.toFixed(2)} payment processed via ${getMethodName(selectedMethod)}`
      );
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
                    <Text style={styles.amountText}>R {formatAmount(amount)}</Text>
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
                <Text style={styles.paymentAmountText}>R {formatAmount(amount)}</Text>
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
    </Modal>
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
});
