import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Lock, Fingerprint, Eye, EyeOff } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';

interface PinChangeModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PinChangeModal({ visible, onClose }: PinChangeModalProps) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricTypes, setBiometricTypes] = useState<LocalAuthentication.AuthenticationType[]>([]);
  const [step, setStep] = useState<'verify' | 'change'>('verify');

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      setBiometricSupported(compatible && enrolled);
      setBiometricTypes(types);
    } catch (error) {
      console.error('Error checking biometric support:', error);
      setBiometricSupported(false);
    }
  };

  const getBiometricTypeText = () => {
    if (biometricTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face Recognition';
    }
    if (biometricTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Fingerprint';
    }
    if (biometricTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris Recognition';
    }
    return 'Biometric';
  };

  const authenticateWithBiometric = async () => {
    if (!biometricSupported) {
      Alert.alert('Biometric Not Available', 'Biometric authentication is not available on this device.');
      return false;
    }

    try {
      setIsLoading(true);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity to change PIN',
        fallbackLabel: 'Use PIN instead',
        cancelLabel: 'Cancel',
        requireConfirmation: true,
      });

      if (result.success) {
        return true;
      } else {
        if (result.error === 'user_cancel') {
          // User cancelled, don't show error
        } else if (result.error === 'not_available') {
          Alert.alert('Error', 'Biometric authentication is not available');
        } else if (result.error === 'not_enrolled') {
          Alert.alert('Error', 'No biometric credentials are enrolled on this device');
        } else {
          Alert.alert('Authentication Failed', 'Please try again');
        }
        return false;
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert('Error', 'Failed to authenticate with biometrics');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricVerification = async () => {
    const success = await authenticateWithBiometric();
    if (success) {
      setStep('change');
    }
  };

  const handlePinVerification = () => {
    // Simulate PIN verification (in real app, this would check against stored PIN)
    const storedPin = '1234'; // This would come from secure storage
    
    if (currentPin === storedPin) {
      setStep('change');
    } else {
      Alert.alert('Incorrect PIN', 'The current PIN you entered is incorrect.');
      setCurrentPin('');
    }
  };

  const validateNewPin = () => {
    if (newPin.length < 4) {
      Alert.alert('Invalid PIN', 'PIN must be at least 4 digits long.');
      return false;
    }

    if (newPin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'The new PIN and confirmation PIN do not match.');
      return false;
    }

    if (newPin === currentPin) {
      Alert.alert('Same PIN', 'New PIN must be different from the current PIN.');
      return false;
    }

    return true;
  };

  const handlePinChange = async () => {
    if (!validateNewPin()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call to change PIN
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, you would:
      // 1. Hash the new PIN
      // 2. Send it to your backend
      // 3. Store it securely
      
      Alert.alert(
        'PIN Changed Successfully',
        'Your PIN has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              onClose();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to change PIN. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setStep('verify');
    setShowCurrentPin(false);
    setShowNewPin(false);
    setShowConfirmPin(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const PinInput = ({ 
    value, 
    onChangeText, 
    placeholder, 
    showPin, 
    onToggleShow,
    autoFocus = false 
  }: {
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    showPin: boolean;
    onToggleShow: () => void;
    autoFocus?: boolean;
  }) => (
    <View style={styles.pinInputContainer}>
      <TextInput
        style={styles.pinInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={!showPin}
        keyboardType="numeric"
        maxLength={8}
        autoFocus={autoFocus}
      />
      <TouchableOpacity onPress={onToggleShow} style={styles.eyeButton}>
        {showPin ? <EyeOff size={20} color="#7F8C8D" /> : <Eye size={20} color="#7F8C8D" />}
      </TouchableOpacity>
    </View>
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
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change PIN</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {step === 'verify' ? (
            <>
              <View style={styles.iconContainer}>
                <Lock size={48} color="#0C7C59" />
              </View>
              
              <Text style={styles.title}>Verify Your Identity</Text>
              <Text style={styles.subtitle}>
                Please verify your identity before changing your PIN
              </Text>

              {biometricSupported && (
                <TouchableOpacity 
                  onPress={handleBiometricVerification}
                  style={styles.biometricButton}
                  disabled={isLoading}
                >
                  <Fingerprint size={24} color="#FFFFFF" />
                  <Text style={styles.biometricButtonText}>
                    Use {getBiometricTypeText()}
                  </Text>
                </TouchableOpacity>
              )}

              <Text style={styles.orText}>or enter your current PIN</Text>

              <PinInput
                value={currentPin}
                onChangeText={setCurrentPin}
                placeholder="Enter current PIN"
                showPin={showCurrentPin}
                onToggleShow={() => setShowCurrentPin(!showCurrentPin)}
                autoFocus={!biometricSupported}
              />

              <TouchableOpacity
                onPress={handlePinVerification}
                style={[styles.button, (!currentPin || isLoading) && styles.buttonDisabled]}
                disabled={!currentPin || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Verify PIN</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.iconContainer}>
                <Lock size={48} color="#0C7C59" />
              </View>
              
              <Text style={styles.title}>Create New PIN</Text>
              <Text style={styles.subtitle}>
                Enter a new PIN to secure your account
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New PIN</Text>
                <PinInput
                  value={newPin}
                  onChangeText={setNewPin}
                  placeholder="Enter new PIN"
                  showPin={showNewPin}
                  onToggleShow={() => setShowNewPin(!showNewPin)}
                  autoFocus
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New PIN</Text>
                <PinInput
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  placeholder="Confirm new PIN"
                  showPin={showConfirmPin}
                  onToggleShow={() => setShowConfirmPin(!showConfirmPin)}
                />
              </View>

              <TouchableOpacity
                onPress={handlePinChange}
                style={[styles.button, (!newPin || !confirmPin || isLoading) && styles.buttonDisabled]}
                disabled={!newPin || !confirmPin || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Change PIN</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStep('verify')}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
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
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C7C59',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  biometricButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  orText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    marginBottom: 24,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  pinInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 20,
  },
  pinInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#2C3E50',
    paddingVertical: 16,
  },
  eyeButton: {
    padding: 4,
  },
  button: {
    backgroundColor: '#0C7C59',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  backButton: {
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#0C7C59',
  },
});
