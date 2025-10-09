import { useState, useEffect } from 'react';
import { kycApiService, KYCData, CreateKYCRequest, UpdateKYCRequest } from '../services/api/kyc.api';
import { useUserManagement } from './useAuth';

export interface UseKYCReturn {
  kycData: KYCData | null;
  loading: boolean;
  error: string | null;
  createKYC: (data: CreateKYCRequest) => Promise<boolean>;
  updateKYC: (data: UpdateKYCRequest) => Promise<boolean>;
  upsertKYC: (data: CreateKYCRequest) => Promise<boolean>;
  deleteKYC: () => Promise<boolean>;
  refreshKYC: () => Promise<void>;
}

export function useKYC(): UseKYCReturn {
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useUserManagement();

  // Load KYC data when user changes
  useEffect(() => {
    console.log('🔍 useKYC: User changed:', currentUser?.user_id);
    if (currentUser?.user_id) {
      loadKYCData();
    } else {
      setKycData(null);
    }
  }, [currentUser?.user_id]);

  const loadKYCData = async () => {
    if (!currentUser?.user_id) return;

    console.log('🔄 useKYC: Loading KYC data for user:', currentUser.user_id);
    setLoading(true);
    setError(null);

    try {
      const response = await kycApiService.getKYC(currentUser.user_id);
      console.log('📡 useKYC: API response:', response);
      
      if (response.success) {
        console.log('✅ useKYC: KYC data loaded:', response.kyc);
        setKycData(response.kyc);
      } else {
        console.log('❌ useKYC: API error:', response.message);
        setError(response.message || 'Failed to load KYC data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load KYC data';
      console.error('💥 useKYC: Exception loading KYC data:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createKYC = async (data: CreateKYCRequest): Promise<boolean> => {
    if (!currentUser?.user_id) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await kycApiService.createKYC({
        ...data,
        user_id: currentUser.user_id,
      });

      if (response.success) {
        setKycData(response.kyc);
        return true;
      } else {
        setError(response.message || 'Failed to create KYC data');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create KYC data';
      setError(errorMessage);
      console.error('Error creating KYC data:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateKYC = async (data: UpdateKYCRequest): Promise<boolean> => {
    if (!currentUser?.user_id) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await kycApiService.updateKYC(currentUser.user_id, data);

      if (response.success) {
        setKycData(response.kyc);
        return true;
      } else {
        setError(response.message || 'Failed to update KYC data');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update KYC data';
      setError(errorMessage);
      console.error('Error updating KYC data:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const upsertKYC = async (data: CreateKYCRequest): Promise<boolean> => {
    if (!currentUser?.user_id) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await kycApiService.upsertKYC({
        ...data,
        user_id: currentUser.user_id,
      });

      if (response.success) {
        setKycData(response.kyc);
        return true;
      } else {
        setError(response.message || 'Failed to save KYC data');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save KYC data';
      setError(errorMessage);
      console.error('Error upserting KYC data:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteKYC = async (): Promise<boolean> => {
    if (!currentUser?.user_id) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await kycApiService.deleteKYC(currentUser.user_id);

      if (response.success) {
        setKycData(null);
        return true;
      } else {
        setError(response.message || 'Failed to delete KYC data');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete KYC data';
      setError(errorMessage);
      console.error('Error deleting KYC data:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshKYC = async (): Promise<void> => {
    await loadKYCData();
  };

  return {
    kycData,
    loading,
    error,
    createKYC,
    updateKYC,
    upsertKYC,
    deleteKYC,
    refreshKYC,
  };
}
