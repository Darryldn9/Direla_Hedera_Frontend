import { supabase } from '../../lib/supabase';
import { getApiConfig } from './config';

export interface KYCData {
  id: number;
  user_id: string;
  address: string | null;
  date_of_birth: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  id_number: string | null;
  occupation: string | null;
  phone: string | null;
}

export interface CreateKYCRequest {
  user_id: string;
  address?: string | null;
  date_of_birth?: string | null;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  id_number?: string | null;
  occupation?: string | null;
  phone?: string | null;
}

export interface UpdateKYCRequest {
  address?: string | null;
  date_of_birth?: string | null;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  id_number?: string | null;
  occupation?: string | null;
  phone?: string | null;
}

export interface GetKYCResponse {
  kyc: KYCData | null;
  success: boolean;
  message?: string;
}

export interface CreateKYCResponse {
  kyc: KYCData;
  success: boolean;
  message?: string;
}

export interface UpdateKYCResponse {
  kyc: KYCData;
  success: boolean;
  message?: string;
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

class KYCApiService {
  private baseUrl: string;

  constructor() {
    // Use the centralized API configuration
    const apiConfig = getApiConfig();
    this.baseUrl = process.env.EXPO_PUBLIC_API_URL || apiConfig.baseUrl;
  }

  /**
   * Get KYC data for a user
   */
  async getKYC(userId: string): Promise<GetKYCResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/kyc/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch KYC data');
      }

      return data;
    } catch (error) {
      console.error('Error fetching KYC data:', error);
      return {
        kyc: null,
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch KYC data'
      };
    }
  }

  /**
   * Create new KYC data for a user
   */
  async createKYC(data: CreateKYCRequest): Promise<CreateKYCResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/kyc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create KYC data');
      }

      return result;
    } catch (error) {
      console.error('Error creating KYC data:', error);
      throw error;
    }
  }

  /**
   * Update KYC data for a user
   */
  async updateKYC(userId: string, data: UpdateKYCRequest): Promise<UpdateKYCResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/kyc/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update KYC data');
      }

      return result;
    } catch (error) {
      console.error('Error updating KYC data:', error);
      throw error;
    }
  }

  /**
   * Create or update KYC data (upsert operation)
   */
  async upsertKYC(data: CreateKYCRequest): Promise<CreateKYCResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/kyc/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save KYC data');
      }

      return result;
    } catch (error) {
      console.error('Error upserting KYC data:', error);
      throw error;
    }
  }

  /**
   * Delete KYC data for a user
   */
  async deleteKYC(userId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/kyc/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete KYC data');
      }

      return result;
    } catch (error) {
      console.error('Error deleting KYC data:', error);
      throw error;
    }
  }

  /**
   * Get current user ID from Supabase auth
   */
  async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  }
}

export const kycApiService = new KYCApiService();
