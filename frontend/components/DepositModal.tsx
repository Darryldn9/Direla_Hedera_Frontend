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
  ScrollView,
} from 'react-native';
import { 
  X, 
  ArrowLeft, 
  CreditCard, 
  Banknote, 
  Smartphone,
  CheckCircle 
} from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DepositModalProps {
  visible: boolean;
  onClose: () => void;
  onDepositComplete: (amount: number, method: string) => void;
}

type DepositMethod = 'card' | 'bank' | 'mobile';

export default function DepositModal({ visible, onClose, onDepositComplete }: DepositModalProps) {
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Amount, Step 2: Method
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<DepositMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const slideAnim = new Animated.Value(SCREEN_HEIGHT);

  React.useEffect(() => {
    let isMounted = true;
    
    if (visible) {
      // Reset state when modal becomes visible
      if (isMounted) {
        setStep(1);
        setAmount('');
        setSelectedMethod(null);
        setIsProcessing(false);
      }
      
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
      }).start(() => {
        // After animation completes, ensure we're reset to step 1
        if (isMounted) {
          setStep(1);
          setAmount('');
          setSelectedMethod(null);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
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

  const handleContinueToMethod = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    setStep(2);
  };

  const handleMethodSelect = (method: DepositMethod) => {
    setSelectedMethod(method);
  };

  const handleProcessDeposit = async () => {
    if (!selectedMethod) {
      Alert.alert('Deposit Method Required', 'Please select a deposit method');
      return;
    }

    setIsProcessing(true);

    // Simulate deposit processing
    setTimeout(() => {
      setIsProcessing(false);
      const depositAmount = parseFloat(amount);
      onDepositComplete(depositAmount, selectedMethod);
      onClose();
      
      // Show success message
      Alert.alert(
        'Deposit Complete!', 
        `R${depositAmount.toFixed(2)} deposited via ${getMethodName(selectedMethod)}`
      );
    }, 2000);
  };

  const getMethodName = (method: DepositMethod): string => {
    switch (method) {
      case 'card': return 'Card';
      case 'bank': return 'Bank Transfer';
      case 'mobile': return 'Mobile Money';
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

  const DepositMethodButton = ({ 
    method, 
    icon, 
    title, 
    description 
  }: { 
    method: DepositMethod;
    icon: React.ReactNode;
    title: string;
    description: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.methodButton,
        selectedMethod === method && styles.methodButtonActive
      ]}
      onPress={() => handleMethodSelect(method)}
    >
      <View style={styles.methodIcon}>
        {icon}
      </View>
      <View style={styles.methodTextContainer}>
        <Text style={[
          styles.methodTitle,
          selectedMethod === method && styles.methodTitleActive
        ]}>
          {title}
        </Text>
        <Text style={styles.methodDescription}>
          {description}
        </Text>
      </View>
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
              {step === 1 ? 'Deposit Funds' : 'Deposit Method'}
            </Text>
            
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          {/* Step 1: Amount Entry */}
          <View style={[styles.amountStep, { display: step === 1 ? 'flex' : 'none' }]}>
            <View style={styles.amountStepScroll}>
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
                <Text style={styles.amountLabel}>Deposit Amount</Text>
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
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinueToMethod}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Step 2: Deposit Methods */}
          <View style={[styles.methodStep, { display: step === 2 ? 'flex' : 'none' }]}>
            <View style={styles.methodAmountDisplay}>
              <Text style={styles.methodAmountText}>R {formatAmount(amount || '0')}</Text>
              <Text style={styles.methodAmountLabel}>Amount to deposit</Text>
            </View>

            <View style={styles.methodsContainer}>
              <DepositMethodButton
                method="card"
                icon={<CreditCard size={20} color="#1C1C1E" />}
                title="Credit/Debit Card"
                description="Instant deposit with your card"
              />
              
              <DepositMethodButton
                method="bank"
                icon={<Banknote size={20} color="#1C1C1E" />}
                title="Bank Transfer"
                description="Direct bank transfer (1-2 business days)"
              />
              
              <DepositMethodButton
                method="mobile"
                icon={<Smartphone size={20} color="#1C1C1E" />}
                title="Mobile Money"
                description="Deposit via your mobile wallet"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.processButton,
                (!selectedMethod || isProcessing) && styles.processButtonDisabled
              ]}
              onPress={handleProcessDeposit}
              disabled={!selectedMethod || isProcessing}
            >
              {isProcessing ? (
                <Text style={styles.processButtonText}>Processing...</Text>
              ) : (
                <Text style={styles.processButtonText}>Deposit Funds</Text>
              )}
            </TouchableOpacity>
          </View>
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
  amountStepScroll: {
    flex: 1,
  },
  buttonContainer: {
    paddingVertical: 20,
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
  
  // Method Step Styles
  methodStep: {
    flex: 1,
    paddingHorizontal: 20,
  },
  methodAmountDisplay: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  methodAmountText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  methodAmountLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#8E8E93',
  },
  methodsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  methodButtonActive: {
    backgroundColor: '#E8F5E8',
    borderWidth: 2,
    borderColor: '#0C7C59',
  },
  methodIcon: {
    marginRight: 16,
  },
  methodTextContainer: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  methodTitleActive: {
    color: '#0C7C59',
    fontWeight: '600',
  },
  methodDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
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