import { getSupabaseClient } from '../database/connection.js';
import { TABLES } from '../database/schema.js';
import { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest, 
  UserService,
  HederaAccountService
} from '../types/index.js';
import { logger } from '../utils/logger.js';
import { ExternalApiInfrastructure } from '../infrastructure/external-api.js';
import { AuthService } from './auth.service.js';
import { nanoid } from 'nanoid';

export class UserServiceImpl implements UserService {
  private externalApi: ExternalApiInfrastructure;
  private authService: AuthService;
  private hederaAccountService: HederaAccountService | null;

  constructor(externalApi: ExternalApiInfrastructure, authService: AuthService, hederaAccountService?: HederaAccountService | null) {
    this.externalApi = externalApi;
    this.authService = authService;
    this.hederaAccountService = hederaAccountService || null;
  }

  // Method to set HederaAccountService after initialization (to break circular dependency)
  setHederaAccountService(hederaAccountService: HederaAccountService): void {
    this.hederaAccountService = hederaAccountService;
  }

  async createUser(data: CreateUserRequest): Promise<User> {
    const supabase = getSupabaseClient();
    
    try {
      logger.info('Creating new user', { email: data.email });
      
      // First, create the user in Supabase Auth
      const authResponse = await this.authService.signUp(data.email, data.password);
      
      if (authResponse.error || !authResponse.user) {
        logger.error('Failed to create user in auth', { error: authResponse.error, email: data.email });
        throw new Error(`Failed to create user: ${authResponse.error?.message || 'Unknown auth error'}`);
      }

      // Then create the user record in our database with default balance of 0
      const { data: newUser, error } = await supabase
        .from(TABLES.USERS)
        .insert({
          balance: 0, // Default balance to 0
          user_id: authResponse.user.id, // Use the auth user ID
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any)
        .select()
        .single();

      if (error) {
        logger.error('Failed to create user in database', { error, data });
        throw new Error(`Failed to create user: ${error.message}`);
      }

      // Automatically create a Hedera account for the new user (if HederaAccountService is available)
      if (this.hederaAccountService) {
        try {
          logger.info('Creating default Hedera account for new user', { 
            userId: (newUser as any).id, 
            authUserId: authResponse.user.id 
          });

          const nanoId = nanoid(10);
          
          const hederaAccount = await this.hederaAccountService.createAccount({
            user_id: authResponse.user.id,
            alias: `${data.email?.split('@')[0] || 'user'}${nanoId}`,
            initial_balance: 0
          });
          
          logger.info('Default Hedera account created successfully', { 
            userId: (newUser as any).id,
            hederaAccountId: hederaAccount.account_id
          });
        } catch (hederaError) {
          // Log the error but don't fail user creation
          logger.error('Failed to create default Hedera account for user', { 
            userId: (newUser as any).id, 
            error: hederaError 
          });
          // Note: We continue with user creation even if Hedera account creation fails
        }
      } else {
        logger.warn('HederaAccountService not available, skipping automatic Hedera account creation', {
          userId: (newUser as any).id
        });
      }

      // Notify external service
      await this.externalApi.notifyExternalService({
        userId: (newUser as any).id,
        event: 'user_created',
        data: { balance: (newUser as any).balance }
      });

      logger.info('User created successfully', { userId: (newUser as any).id, authUserId: authResponse.user.id });
      return newUser as any;
    } catch (error) {
      logger.error('Failed to create user', { error, data });
      throw error;
    }
  }

  async getUserById(id: number): Promise<User | null> {
    const supabase = getSupabaseClient();
    
    try {
      logger.debug('Fetching user by ID', { userId: id });
      
      const { data: user, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          logger.debug('User not found', { userId: id });
          return null;
        }
        logger.error('Failed to get user by ID', { userId: id, error });
        throw new Error(`Failed to get user: ${error.message}`);
      }

      logger.debug('User found', { userId: id });
      return user;
    } catch (error) {
      logger.error('Failed to get user by ID', { userId: id, error });
      throw error;
    }
  }

  async getUserByUserId(userId: string): Promise<User | null> {
    const supabase = getSupabaseClient();
    
    try {
      logger.debug('Fetching user by user_id', { userId });
      
      const { data: user, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          logger.debug('User not found', { userId });
          return null;
        }
        logger.error('Failed to get user by user_id', { userId, error });
        throw new Error(`Failed to get user: ${error.message}`);
      }

      logger.debug('User found', { userId });
      return user;
    } catch (error) {
      logger.error('Failed to get user by user_id', { userId, error });
      throw error;
    }
  }

  async updateUser(id: number, data: UpdateUserRequest): Promise<User | null> {
    const supabase = getSupabaseClient();
    
    try {
      logger.info('Updating user', { userId: id, data });
      
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (data.balance !== undefined) {
        updateData.balance = data.balance;
      }

      const { data: updatedUser, error } = await supabase
        .from(TABLES.USERS)
        .update(updateData as any)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          logger.warn('User not found for update', { userId: id });
          return null;
        }
        logger.error('Failed to update user', { userId: id, error, data });
        throw new Error(`Failed to update user: ${error.message}`);
      }

      // Notify external service
      await this.externalApi.notifyExternalService({
        userId: (updatedUser as any).id,
        event: 'balance_updated',
        data: { balance: (updatedUser as any).balance }
      });

      logger.info('User updated successfully', { userId: id });
      return updatedUser as any;
    } catch (error) {
      logger.error('Failed to update user', { userId: id, error, data });
      throw error;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    const supabase = getSupabaseClient();
    
    try {
      logger.info('Deleting user', { userId: id });
      
      const { data: deletedUser, error } = await supabase
        .from(TABLES.USERS)
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          logger.warn('User not found for deletion', { userId: id });
          return false;
        }
        logger.error('Failed to delete user', { userId: id, error });
        throw new Error(`Failed to delete user: ${error.message}`);
      }

      // Notify external service
      await this.externalApi.notifyExternalService({
        userId: id,
        event: 'user_deleted',
        data: {}
      });

      logger.info('User deleted successfully', { userId: id });
      return true;
    } catch (error) {
      logger.error('Failed to delete user', { userId: id, error });
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    const supabase = getSupabaseClient();
    
    try {
      logger.debug('Fetching all users');
      
      const { data: users, error } = await supabase
        .from(TABLES.USERS)
        .select('*');
      
      if (error) {
        logger.error('Failed to get all users', { error });
        throw new Error(`Failed to get users: ${error.message}`);
      }
      
      logger.debug('Users fetched', { count: users?.length || 0 });
      return users || [];
    } catch (error) {
      logger.error('Failed to get all users', { error });
      throw error;
    }
  }
}