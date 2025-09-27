import { useState, useCallback } from 'react';
import { useApi } from './useApi';
import { api } from '../services/api';
import { 
  HederaAccount, 
  CreateHederaAccountRequest, 
  AccountBalance, 
  AccountInfo 
} from '../types/api';

/**
 * Hook for Hedera account operations
 */
export function useHederaAccounts() {
  const createAccount = useApi<HederaAccount>(api.hedera.createAccount.bind(api.hedera));
  const getAllAccounts = useApi<HederaAccount[]>(api.hedera.getAllAccounts.bind(api.hedera));
  const getActiveAccounts = useApi<HederaAccount[]>(api.hedera.getActiveAccounts.bind(api.hedera));
  const getAccountById = useApi<HederaAccount>(api.hedera.getAccountById.bind(api.hedera));
  const updateAccount = useApi<HederaAccount>(api.hedera.updateAccount.bind(api.hedera));
  const deleteAccount = useApi<void>(api.hedera.deleteAccount.bind(api.hedera));
  const getUserAccounts = useApi<HederaAccount[]>(api.hedera.getUserAccounts.bind(api.hedera));
  const getPrimaryAccount = useApi<HederaAccount | null>(api.hedera.getPrimaryAccount.bind(api.hedera));

  return {
    createAccount,
    getAllAccounts,
    getActiveAccounts,
    getAccountById,
    updateAccount,
    deleteAccount,
    getUserAccounts,
    getPrimaryAccount,
  };
}

/**
 * Hook for Hedera account balances
 */
export function useHederaBalances() {
  const getAccountBalance = useApi<AccountBalance>(api.hedera.getAccountBalance.bind(api.hedera));
  const getAccountInfo = useApi<AccountInfo>(api.hedera.getAccountInfo.bind(api.hedera));

  return {
    getAccountBalance,
    getAccountInfo,
  };
}

/**
 * Hook for Hedera operations with local state management
 */
export function useHederaOperations() {
  const [selectedAccount, setSelectedAccount] = useState<HederaAccount | null>(null);
  const [accountBalances, setAccountBalances] = useState<Record<string, number>>({});
  
  const accounts = useHederaAccounts();
  const balances = useHederaBalances();

  const selectAccount = useCallback((account: HederaAccount) => {
    setSelectedAccount(account);
  }, []);

  const refreshAccountBalance = useCallback(async (accountId: string) => {
    const balance = await balances.getAccountBalance.execute(accountId);
    if (balance) {
      // Extract HBAR balance for backward compatibility
      const hbarBalance = balance.balances.find(b => b.code === 'HBAR')?.amount || 0;
      setAccountBalances(prev => ({
        ...prev,
        [accountId]: hbarBalance
      }));
    }
    return balance;
  }, [balances.getAccountBalance]);

  const refreshAllBalances = useCallback(async (accountIds: string[]) => {
    const balancePromises = accountIds.map(id => 
      balances.getAccountBalance.execute(id).then(balance => ({ 
        id, 
        balance: balance?.balances.find(b => b.code === 'HBAR')?.amount || 0 
      }))
    );
    
    const results = await Promise.all(balancePromises);
    const newBalances: Record<string, number> = {};
    
    results.forEach(({ id, balance }) => {
      newBalances[id] = balance;
    });
    
    setAccountBalances(newBalances);
    return results;
  }, [balances.getAccountBalance]);

  const getAccountBalanceLocal = useCallback((accountId: string) => {
    return accountBalances[accountId] || 0;
  }, [accountBalances]);

  const getMultiCurrencyBalance = useCallback(async (accountId: string) => {
    return await balances.getAccountBalance.execute(accountId);
  }, [balances.getAccountBalance]);

  return {
    selectedAccount,
    accountBalances,
    selectAccount,
    refreshAccountBalance,
    refreshAllBalances,
    getAccountBalanceLocal,
    getMultiCurrencyBalance,
    ...accounts,
    ...balances,
  };
}
