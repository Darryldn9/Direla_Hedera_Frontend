import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { ChevronDown, Wallet, Check } from 'lucide-react-native';
import { HederaAccount } from '../types/api';
import { useAccount } from '../contexts/AccountContext';

interface AccountDropdownProps {
  onAccountSelect?: (account: HederaAccount | null) => void;
  disabled?: boolean;
}

export default function AccountDropdown({ onAccountSelect, disabled = false }: AccountDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { accounts, selectedAccount, isLoading, selectAccount } = useAccount();

  const handleAccountSelect = async (account: HederaAccount) => {
    await selectAccount(account);
    setIsOpen(false);
    onAccountSelect?.(account);
  };

  const formatAccountDisplay = (account: HederaAccount) => {
    const alias = account.alias || 'Unnamed Account';
    const shortAccountId = account.account_id.length > 12 
      ? `${account.account_id.substring(0, 6)}...${account.account_id.substring(account.account_id.length - 6)}`
      : account.account_id;
    
    return {
      title: alias,
      subtitle: `${account.balance.toFixed(2)} HBAR`,
    };
  };

  const renderAccountItem = ({ item }: { item: HederaAccount }) => {
    const isSelected = selectedAccount?.id === item.id;
    const display = formatAccountDisplay(item);
    
    return (
      <TouchableOpacity
        style={[
          styles.accountItem,
          isSelected && styles.selectedAccountItem
        ]}
        onPress={() => handleAccountSelect(item)}
        disabled={disabled}
      >
        <View style={styles.accountItemContent}>
          <View style={styles.accountIcon}>
            <Wallet size={20} color={isSelected ? '#0C7C59' : '#8E8E93'} />
          </View>
          <View style={styles.accountInfo}>
            <Text style={[
              styles.accountTitle,
              isSelected && styles.selectedAccountTitle
            ]}>
              {display.title}
            </Text>
            <Text style={[
              styles.accountSubtitle,
              isSelected && styles.selectedAccountSubtitle
            ]}>
              {display.subtitle}
            </Text>
          </View>
          {isSelected && (
            <View style={styles.checkIcon}>
              <Check size={20} color="#0C7C59" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const display = selectedAccount ? formatAccountDisplay(selectedAccount) : null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          disabled && styles.disabledButton
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <View style={styles.buttonContent}>
          <View style={styles.buttonLeft}>
            <View style={styles.buttonIcon}>
              <Wallet size={18} color={disabled ? '#BDC3C7' : '#0C7C59'} />
            </View>
            <View style={styles.buttonText}>
              <Text style={[
                styles.buttonTitle,
                disabled && styles.disabledText
              ]}>
                {display ? display.title : 'Select Account'}
              </Text>
              {display && (
                <Text style={[
                  styles.buttonSubtitle,
                  disabled && styles.disabledText
                ]}>
                  {display.subtitle}
                </Text>
              )}
            </View>
          </View>
          <ChevronDown 
            size={20} 
            color={disabled ? '#BDC3C7' : '#8E8E93'} 
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Account</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsOpen(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0C7C59" />
                <Text style={styles.loadingText}>Loading accounts...</Text>
              </View>
            ) : accounts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Wallet size={48} color="#BDC3C7" />
                <Text style={styles.emptyTitle}>No Accounts Found</Text>
                <Text style={styles.emptySubtitle}>
                  You don't have any Hedera accounts yet.
                </Text>
              </View>
            ) : (
              <FlatList
                data={accounts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderAccountItem}
                style={styles.accountsList}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dropdownButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  disabledButton: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E5E5E5',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  buttonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  buttonText: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  buttonSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
  },
  disabledText: {
    color: '#BDC3C7',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  accountsList: {
    maxHeight: 300,
  },
  accountItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  selectedAccountItem: {
    backgroundColor: '#F0F9F4',
  },
  accountItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  selectedAccountTitle: {
    color: '#0C7C59',
  },
  accountSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
  },
  selectedAccountSubtitle: {
    color: '#0C7C59',
  },
  checkIcon: {
    marginLeft: 8,
  },
});
