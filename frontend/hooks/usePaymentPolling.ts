import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../services/api';

export interface PaymentPollOptions {
  toAccountId: string;
  amount: number;
  currency: string;
  expectedMemoContains?: string;
  timeoutMs?: number;
  intervalMs?: number;
  amountTolerance?: number;
}

export type PaymentPollStatus = 'idle' | 'polling' | 'confirmed' | 'timeout' | 'cancelled' | 'error';

export interface PaymentPollResult {
  status: PaymentPollStatus;
  remainingMs: number;
  start: () => void;
  cancel: () => void;
  error?: string;
}

export function usePaymentPolling(options?: PaymentPollOptions): PaymentPollResult {
  const [status, setStatus] = useState<PaymentPollStatus>('idle');
  const [remainingMs, setRemainingMs] = useState<number>(options?.timeoutMs ?? 120000); // 2 minutes default
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const optionsRef = useRef<PaymentPollOptions | undefined>(options);
  const errorRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    optionsRef.current = options;
    if (status === 'idle') {
      setRemainingMs(options?.timeoutMs ?? 120000); // 2 minutes default
    }
  }, [options, status]);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (tickerRef.current) clearInterval(tickerRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
    tickerRef.current = null;
  }, []);

  const cancel = useCallback(() => {
    clearTimers();
    setStatus('cancelled');
  }, [clearTimers]);

  const start = useCallback(() => {
    if (!optionsRef.current) return;
    const { toAccountId, timeoutMs = 120000, intervalMs = 5000 } = optionsRef.current; // 2 min timeout, 5 sec intervals
    if (!toAccountId) {
      errorRef.current = 'Missing toAccountId for polling';
      setStatus('error');
      return;
    }

    clearTimers();
    setStatus('polling');
    setRemainingMs(timeoutMs);
    // Countdown ticker
    tickerRef.current = setInterval(() => {
      setRemainingMs(prev => {
        const next = prev - 1000;
        return next >= 0 ? next : 0;
      });
    }, 1000);

    // Timeout guard
    timeoutRef.current = setTimeout(() => {
      clearTimers();
      setStatus('timeout');
    }, timeoutMs);

    // Start polling after a short delay to allow transaction to propagate
    setTimeout(() => {
      // Polling loop
      intervalRef.current = setInterval(async () => {
      try {
        const curr = optionsRef.current!;
        const limit = 20; // Check more recent transactions
        const resp = await api.hedera.getTransactionHistory(curr.toAccountId, limit);
        
        console.log('[POLLING] Transaction history response:', {
          success: resp.success,
          dataLength: resp.data?.length || 0,
          toAccountId: curr.toAccountId,
          expectedAmount: curr.amount,
          expectedCurrency: curr.currency,
          expectedMemo: curr.expectedMemoContains,
          transactions: resp.data?.map(tx => ({
            id: tx.transactionId,
            to: tx.to,
            from: tx.from,
            type: tx.type,
            amount: tx.amount,
            currency: tx.currency,
            memo: tx.memo
          })) || []
        });
        
        if (!resp.success || !resp.data) {
          console.log('[POLLING] No valid response data');
          return;
        }

        const tolerance = curr.amountTolerance ?? Math.max(0.01, curr.amount * 0.02); // 2% tolerance
        console.log('[POLLING] Looking for transactions with tolerance:', tolerance);
        
        // First try to find exact matches (with memo)
        let matches = resp.data.find(tx => {
          // Check if this is an incoming transaction to the target account
          const isIncoming = tx.to === curr.toAccountId && tx.type === 'RECEIVE';
          const currencyMatch = tx.currency === curr.currency;
          const amountMatch = Math.abs(tx.amount - curr.amount) <= tolerance;
          const txMemo = tx.memo || '';
          const memoMatch = curr.expectedMemoContains
            ? txMemo.includes(curr.expectedMemoContains)
            : true;
          
          console.log('[POLLING] Checking transaction (exact match):', {
            transactionId: tx.transactionId,
            amount: tx.amount,
            currency: tx.currency,
            expectedAmount: curr.amount,
            expectedCurrency: curr.currency,
            amountMatch,
            currencyMatch,
            isIncoming,
            memo: txMemo,
            expectedMemo: curr.expectedMemoContains,
            memoMatch,
            type: tx.type,
            to: tx.to,
            from: tx.from,
            targetAccount: curr.toAccountId
          });
          
          return isIncoming && currencyMatch && amountMatch && memoMatch;
        });

        // If no exact match found and we have a memo requirement, try without memo matching
        if (!matches && curr.expectedMemoContains) {
          console.log('[POLLING] No exact match found, trying without memo requirement...');
          matches = resp.data.find(tx => {
            const isIncoming = tx.to === curr.toAccountId && tx.type === 'RECEIVE';
            const currencyMatch = tx.currency === curr.currency;
            const amountMatch = Math.abs(tx.amount - curr.amount) <= tolerance;
            
            console.log('[POLLING] Checking transaction (amount only):', {
              transactionId: tx.transactionId,
              amount: tx.amount,
              currency: tx.currency,
              expectedAmount: curr.amount,
              expectedCurrency: curr.currency,
              amountMatch,
              currencyMatch,
              isIncoming,
              type: tx.type,
              to: tx.to,
              from: tx.from,
              targetAccount: curr.toAccountId
            });
            
            return isIncoming && currencyMatch && amountMatch;
          });
        }

        if (matches) {
          console.log('[POLLING] Payment confirmed!', matches);
          clearTimers();
          setStatus('confirmed');
        } else {
          console.log('[POLLING] No matching transaction found');
        }
      } catch (e) {
        console.error('[POLLING] Error during polling:', e);
        // Keep polling but record error once
        if (!errorRef.current) {
          errorRef.current = e instanceof Error ? e.message : 'Polling error';
        }
      }
    }, intervalMs);
    }, 2000); // 2 second delay before starting to poll
  }, [clearTimers]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    status,
    remainingMs,
    start,
    cancel,
    error: errorRef.current,
  };
}


