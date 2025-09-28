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
  TextInput,
} from 'react-native';
import { 
  X, 
  ArrowLeft, 
  QrCode, 
  MessageCircle,
  Copy,
  CheckCircle 
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RequestModalProps {
  visible: boolean;
  onClose: () => void;
  onRequestComplete: (amount: number, note: string) => void;
}

export default function RequestModal({ visible, onClose, onRequestComplete }: RequestModalProps) {
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Amount & Note, Step 2: Share Options
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const slideAnim = new Animated.Value(SCREEN_HEIGHT);

  React.useEffect(() => {
    let isMounted = true;
    
    if (visible) {
      // Reset state when modal becomes visible
      if (isMounted) {
        setStep(1);
        setAmount('');
        setNote('');
        setIsProcessing(false);
        setIsCopied(false);
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
          setNote('');
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

  const handleContinueToShare = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    setStep(2);
  };

  const handleCreateRequest = async () => {
    setIsProcessing(true);
    
    // Simulate request creation
    setTimeout(() => {
      setIsProcessing(false);
      const requestAmount = parseFloat(amount);
      onRequestComplete(requestAmount, note);
    }, 1000);
  };

  const formatAmount = (value: string): string => {
    if (!value) return '0.00';
    const num = parseFloat(value) / 100;
    return num.toFixed(2);
  };

  const handleClearAmount = () => {
    setAmount('');
  };

  const copyToClipboard = async () => {
    const requestLink = `https://direla.co.za/request?amount=${amount}&note=${encodeURIComponent(note)}`;
    await Clipboard.setStringAsync(requestLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const shareViaWhatsApp = () => {
    const message = `Hi, I'm requesting R${formatAmount(amount)}${note ? ` for ${note}` : ''}. Please pay via Direla: https://direla.co.za/request?amount=${amount}&note=${encodeURIComponent(note)}`;
    Alert.alert('Share via WhatsApp', message);
  };

  const shareViaSMS = () => {
    const message = `Direla Request: R${formatAmount(amount)}${note ? ` for ${note}` : ''}. Pay: https://direla.co.za/request?amount=${amount}&note=${encodeURIComponent(note)}`;
    Alert.alert('Share via SMS', message);
  };

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
              {step === 1 ? 'Request Money' : 'Share Request'}
            </Text>
            
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          {/* Step 1: Amount & Note Entry */}
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
                <Text style={styles.amountLabel}>Request Amount</Text>
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

              {/* Note Input */}
              <View style={styles.noteContainer}>
                <Text style={styles.inputLabel}>Note (Optional)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.noteInput}
                    placeholder="What is this for?"
                    placeholderTextColor="#8E8E93"
                    value={note}
                    onChangeText={setNote}
                    multiline
                  />
                </View>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinueToShare}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Step 2: Share Options */}
          <View style={[styles.shareStep, { display: step === 2 ? 'flex' : 'none' }]}>
            <View style={styles.requestDisplay}>
              <Text style={styles.requestAmount}>R {formatAmount(amount || '0')}</Text>
              {note ? <Text style={styles.requestNote}>{note}</Text> : null}
              <Text style={styles.requestDescription}>Requesting payment from</Text>
            </View>

            <View style={styles.shareOptions}>
              <Text style={styles.shareTitle}>Share this request</Text>
              
              <TouchableOpacity style={styles.shareOption} onPress={copyToClipboard}>
                <View style={styles.shareIcon}>
                  <Copy size={20} color="#0C7C59" />
                </View>
                <Text style={styles.shareOptionText}>Copy Link</Text>
                {isCopied && <CheckCircle size={16} color="#0C7C59" />}
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.shareOption} onPress={shareViaWhatsApp}>
                <View style={styles.shareIcon}>
                  <MessageCircle size={20} color="#25D366" />
                </View>
                <Text style={styles.shareOptionText}>Share via WhatsApp</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.shareOption} onPress={shareViaSMS}>
                <View style={styles.shareIcon}>
                  <MessageCircle size={20} color="#3498DB" />
                </View>
                <Text style={styles.shareOptionText}>Share via SMS</Text>
              </TouchableOpacity>
              
              <View style={styles.qrContainer}>
                <QrCode size={120} color="#1C1C1E" />
                <Text style={styles.qrText}>Scan QR Code</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={onClose}
            >
              <Text style={styles.doneButtonText}>Done</Text>
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
    paddingVertical: 10,
  },
  amountDisplay: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
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
    marginBottom: 5,
  },
  numpadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 5,
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
  noteContainer: {
    marginBottom: 5,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  noteInput: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1C1C1E',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  continueButton: {
    backgroundColor: '#0C7C59',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Share Step Styles
  shareStep: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  requestDisplay: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  requestAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  requestNote: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
  },
  requestDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
  },
  shareOptions: {
    flex: 1,
    marginBottom: 20,
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 20,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  shareIcon: {
    marginRight: 16,
  },
  shareOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    flex: 1,
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 30,
    paddingVertical: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  qrText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginTop: 16,
  },
  doneButton: {
    backgroundColor: '#0C7C59',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});