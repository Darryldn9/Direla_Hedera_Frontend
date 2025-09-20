import { BaseApiService } from './base';
import { API_ENDPOINTS } from './config';
import { 
  User, 
  CreateUserRequest, 
  CreateUserResponse, 
  ApiResponse 
} from '../../types/api';

export class AuthService extends BaseApiService {
  /**
   * Create a new user account
   * This automatically creates a default Hedera account
   */
  async createUser(userData: CreateUserRequest): Promise<ApiResponse<CreateUserResponse>> {
    return this.post<CreateUserResponse>(API_ENDPOINTS.USERS, userData);
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<ApiResponse<User[]>> {
    return this.get<User[]>(API_ENDPOINTS.USERS);
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string | number): Promise<ApiResponse<User>> {
    return this.get<User>(API_ENDPOINTS.USER_BY_ID(userId));
  }

  /**
   * Update user balance
   */
  async updateUserBalance(userId: string | number, balance: number): Promise<ApiResponse<User>> {
    return this.put<User>(API_ENDPOINTS.USER_BY_ID(userId), { balance });
  }

  /**
   * Delete user (if needed)
   */
  async deleteUser(userId: string | number): Promise<ApiResponse<void>> {
    return this.delete<void>(API_ENDPOINTS.USER_BY_ID(userId));
  }

  /**
   * Check if user exists
   */
  async userExists(userId: string | number): Promise<boolean> {
    try {
      await this.getUserById(userId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate user credentials (placeholder for future implementation)
   * This would typically involve checking against Supabase Auth
   */
  async validateCredentials(email: string, password: string): Promise<boolean> {
    // TODO: Implement Supabase Auth validation
    // This is a placeholder method
    return true;
  }

  /**
   * Get user profile information
   */
  async getUserProfile(userId: string | number): Promise<ApiResponse<User>> {
    return this.getUserById(userId);
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string | number, updates: Partial<User>): Promise<ApiResponse<User>> {
    return this.put<User>(API_ENDPOINTS.USER_BY_ID(userId), updates);
  }
}
