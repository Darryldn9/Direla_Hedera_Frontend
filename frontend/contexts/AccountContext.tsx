import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HederaAccount } from '../types/api';
import { useUserManagement } from '../hooks/useAuth';
import { HederaService } from '../services/api/hedera.service';

interface AccountContextType {
  // State
  accounts: HederaAccount[];
  selectedAccount: HederaAccount | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadAccounts: () => Promise<void>;
  selectAccount: (account: HederaAccount | null) => void;
  refreshAccounts: () => Promise<void>;
  clearAccounts: () => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

const SELECTED_ACCOUNT_KEY = '@direla_selected_account';

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<HederaAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<HederaAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { currentUser } = useUserManagement();
  const hederaService = new HederaService();

  // Load accounts when user changes
  useEffect(() => {
    if (currentUser?.user_id) {
      loadAccounts();
    } else {
      clearAccounts();
    }
  }, [currentUser?.user_id]);

  // Load selected account from storage when accounts change
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      loadSelectedAccountFromStorage();
    }
  }, [accounts]);

  const loadSelectedAccountFromStorage = async () => {
    try {
      const savedAccountId = await AsyncStorage.getItem(SELECTED_ACCOUNT_KEY);
      if (savedAccountId && accounts.length > 0) {
        const account = accounts.find(acc => acc.id.toString() === savedAccountId);
        if (account) {
          setSelectedAccount(account);
        } else {
          // If saved account not found, select first account
          setSelectedAccount(accounts[0]);
        }
      } else if (accounts.length > 0) {
        // No saved account, select first one
        setSelectedAccount(accounts[0]);
      }
    } catch (error) {
      console.error('Error loading selected account from storage:', error);
      if (accounts.length > 0) {
        setSelectedAccount(accounts[0]);
      }
    }
  };

  const loadAccounts = useCallback(async () => {
    if (!currentUser?.user_id) {
      console.log('No user ID available for loading accounts');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Loading accounts for user:', currentUser.user_id);
      const response = await hederaService.getUserAccounts(currentUser.user_id);
      
      if (response.success && response.data) {
        console.log('Accounts loaded successfully:', response.data.length);
        setAccounts(response.data);
      } else {
        console.error('Failed to load accounts:', response.error);
        setError(response.error || 'Failed to load accounts');
        setAccounts([]);
      }
    } catch (err) {
      console.error('Error loading accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.user_id, hederaService]);

  const selectAccount = useCallback(async (account: HederaAccount | null) => {
    try {
      setSelectedAccount(account);
      
      if (account) {
        await AsyncStorage.setItem(SELECTED_ACCOUNT_KEY, account.id.toString());
        console.log('Selected account saved to storage:', account.id);
      } else {
        await AsyncStorage.removeItem(SELECTED_ACCOUNT_KEY);
        console.log('Selected account cleared from storage');
      }
    } catch (error) {
      console.error('Error saving selected account to storage:', error);
    }
  }, []);

  const refreshAccounts = useCallback(async () => {
    await loadAccounts();
  }, [loadAccounts]);

  const clearAccounts = useCallback(() => {
    setAccounts([]);
    setSelectedAccount(null);
    setError(null);
    AsyncStorage.removeItem(SELECTED_ACCOUNT_KEY);
  }, []);

  const value: AccountContextType = {
    accounts,
    selectedAccount,
    isLoading,
    error,
    loadAccounts,
    selectAccount,
    refreshAccounts,
    clearAccounts,
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
}
