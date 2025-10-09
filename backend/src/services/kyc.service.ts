import { supabase } from '../database/connection';
import { 
  KYCData, 
  CreateKYCRequest, 
  UpdateKYCRequest, 
  KYCService,
  ApiResponse 
} from '../types';

export class KYCServiceImpl implements KYCService {
  /**
   * Create a new KYC record for a user
   */
  async createKYC(data: CreateKYCRequest): Promise<KYCData> {
    try {
      const { data: kyc, error } = await supabase
        .from('kyc')
        .insert([data])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create KYC record: ${error.message}`);
      }

      if (!kyc) {
        throw new Error('Failed to create KYC record: No data returned');
      }

      return kyc as KYCData;
    } catch (error) {
      console.error('Error creating KYC record:', error);
      throw error;
    }
  }

  /**
   * Get KYC data by user ID
   */
  async getKYCByUserId(userId: string): Promise<KYCData | null> {
    try {
      console.log('🔍 KYC Service: Getting KYC data for user:', userId);
      const { data: kyc, error } = await supabase
        .from('kyc')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          console.log('📭 KYC Service: No KYC data found for user:', userId);
          return null;
        }
        console.error('❌ KYC Service: Database error:', error);
        throw new Error(`Failed to get KYC record: ${error.message}`);
      }

      console.log('✅ KYC Service: KYC data retrieved:', kyc);
      return kyc as KYCData;
    } catch (error) {
      console.error('💥 KYC Service: Exception getting KYC record:', error);
      throw error;
    }
  }

  /**
   * Update KYC data for a user
   */
  async updateKYC(userId: string, data: UpdateKYCRequest): Promise<KYCData | null> {
    try {
      const { data: kyc, error } = await supabase
        .from('kyc')
        .update(data)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update KYC record: ${error.message}`);
      }

      if (!kyc) {
        throw new Error('KYC record not found for user');
      }

      return kyc as KYCData;
    } catch (error) {
      console.error('Error updating KYC record:', error);
      throw error;
    }
  }

  /**
   * Delete KYC data for a user
   */
  async deleteKYC(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('kyc')
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete KYC record: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting KYC record:', error);
      throw error;
    }
  }

  /**
   * Create or update KYC data (upsert operation)
   */
  async upsertKYC(data: CreateKYCRequest): Promise<KYCData> {
    try {
      // First try to get existing KYC data
      const existingKYC = await this.getKYCByUserId(data.user_id);
      
      if (existingKYC) {
        // Update existing record
        const updateData: UpdateKYCRequest = {
          address: data.address ?? null,
          date_of_birth: data.date_of_birth ?? null,
          email: data.email ?? null,
          first_name: data.first_name ?? null,
          last_name: data.last_name ?? null,
          id_number: data.id_number ?? null,
          occupation: data.occupation ?? null,
          phone: data.phone ?? null,
        };
        
        const updatedKYC = await this.updateKYC(data.user_id, updateData);
        if (!updatedKYC) {
          throw new Error('Failed to update KYC record');
        }
        return updatedKYC;
      } else {
        // Create new record
        return await this.createKYC(data);
      }
    } catch (error) {
      console.error('Error upserting KYC record:', error);
      throw error;
    }
  }

  /**
   * Validate KYC data
   */
  validateKYCData(data: CreateKYCRequest | UpdateKYCRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate email format
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Email format is invalid');
    }

    // Validate first name length
    if (data.first_name && data.first_name.trim().length < 2) {
      errors.push('First name must be at least 2 characters long');
    }

    // Validate last name length
    if (data.last_name && data.last_name.trim().length < 2) {
      errors.push('Last name must be at least 2 characters long');
    }

    // Validate phone number format (basic validation)
    if (data.phone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(data.phone)) {
      errors.push('Phone number format is invalid');
    }

    // Validate date of birth format (YYYY-MM-DD)
    if (data.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(data.date_of_birth)) {
      errors.push('Date of birth must be in YYYY-MM-DD format');
    }

    // Validate ID number (basic validation for South African ID)
    if (data.id_number && !/^\d{13}$/.test(data.id_number.replace(/\s/g, ''))) {
      errors.push('ID number must be 13 digits');
    }

    // Validate address length
    if (data.address && data.address.length < 10) {
      errors.push('Address must be at least 10 characters long');
    }

    // Validate occupation length
    if (data.occupation && data.occupation.length < 2) {
      errors.push('Occupation must be at least 2 characters long');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const kycService = new KYCServiceImpl();
