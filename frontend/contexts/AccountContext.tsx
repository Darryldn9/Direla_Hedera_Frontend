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
  debugState: () => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

const SELECTED_ACCOUNT_KEY = '@direla_selected_account';

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<HederaAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<HederaAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAccountId, setSavedAccountId] = useState<string | null>(null);
  
  const { currentUser } = useUserManagement();
  const hederaService = new HederaService();

  // Load saved account ID from storage on mount
  useEffect(() => {
    loadSavedAccountId();
  }, []);

  // Load accounts when user changes
  useEffect(() => {
    if (currentUser?.user_id) {
      loadAccounts();
    } else {
      clearAccounts();
    }
  }, [currentUser?.user_id]);

  // Restore selected account when accounts are loaded
  useEffect(() => {
    console.log('🔄 AccountContext: Effect triggered - accounts:', accounts.length, 'savedAccountId:', savedAccountId, 'selectedAccount:', selectedAccount?.account_id);
    if (accounts.length > 0 && savedAccountId !== null) {
      restoreSelectedAccount();
    } else if (accounts.length > 0 && savedAccountId === null) {
      // No saved account, select first one
      console.log('📱 AccountContext: No saved account, selecting first available');
      setSelectedAccount(accounts[0]);
    }
  }, [accounts, savedAccountId]);

  const loadSavedAccountId = async () => {
    try {
      const savedId = await AsyncStorage.getItem(SELECTED_ACCOUNT_KEY);
      console.log('🔍 AccountContext: Loading saved account ID from storage:', savedId);
      setSavedAccountId(savedId);
    } catch (error) {
      console.error('❌ AccountContext: Error loading saved account ID:', error);
      setSavedAccountId(null);
    }
  };

  const restoreSelectedAccount = () => {
    try {
      console.log('🔄 AccountContext: Restoring selected account. Saved ID:', savedAccountId, 'Available accounts:', accounts.length);
      
      if (savedAccountId && accounts.length > 0) {
        const account = accounts.find(acc => acc.id.toString() === savedAccountId);
        if (account) {
          console.log('✅ AccountContext: Restored saved account:', account.account_id);
          setSelectedAccount(account);
          return;
        } else {
          console.log('⚠️ AccountContext: Saved account not found in current accounts, selecting first');
        }
      }
      
      // Fallback to first account if no saved account or saved account not found
      if (accounts.length > 0) {
        console.log('📱 AccountContext: Selecting first available account:', accounts[0].account_id);
        setSelectedAccount(accounts[0]);
      }
    } catch (error) {
      console.error('❌ AccountContext: Error restoring selected account:', error);
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
      console.log('🔄 AccountContext: Selecting account:', account?.account_id || 'null');
      setSelectedAccount(account);
      
      if (account) {
        const accountId = account.id.toString();
        await AsyncStorage.setItem(SELECTED_ACCOUNT_KEY, accountId);
        setSavedAccountId(accountId);
        console.log('💾 AccountContext: Selected account saved to storage:', accountId);
      } else {
        await AsyncStorage.removeItem(SELECTED_ACCOUNT_KEY);
        setSavedAccountId(null);
        console.log('🗑️ AccountContext: Selected account cleared from storage');
      }
    } catch (error) {
      console.error('❌ AccountContext: Error saving selected account to storage:', error);
    }
  }, []);

  const refreshAccounts = useCallback(async () => {
    await loadAccounts();
  }, [loadAccounts]);

  const clearAccounts = useCallback(() => {
    setAccounts([]);
    setSelectedAccount(null);
    setError(null);
    setSavedAccountId(null);
    AsyncStorage.removeItem(SELECTED_ACCOUNT_KEY);
  }, []);

  const debugState = useCallback(() => {
    console.log('🐛 AccountContext Debug State:', {
      accounts: accounts.length,
      selectedAccount: selectedAccount?.account_id || 'null',
      savedAccountId,
      isLoading,
      error,
      currentUser: currentUser?.user_id || 'null'
    });
  }, [accounts, selectedAccount, savedAccountId, isLoading, error, currentUser]);

  const value: AccountContextType = {
    accounts,
    selectedAccount,
    isLoading,
    error,
    loadAccounts,
    selectAccount,
    refreshAccounts,
    clearAccounts,
    debugState,
  };

  // // Refresh balances when accounts are loaded
  // useEffect(() => {
  //   if (accounts.length > 0) {
  //     refreshAllBalances();
  //   }
  // }, [accounts, refreshAllBalances]);

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
