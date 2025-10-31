import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useAccount } from '../contexts/AccountContext';
import { HederaService } from '../services/api/hedera.service';
import { SupportedCurrency, getSupportedCurrencies, getCurrencyInfo, formatCurrency } from '../utils/currency';
import { CurrencyBalance } from '../types/api';

interface CurrencySwitchModalProps {
  visible: boolean;
  onClose: () => void;
  onCurrencyChanged?: (currency: string) => void;
}

export default function CurrencySwitchModal({ 
  visible, 
  onClose, 
  onCurrencyChanged 
}: CurrencySwitchModalProps) {
  const { selectedAccount, refreshAccounts } = useAccount();
  const [selectedCurrency, setSelectedCurrency] = useState<string>(selectedAccount?.currency || 'ZAR');
  const [isUpdating, setIsUpdating] = useState(false);
  const [currencyBalances, setCurrencyBalances] = useState<CurrencyBalance[]>([]);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const hederaService = new HederaService();
  const supportedCurrencies = getSupportedCurrencies();

  // Fetch currency balances for the selected account
  const fetchCurrencyBalances = async () => {
    if (!selectedAccount?.account_id) {
      setCurrencyBalances([]);
      return;
    }

    setLoadingBalances(true);
    try {
      const response = await hederaService.getAccountBalance(selectedAccount.account_id);
      if (response.success && response.data) {
        setCurrencyBalances(response.data.balances);
      } else {
        setCurrencyBalances([]);
      }
    } catch (error) {
      console.error('Error fetching currency balances:', error);
      setCurrencyBalances([]);
    } finally {
      setLoadingBalances(false);
    }
  };

  // Load balances when modal opens or account changes
  useEffect(() => {
    if (visible && selectedAccount) {
      fetchCurrencyBalances();
    }
  }, [visible, selectedAccount?.account_id]);

  // Get balance for a specific currency
  const getBalanceForCurrency = (currency: string): number => {
    const balance = currencyBalances.find(b => b.code === currency);
    return balance?.amount || 0;
  };

  const handleCurrencySelect = (currency: SupportedCurrency) => {
    setSelectedCurrency(currency);
  };

  const handleConfirm = async () => {
    if (!selectedAccount || selectedCurrency === selectedAccount.currency) {
      onClose();
      return;
    }

    setIsUpdating(true);
    try {
      const response = await hederaService.updateAccountCurrency(selectedAccount.id, selectedCurrency);
      
      if (response.success) {
        // Refresh accounts to get updated data
        await refreshAccounts();
        
        // Notify parent component
        onCurrencyChanged?.(selectedCurrency);
        
        Alert.alert(
          'Currency Updated',
          `Your account currency has been changed to ${getCurrencyInfo(selectedCurrency).name}`,
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        Alert.alert(
          'Update Failed',
          response.error || 'Failed to update currency. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Currency update error:', error);
      Alert.alert(
        'Update Failed',
        'An error occurred while updating your currency. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const CurrencyOption = ({ currency }: { currency: SupportedCurrency }) => {
    const currencyInfo = getCurrencyInfo(currency);
    const isSelected = selectedCurrency === currency;
    const isCurrent = selectedAccount?.currency === currency;
    const balance = getBalanceForCurrency(currency);

    return (
      <TouchableOpacity
        style={[
          styles.currencyOption,
          isSelected && styles.currencyOptionSelected,
          isCurrent && styles.currencyOptionCurrent
        ]}
        onPress={() => handleCurrencySelect(currency)}
        disabled={isUpdating}
      >
        <View style={styles.currencyOptionContent}>
          <View style={styles.currencyInfo}>
            <Text style={[
              styles.currencySymbol,
              isSelected && styles.currencySymbolSelected
            ]}>
              {currencyInfo.symbol}
            </Text>
            <View style={styles.currencyDetails}>
              <Text style={[
                styles.currencyCode,
                isSelected && styles.currencyCodeSelected
              ]}>
                {currency}
              </Text>
              <Text style={[
                styles.currencyName,
                isSelected && styles.currencyNameSelected
              ]}>
                {currencyInfo.name}
              </Text>
              <Text style={[
                styles.currencyBalance,
                isSelected && styles.currencyBalanceSelected
              ]}>
                {formatCurrency(balance, currency, true)}
              </Text>
            </View>
          </View>
          <View style={styles.currencyStatus}>
            {isCurrent && (
              <Text style={styles.currentLabel}>Current</Text>
            )}
            {isSelected && (
              <Check size={20} color="#0C7C59" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Switch Currency</Text>
            <Text style={styles.subtitle}>
              Choose your preferred currency for this account
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            disabled={isUpdating}
          >
            <X size={24} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Current Account Info */}
        {selectedAccount && (
          <View style={styles.accountInfo}>
            <Text style={styles.accountLabel}>Account</Text>
            <Text style={styles.accountName}>
              {selectedAccount.alias || selectedAccount.account_id}
            </Text>
            <Text style={styles.currentCurrency}>
              Current: {formatCurrency(getBalanceForCurrency(selectedAccount.currency), selectedAccount.currency, true)}
            </Text>
            {loadingBalances && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#0C7C59" />
                <Text style={styles.loadingText}>Loading balances...</Text>
              </View>
            )}
          </View>
        )}

        {/* Currency Options */}
        <ScrollView style={styles.currencyList} showsVerticalScrollIndicator={false}>
          {supportedCurrencies.map((currency) => (
            <CurrencyOption key={currency} currency={currency} />
          ))}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
            disabled={isUpdating}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.button,
              styles.confirmButton,
              (selectedCurrency === selectedAccount?.currency || isUpdating) && styles.confirmButtonDisabled
            ]}
            onPress={handleConfirm}
            disabled={selectedCurrency === selectedAccount?.currency || isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmButtonText}>Update Currency</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
  },
  closeButton: {
    padding: 8,
    marginTop: -8,
  },
  accountInfo: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  accountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  currentCurrency: {
    fontSize: 14,
    color: '#8E8E93',
  },
  currencyList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  currencyOption: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    overflow: 'hidden',
  },
  currencyOptionSelected: {
    borderColor: '#0C7C59',
    backgroundColor: '#F0F9F5',
  },
  currencyOptionCurrent: {
    borderColor: '#3498DB',
    backgroundColor: '#F0F8FF',
  },
  currencyOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginRight: 16,
    minWidth: 40,
  },
  currencySymbolSelected: {
    color: '#0C7C59',
  },
  currencyDetails: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  currencyCodeSelected: {
    color: '#0C7C59',
  },
  currencyName: {
    fontSize: 14,
    color: '#8E8E93',
  },
  currencyNameSelected: {
    color: '#0C7C59',
  },
  currencyBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 2,
  },
  currencyBalanceSelected: {
    color: '#0C7C59',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  currencyStatus: {
    alignItems: 'flex-end',
  },
  currentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3498DB',
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 34,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  confirmButton: {
    backgroundColor: '#0C7C59',
  },
  confirmButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
