import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CreditCard, Plus, Eye, EyeOff, Smartphone } from 'lucide-react-native';

interface VirtualCardProps {
  balance: number;
  cardNumber: string;
  expiryDate: string;
  holderName: string;
  onAddToWallet: () => void;
  showBalance: boolean;
  onToggleBalance: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = CARD_WIDTH * 0.63; // Standard credit card ratio

export default function VirtualCard({
  balance,
  cardNumber,
  expiryDate,
  holderName,
  onAddToWallet,
  showBalance,
  onToggleBalance,
}: VirtualCardProps) {
  const [flipAnimation] = useState(new Animated.Value(0));
  const [scaleAnimation] = useState(new Animated.Value(1));
  const [glowAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    // Subtle glow animation
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    glowLoop.start();

    return () => glowLoop.stop();
  }, []);

  const handleCardPress = () => {
    // Flip animation
    Animated.timing(flipAnimation, {
      toValue: flipAnimation._value === 0 ? 1 : 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const handleAddToWallet = () => {
    // Scale animation for feedback
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onAddToWallet();
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        {/* Glow Effect */}
        <Animated.View
          style={[
            styles.glowEffect,
            {
              opacity: glowOpacity,
            },
          ]}
        />

        {/* Card Front */}
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                { rotateY: frontInterpolate },
                { scale: scaleAnimation },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.cardTouchable}
            onPress={handleCardPress}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#0C7C59', '#16A085', '#1ABC9C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.logoContainer}>
                  <Text style={styles.logoText}>Direla</Text>
                  <Text style={styles.logoSubtext}>Powered by Hedera</Text>
                </View>
                <TouchableOpacity onPress={onToggleBalance} style={styles.eyeButton}>
                  {showBalance ? (
                    <EyeOff size={20} color="#FFFFFF" />
                  ) : (
                    <Eye size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Balance */}
              <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceAmount}>
                  {showBalance ? `R ${balance.toFixed(2)}` : 'R ••••••'}
                </Text>
              </View>

              {/* Card Number */}
              <View style={styles.cardNumberContainer}>
                <Text style={styles.cardNumber}>
                  {showBalance ? cardNumber : '•••• •••• •••• ••••'}
                </Text>
              </View>

              {/* Card Footer */}
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.cardLabel}>CARDHOLDER</Text>
                  <Text style={styles.cardValue}>{holderName}</Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>EXPIRES</Text>
                  <Text style={styles.cardValue}>{expiryDate}</Text>
                </View>
                <View style={styles.chipContainer}>
                  <View style={styles.chip} />
                </View>
              </View>

              {/* Hedera Logo */}
              <View style={styles.hederaLogo}>
                <Text style={styles.hederaText}>ℏ</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Card Back */}
        <Animated.View
          style={[
            styles.card,
            styles.cardBack,
            {
              transform: [
                { rotateY: backInterpolate },
                { scale: scaleAnimation },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#2C3E50', '#34495E', '#3498DB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.magneticStripe} />
            <View style={styles.signaturePanel}>
              <Text style={styles.signatureText}>Authorized Signature</Text>
              <View style={styles.signatureLine} />
            </View>
            <View style={styles.cvvContainer}>
              <Text style={styles.cvvLabel}>CVV</Text>
              <Text style={styles.cvvValue}>***</Text>
            </View>
            <Text style={styles.backDisclaimer}>
              This virtual card is backed by Hedera Hashgraph technology for secure, instant transactions.
            </Text>
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Add to Wallet Button */}
      {Platform.OS === 'ios' && (
        <TouchableOpacity
          style={styles.addToWalletButton}
          onPress={handleAddToWallet}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#000000', '#1C1C1E']}
            style={styles.walletButtonGradient}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addToWalletText}>Add to Apple Wallet</Text>
            <Smartphone size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 16,
    backgroundColor: '#0C7C59',
    opacity: 0.3,
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    transform: [{ rotateY: '180deg' }],
  },
  cardTouchable: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoContainer: {
    flex: 1,
  },
  logoText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  logoSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  eyeButton: {
    padding: 4,
  },
  balanceContainer: {
    marginTop: 8,
  },
  balanceLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  cardNumberContainer: {
    marginTop: 16,
  },
  cardNumber: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  chipContainer: {
    alignItems: 'center',
  },
  chip: {
    width: 32,
    height: 24,
    backgroundColor: '#F1C40F',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F39C12',
  },
  hederaLogo: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hederaText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  magneticStripe: {
    height: 40,
    backgroundColor: '#000000',
    marginTop: 20,
    marginHorizontal: -20,
  },
  signaturePanel: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginTop: 20,
    borderRadius: 4,
  },
  signatureText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#2C3E50',
    marginBottom: 8,
  },
  signatureLine: {
    height: 20,
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
  },
  cvvContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 4,
    marginTop: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  cvvLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#2C3E50',
  },
  cvvValue: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#2C3E50',
  },
  backDisclaimer: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 14,
  },
  addToWalletButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  walletButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  addToWalletText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});