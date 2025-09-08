import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, CreditCard, Plus, MoreVertical, Trash2, Edit3, CheckCircle } from 'lucide-react-native';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'wallet';
  name: string;
  details: string;
  lastFour: string;
  isDefault: boolean;
  expiryDate?: string;
  brand?: string;
}

interface PaymentMethodsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PaymentMethodsModal({ visible, onClose }: PaymentMethodsModalProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      name: 'Direla Virtual Card',
      details: 'Primary spending card',
      lastFour: '9012',
      isDefault: true,
      expiryDate: '12/28',
      brand: 'Visa',
    },
    {
      id: '2',
      type: 'bank',
      name: 'Standard Bank',
      details: 'Savings Account',
      lastFour: '3456',
      isDefault: false,
    },
    {
      id: '3',
      type: 'card',
      name: 'FNB Credit Card',
      details: 'Credit Card',
      lastFour: '7890',
      isDefault: false,
      expiryDate: '09/26',
      brand: 'Mastercard',
    },
    {
      id: '4',
      type: 'wallet',
      name: 'Hedera Wallet',
      details: 'Cryptocurrency wallet',
      lastFour: 'AB12',
      isDefault: false,
    },
  ]);

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const handleSetDefault = (id: string) => {
    setPaymentMethods(prev => 
      prev.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    );
    Alert.alert('Success', 'Default payment method updated');
    setSelectedMethod(null);
  };

  const handleDelete = (id: string) => {
    const method = paymentMethods.find(m => m.id === id);
    if (method?.isDefault) {
      Alert.alert('Error', 'Cannot delete the default payment method');
      return;
    }

    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(prev => prev.filter(m => m.id !== id));
            setSelectedMethod(null);
          }
        }
      ]
    );
  };

  const handleAddPaymentMethod = () => {
    Alert.alert(
      'Add Payment Method',
      'Choose how to add a new payment method',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add Card', onPress: () => Alert.alert('Feature Coming Soon', 'Card addition will be available in the next update') },
        { text: 'Link Bank Account', onPress: () => Alert.alert('Feature Coming Soon', 'Bank linking will be available in the next update') }
      ]
    );
  };

  const getMethodIcon = (type: string, brand?: string) => {
    if (type === 'card') {
      return <CreditCard size={24} color="#0C7C59" />;
    }
    return <CreditCard size={24} color="#0C7C59" />;
  };

  const getMethodColor = (type: string) => {
    switch (type) {
      case 'card': return '#0C7C59';
      case 'bank': return '#3498DB';
      case 'wallet': return '#9B59B6';
      default: return '#0C7C59';
    }
  };

  const PaymentMethodCard = ({ method }: { method: PaymentMethod }) => (
    <View style={styles.methodCard}>
      <View style={styles.methodHeader}>
        <View style={styles.methodInfo}>
          <View style={[styles.methodIcon, { backgroundColor: `${getMethodColor(method.type)}15` }]}>
            {getMethodIcon(method.type, method.brand)}
          </View>
          <View style={styles.methodDetails}>
            <View style={styles.methodTitleRow}>
              <Text style={styles.methodName}>{method.name}</Text>
              {method.isDefault && (
                <View style={styles.defaultBadge}>
                  <CheckCircle size={14} color="#27AE60" />
                  <Text style={styles.defaultText}>Default</Text>
                </View>
              )}
            </View>
            <Text style={styles.methodDescription}>{method.details}</Text>
            <Text style={styles.methodLastFour}>
              •••• {method.lastFour}
              {method.expiryDate && ` • Expires ${method.expiryDate}`}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setSelectedMethod(selectedMethod === method.id ? null : method.id)}
          style={styles.moreButton}
        >
          <MoreVertical size={20} color="#7F8C8D" />
        </TouchableOpacity>
      </View>

      {selectedMethod === method.id && (
        <View style={styles.methodActions}>
          {!method.isDefault && (
            <TouchableOpacity
              onPress={() => handleSetDefault(method.id)}
              style={styles.actionButton}
            >
              <CheckCircle size={16} color="#27AE60" />
              <Text style={styles.actionText}>Set as Default</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => Alert.alert('Feature Coming Soon', 'Edit functionality will be available soon')}
            style={styles.actionButton}
          >
            <Edit3 size={16} color="#3498DB" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          {!method.isDefault && (
            <TouchableOpacity
              onPress={() => handleDelete(method.id)}
              style={styles.actionButton}
            >
              <Trash2 size={16} color="#E74C3C" />
              <Text style={[styles.actionText, { color: '#E74C3C' }]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Methods</Text>
          <TouchableOpacity onPress={handleAddPaymentMethod} style={styles.addButton}>
            <Plus size={20} color="#0C7C59" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionDescription}>
            Manage your payment methods. Your default method will be used for transactions.
          </Text>

          {paymentMethods.map((method) => (
            <PaymentMethodCard key={method.id} method={method} />
          ))}

          <TouchableOpacity onPress={handleAddPaymentMethod} style={styles.addMethodButton}>
            <Plus size={24} color="#0C7C59" />
            <Text style={styles.addMethodText}>Add New Payment Method</Text>
          </TouchableOpacity>
        </ScrollView>
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
  addButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    marginBottom: 20,
    lineHeight: 20,
  },
  methodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  methodInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodDetails: {
    flex: 1,
  },
  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  methodName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
    flex: 1,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  defaultText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#27AE60',
  },
  methodDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    marginBottom: 4,
  },
  methodLastFour: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2C3E50',
  },
  moreButton: {
    padding: 8,
  },
  methodActions: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2C3E50',
  },
  addMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    marginTop: 20,
    gap: 8,
  },
  addMethodText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#0C7C59',
  },
});
