import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { X, CreditCard, Clock } from 'lucide-react-native';
import { CurrencyQuote } from '../types/api';

interface PaymentConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onPayNow: () => void;
  onBuyNowPayLater: () => void;
  paymentData: {
    amount: number;
    currency: string;
    accountAlias?: string;
    toAccountId: string;
  };
  quote?: CurrencyQuote | null;
  fromCurrency: string;
}

export default function PaymentConfirmationModal({
  visible,
  onClose,
  onPayNow,
  onBuyNowPayLater,
  paymentData,
  quote,
  fromCurrency,
}: PaymentConfirmationModalProps) {
  const displayAmount = quote ? quote.fromAmount : paymentData.amount;
  const displayCurrency = quote ? quote.fromCurrency : paymentData.currency;
  const recipientAmount = quote ? quote.toAmount : paymentData.amount;
  const recipientCurrency = quote ? quote.toCurrency : paymentData.currency;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Payment Request Detected</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <View style={styles.paymentInfo}>
              <Text style={styles.amountText}>
                {displayAmount.toFixed(2)} {displayCurrency}
              </Text>
              <Text style={styles.recipientText}>
                to {paymentData.accountAlias || paymentData.toAccountId}
              </Text>
              
              {quote && (
                <View style={styles.quoteInfo}>
                  <Text style={styles.quoteText}>
                    Recipient will receive: {recipientAmount.toFixed(2)} {recipientCurrency}
                  </Text>
                  <Text style={styles.exchangeRateText}>
                    Exchange rate: 1 {fromCurrency} = {quote.exchangeRate.toFixed(4)} {recipientCurrency}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.paymentOptions}>
              <TouchableOpacity style={styles.payNowButton} onPress={onPayNow}>
                <CreditCard size={20} color="#FFFFFF" />
                <Text style={styles.payNowButtonText}>Pay Now</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.bnplButton} onPress={onBuyNowPayLater}>
                <Clock size={20} color="#0C7C59" />
                <Text style={styles.bnplButtonText}>Buy Now Pay Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    maxWidth: 400,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  paymentInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  amountText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0C7C59',
    marginBottom: 8,
  },
  recipientText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 16,
  },
  quoteInfo: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  quoteText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  exchangeRateText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  paymentOptions: {
    width: '100%',
    gap: 12,
  },
  payNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C7C59',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  payNowButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bnplButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0C7C59',
    gap: 8,
  },
  bnplButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C7C59',
  },
});
