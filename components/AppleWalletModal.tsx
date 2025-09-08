import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, CircleCheck as CheckCircle, Smartphone, CreditCard } from 'lucide-react-native';

interface AppleWalletModalProps {
  visible: boolean;
  onClose: () => void;
  cardNumber: string;
  holderName: string;
  balance: number;
}

const { width, height } = Dimensions.get('window');

export default function AppleWalletModal({
  visible,
  onClose,
  cardNumber,
  holderName,
  balance,
}: AppleWalletModalProps) {
  const [slideAnimation] = useState(new Animated.Value(height));
  const [scaleAnimation] = useState(new Animated.Value(0.8));
  const [opacityAnimation] = useState(new Animated.Value(0));
  const [step, setStep] = useState<'confirm' | 'adding' | 'success'>('confirm');

  useEffect(() => {
    if (visible) {
      setStep('confirm');
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnimation, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleAddToWallet = () => {
    setStep('adding');
    
    // Simulate adding to wallet process
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onClose();
      }, 2000);
    }, 2000);
  };

  const renderContent = () => {
    switch (step) {
      case 'confirm':
        return (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Add to Apple Wallet</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#2C3E50" />
              </TouchableOpacity>
            </View>

            <View style={styles.cardPreview}>
              <LinearGradient
                colors={['#0C7C59', '#16A085']}
                style={styles.miniCard}
              >
                <Text style={styles.miniCardTitle}>SA Pay Card</Text>
                <Text style={styles.miniCardNumber}>•••• {cardNumber.slice(-4)}</Text>
                <Text style={styles.miniCardBalance}>R {balance.toFixed(2)}</Text>
              </LinearGradient>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>Your Direla Virtual Card</Text>
              <Text style={styles.infoDescription}>
                Add your Direla balance as a virtual Mastercard to Apple Wallet. Use it anywhere Mastercard is accepted, online or in-store.
              </Text>
              
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <CheckCircle size={16} color="#0C7C59" />
                  <Text style={styles.benefitText}>Instant access to your Direla balance</Text>
                </View>
                <View style={styles.benefitItem}>
                  <CheckCircle size={16} color="#0C7C59" />
                  <Text style={styles.benefitText}>Secure transactions with Face ID/Touch ID</Text>
                </View>
                <View style={styles.benefitItem}>
                  <CheckCircle size={16} color="#0C7C59" />
                  <Text style={styles.benefitText}>Real-time balance updates</Text>
                </View>
                <View style={styles.benefitItem}>
                  <CheckCircle size={16} color="#0C7C59" />
                  <Text style={styles.benefitText}>Powered by Hedera Hashgraph</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={handleAddToWallet}>
              <Text style={styles.addButtonText}>Add to Wallet</Text>
            </TouchableOpacity>
          </>
        );

      case 'adding':
        return (
          <View style={styles.loadingContainer}>
            <Animated.View style={styles.loadingSpinner}>
              <CreditCard size={48} color="#0C7C59" />
            </Animated.View>
            <Text style={styles.loadingTitle}>Adding to Apple Wallet</Text>
            <Text style={styles.loadingDescription}>
              Securely provisioning your virtual card...
            </Text>
          </View>
        );

      case 'success':
        return (
          <View style={styles.successContainer}>
            <CheckCircle size={64} color="#0C7C59" />
            <Text style={styles.successTitle}>Card Added Successfully!</Text>
            <Text style={styles.successDescription}>
              Your Direla card is now available in Apple Wallet. You can start using it immediately for payments.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [
                { translateY: slideAnimation },
                { scale: scaleAnimation },
              ],
              opacity: opacityAnimation,
            },
          ]}
        >
          {renderContent()}
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
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: height * 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#2C3E50',
  },
  closeButton: {
    padding: 4,
  },
  cardPreview: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  miniCard: {
    width: 200,
    height: 125,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
  },
  miniCardTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  miniCardNumber: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  miniCardBalance: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    lineHeight: 24,
    marginBottom: 20,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#2C3E50',
    flex: 1,
  },
  addButton: {
    backgroundColor: '#0C7C59',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  loadingSpinner: {
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  loadingDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  successTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#0C7C59',
    marginTop: 20,
    marginBottom: 8,
  },
  successDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
  },
});