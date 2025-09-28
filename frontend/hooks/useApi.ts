import { useState, useCallback } from 'react';
import { ApiResponse, IApiError } from '../types/api';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

/**
 * Generic hook for API calls
 */
export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('🌐 Making API call with args:', args);
      const response = await apiFunction(...args);
      console.log('📡 Raw API response:', response);
      
      if (response.success && response.data !== undefined) {
        console.log('✅ API success, data:', response.data);
        setState({
          data: response.data,
          loading: false,
          error: null,
          success: true,
        });
        return response.data;
      } else {
        console.log('❌ API error response:', response);
        setState({
          data: null,
          loading: false,
          error: response.error || 'Unknown error occurred',
          success: false,
        });
        return null;
      }
    } catch (error) {
      console.log('💥 API exception:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
        success: false,
      });
      return null;
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Hook for handling multiple API states
 */
export function useApiStates() {
  const [states, setStates] = useState<Record<string, UseApiState<any>>>({});

  const setApiState = useCallback((key: string, state: Partial<UseApiState<any>>) => {
    setStates(prev => ({
      ...prev,
      [key]: { ...prev[key], ...state }
    }));
  }, []);

  const getApiState = useCallback((key: string) => {
    return states[key] || {
      data: null,
      loading: false,
      error: null,
      success: false,
    };
  }, [states]);

  const resetApiState = useCallback((key: string) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        data: null,
        loading: false,
        error: null,
        success: false,
      }
    }));
  }, []);

  return {
    setApiState,
    getApiState,
    resetApiState,
    states,
  };
}
