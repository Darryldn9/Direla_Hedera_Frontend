import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { X, Copy } from 'lucide-react-native';
import { Colors } from '../lib/colors';

interface SaleDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  transactionId: string;
  fromAccount: string;
  toAccount: string;
}

export default function SaleDetailsModal({
  visible,
  onClose,
  transactionId,
  fromAccount,
  toAccount,
}: SaleDetailsModalProps) {
  const copyToClipboard = (text: string, label: string) => {
    // In a real implementation, you would use Clipboard.setString(text)
    // For now, we'll just show a visual feedback
    // You can add react-native-clipboard or expo-clipboard for this functionality
    console.log(`Copying ${label}:`, text);
  };

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueContainer}>
        <Text style={styles.value} selectable>
          {value}
        </Text>
        <TouchableOpacity
          onPress={() => copyToClipboard(value, label)}
          style={styles.copyButton}
        >
          <Copy size={16} color={Colors.semantic.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Transaction Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <InfoRow label="Transaction ID" value={transactionId} />
            <View style={styles.separator} />
            <InfoRow label="From Account" value={fromAccount} />
            <View style={styles.separator} />
            <InfoRow label="To Account" value={toAccount} />
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
    gap: 0,
  },
  infoRow: {
    paddingVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.semantic.textSecondary,
    marginBottom: 8,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.semantic.surface,
    padding: 12,
    borderRadius: 8,
  },
  value: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: Colors.semantic.textPrimary,
    fontFamily: 'monospace',
  },
  copyButton: {
    marginLeft: 8,
    padding: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#F5F5F7',
  },
});

