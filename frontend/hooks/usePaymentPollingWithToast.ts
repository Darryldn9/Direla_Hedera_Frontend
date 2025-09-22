import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../services/api';
import { useToast } from './useToast';

export interface PaymentPollOptions {
  toAccountId: string;
  amountHBAR: number;
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

export function usePaymentPollingWithToast(options?: PaymentPollOptions): PaymentPollResult {
  const [status, setStatus] = useState<PaymentPollStatus>('idle');
  const [remainingMs, setRemainingMs] = useState<number>(options?.timeoutMs ?? 60000);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const optionsRef = useRef<PaymentPollOptions | undefined>(options);
  const errorRef = useRef<string | undefined>(undefined);
  const { showInfo, showSuccess, showError, hideAllToasts } = useToast();

  useEffect(() => {
    optionsRef.current = options;
    if (status === 'idle') {
      setRemainingMs(options?.timeoutMs ?? 60000);
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
    hideAllToasts();
  }, [clearTimers, hideAllToasts]);

  const start = useCallback(() => {
    if (!optionsRef.current) return;
    const { toAccountId, timeoutMs = 60000, intervalMs = 10000 } = optionsRef.current;
    if (!toAccountId) {
      errorRef.current = 'Missing toAccountId for polling';
      setStatus('error');
      showError('Payment Polling Error', 'Missing recipient account ID');
      return;
    }

    clearTimers();
    setStatus('polling');
    setRemainingMs(timeoutMs);
    
    // Show polling started toast
    showInfo(
      'Awaiting Payment',
      `Waiting for payment confirmation...\nTimeout in ${Math.floor(timeoutMs / 1000)}s`,
      0 // No auto-dismiss
    );
    
    // Countdown ticker
    tickerRef.current = setInterval(() => {
      setRemainingMs(prev => {
        const next = prev - 1000;
        if (next <= 0) {
          return 0;
        }
        
        // Update toast with remaining time every 10 seconds
        if (next % 10000 === 0) {
          showInfo(
            'Awaiting Payment',
            `Waiting for payment confirmation...\nTimeout in ${Math.floor(next / 1000)}s`,
            0
          );
        }
        
        return next;
      });
    }, 1000);

    // Timeout guard
    timeoutRef.current = setTimeout(() => {
      clearTimers();
      setStatus('timeout');
      showError(
        'Payment Timeout',
        'Payment confirmation timed out. Please check if the payment was sent.',
        5000
      );
    }, timeoutMs);

    // Polling loop
    intervalRef.current = setInterval(async () => {
      try {
        const curr = optionsRef.current!;
        const limit = 10;
        const resp = await api.hedera.getTransactionHistory(curr.toAccountId, limit);
        if (!resp.success || !resp.data) return;

        const tolerance = curr.amountTolerance ?? Math.max(0.00000001, curr.amountHBAR * 0.005);
        const matches = resp.data.find(tx => {
          const isIncoming = tx.to === curr.toAccountId || tx.type === 'RECEIVE';
          const amountMatch = Math.abs(tx.amount - curr.amountHBAR) <= tolerance;
          const txMemo = (tx as any).memo as string | undefined;
          const memoMatch = curr.expectedMemoContains
            ? (txMemo ? txMemo.includes(curr.expectedMemoContains) : true)
            : true;
          return isIncoming && amountMatch && memoMatch;
        });

        if (matches) {
          clearTimers();
          setStatus('confirmed');
          showSuccess(
            'Payment Confirmed!',
            `Payment of ${curr.amountHBAR} HBAR received and confirmed on Hedera network.`,
            5000
          );
        }
      } catch (e) {
        // Keep polling but record error once
        if (!errorRef.current) {
          errorRef.current = e instanceof Error ? e.message : 'Polling error';
          showError(
            'Payment Polling Error',
            'Error checking payment status. Continuing to poll...',
            3000
          );
        }
      }
    }, intervalMs);
  }, [clearTimers, showInfo, showSuccess, showError]);

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
