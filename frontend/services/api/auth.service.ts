import { BaseApiService } from './base';
import { API_ENDPOINTS } from './config';
import { 
  User, 
  CreateUserRequest, 
  CreateUserResponse, 
  ApiResponse 
} from '../../types/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: any;
  session: any;
}

export interface SignupRequest {
  email: string;
  password: string;
}

export interface SignupResponse {
  user: any;
  session: any;
}

export class AuthService extends BaseApiService {
  /**
   * Sign up a new user with email and password
   */
  async signUp(credentials: SignupRequest): Promise<ApiResponse<SignupResponse>> {
    return this.post<SignupResponse>(API_ENDPOINTS.AUTH_SIGNUP, credentials);
  }

  /**
   * Sign in with email and password
   */
  async signIn(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.post<LoginResponse>(API_ENDPOINTS.AUTH_SIGNIN, credentials);
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<ApiResponse<void>> {
    return this.post<void>(API_ENDPOINTS.AUTH_LOGOUT, {});
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.get<any>(API_ENDPOINTS.AUTH_ME);
  }

  /**
   * Create a new user account (legacy method - use signUp instead)
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
  async userExists(userId: string | number): Promise<ApiResponse<boolean>> {
    try {
      const result = await this.getUserById(userId);
      return {
        success: true,
        data: !!result.data,
        message: 'User existence checked'
      };
    } catch (error) {
      return {
        success: false,
        data: false,
        error: 'User not found'
      };
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
