import { getSupabaseClient } from '../database/connection.js';
import { TABLES } from '../database/schema.js';
import { 
  HederaAccount, 
  CreateHederaAccountRequest, 
  UpdateHederaAccountRequest,
  HederaAccountService,
  UserService,
  User
} from '../types/index.js';
import { logger } from '../utils/logger.js';
import { HederaInfrastructure } from '../infrastructure/hedera.js';
import { ExternalApiInfrastructure } from '../infrastructure/external-api.js';
import { AuthService } from './auth.service.js';
import { cacheGet, cacheSet, cacheKeys, cacheDel } from '../utils/redis.js';

export class HederaAccountServiceImpl implements HederaAccountService {
  private hederaInfra: HederaInfrastructure;
  private externalApi: ExternalApiInfrastructure;
  private userService: UserService;
  private authService: AuthService;

  constructor(hederaInfra: HederaInfrastructure, externalApi: ExternalApiInfrastructure, userService: UserService, authService: AuthService) {
    this.hederaInfra = hederaInfra;
    this.externalApi = externalApi;
    this.userService = userService;
    this.authService = authService;
  }

  async createAccount(data: CreateHederaAccountRequest): Promise<HederaAccount> {
    const supabase = getSupabaseClient();
    
    try {
      logger.info('Creating new Hedera account', { 
        alias: data.alias, 
        initial_balance: data.initial_balance,
        user_id: data.user_id
      });
      
      // Verify that the user exists in our database
      const user = await this.userService.getUserByUserId(data.user_id);
      
      if (!user) {
        logger.error('User not found in database', { user_id: data.user_id });
        throw new Error(`User with ID ${data.user_id} not found. User must exist before creating Hedera account.`);
      }
      
      logger.info('User found in database', { user_id: data.user_id, user_db_id: user.id });
      
      // Create account on Hedera network and get the actual private key
      const accountData = await this.hederaInfra.createAccount(data.initial_balance || 0, data.alias);
      const { accountId, privateKey, publicKey } = accountData;
      
      logger.info('Hedera account created with actual keys', { 
        accountId, 
        alias: data.alias || 'No alias provided',
        hasPrivateKey: !!privateKey,
        hasPublicKey: !!publicKey
      });
      
      const { data: newAccount, error } = await supabase
        .from(TABLES.HEDERA_ACCOUNTS)
        .insert({
          account_id: accountId,
          private_key: privateKey, // Now using the actual private key from Hedera
          public_key: publicKey,   // Now using the actual public key from Hedera
          alias: data.alias || null,
          balance: data.initial_balance || 0,
          is_active: true,
          user_id: data.user_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any)
        .select()
        .single();

      if (error) {
        logger.error('Failed to create Hedera account in database', { error, data });
        throw new Error(`Failed to create Hedera account: ${error.message}`);
      }

      // Notify external service
      await this.externalApi.notifyExternalService({
        userId: (newAccount as any).id,
        event: 'hedera_account_created',
        data: { 
          account_id: (newAccount as any).account_id, 
          alias: data.alias,
          user_id: data.user_id,
          user_db_id: user.id
        }
      });

      logger.info('Hedera account created successfully', { 
        account_id: (newAccount as any).account_id, 
        alias: data.alias,
        user_id: data.user_id,
        user_db_id: user.id
      });
      
      return newAccount as any;
    } catch (error) {
      logger.error('Failed to create Hedera account', { error, data });
      throw error;
    }
  }

  async getAccountById(id: number): Promise<HederaAccount | null> {
    const supabase = getSupabaseClient();
    
    try {
      logger.debug('Fetching Hedera account by ID', { accountId: id });
      
      const { data: account, error } = await supabase
        .from(TABLES.HEDERA_ACCOUNTS)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          logger.debug('Hedera account not found', { accountId: id });
          return null;
        }
        logger.error('Failed to get Hedera account by ID', { accountId: id, error });
        throw new Error(`Failed to get Hedera account: ${error.message}`);
      }

      // logger.debug('Hedera account found', { accountId: id });
      return account;
    } catch (error) {
      logger.error('Failed to get Hedera account by ID', { accountId: id, error });
      throw error;
    }
  }

  async getAccountByAccountId(accountId: string): Promise<HederaAccount | null> {
    const supabase = getSupabaseClient();
    
    try {
      logger.debug('Fetching Hedera account by account ID', { accountId });
      
      const { data: account, error } = await supabase
        .from(TABLES.HEDERA_ACCOUNTS)
        .select('*')
        .eq('account_id', accountId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          logger.debug('Hedera account not found', { accountId });
          return null;
        }
        logger.error('Failed to get Hedera account by account ID', { accountId, error });
        throw new Error(`Failed to get Hedera account: ${error.message}`);
      }

      // logger.debug('Hedera account found', { accountId });
      return account;
    } catch (error) {
      logger.error('Failed to get Hedera account by account ID', { accountId, error });
      throw error;
    }
  }

  async getAccountsByUserId(userId: string): Promise<HederaAccount[]> {
    const supabase = getSupabaseClient();
    
    try {
      logger.debug('Fetching Hedera accounts by user ID', { userId });
      
      const { data: accounts, error } = await supabase
        .from(TABLES.HEDERA_ACCOUNTS)
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        logger.error('Failed to get Hedera accounts by user ID', { userId, error });
        throw new Error(`Failed to get Hedera accounts: ${error.message}`);
      }

      logger.debug('Hedera accounts found', { userId, count: accounts?.length || 0 });
      return accounts || [];
    } catch (error) {
      logger.error('Failed to get Hedera accounts by user ID', { userId, error });
      throw error;
    }
  }

  async updateAccount(id: number, data: UpdateHederaAccountRequest): Promise<HederaAccount | null> {
    const supabase = getSupabaseClient();
    
    try {
      logger.info('Updating Hedera account', { accountId: id, data });
      
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (data.alias !== undefined) {
        updateData.alias = data.alias;
      }
      
      if (data.is_active !== undefined) {
        updateData.is_active = data.is_active;
      }

      if (data.currency !== undefined) {
        updateData.currency = data.currency;
      }

      const { data: updatedAccount, error } = await supabase
        .from(TABLES.HEDERA_ACCOUNTS)
        .update(updateData as any)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          logger.warn('Hedera account not found for update', { accountId: id });
          return null;
        }
        logger.error('Failed to update Hedera account', { accountId: id, error, data });
        throw new Error(`Failed to update Hedera account: ${error.message}`);
      }

      // Notify external service
      await this.externalApi.notifyExternalService({
        userId: (updatedAccount as any).id,
        event: 'hedera_account_updated',
        data: { 
          account_id: (updatedAccount as any).account_id, 
          alias: data.alias, 
          is_active: data.is_active,
          currency: data.currency
        }
      });

      logger.info('Hedera account updated successfully', { accountId: id });
      return updatedAccount as any;
    } catch (error) {
      logger.error('Failed to update Hedera account', { accountId: id, error, data });
      throw error;
    }
  }

  async deleteAccount(id: number): Promise<boolean> {
    const supabase = getSupabaseClient();
    
    try {
      logger.info('Deleting Hedera account', { accountId: id });
      
      const { data: deletedAccount, error } = await supabase
        .from(TABLES.HEDERA_ACCOUNTS)
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          logger.warn('Hedera account not found for deletion', { accountId: id });
          return false;
        }
        logger.error('Failed to delete Hedera account', { accountId: id, error });
        throw new Error(`Failed to delete Hedera account: ${error.message}`);
      }

      // Notify external service
      await this.externalApi.notifyExternalService({
        userId: id,
        event: 'hedera_account_deleted',
        data: { account_id: (deletedAccount as any).account_id }
      });

      logger.info('Hedera account deleted successfully', { accountId: id });
      return true;
    } catch (error) {
      logger.error('Failed to delete Hedera account', { accountId: id, error });
      throw error;
    }
  }

  async getAllAccounts(): Promise<HederaAccount[]> {
    const supabase = getSupabaseClient();
    
    try {
      logger.debug('Fetching all Hedera accounts');
      
      const { data: accounts, error } = await supabase
        .from(TABLES.HEDERA_ACCOUNTS)
        .select('*');
      
      if (error) {
        logger.error('Failed to get all Hedera accounts', { error });
        throw new Error(`Failed to get Hedera accounts: ${error.message}`);
      }
      
      logger.debug('Hedera accounts fetched', { count: accounts?.length || 0 });
      return accounts || [];
    } catch (error) {
      logger.error('Failed to get all Hedera accounts', { error });
      throw error;
    }
  }

  async getActiveAccounts(): Promise<HederaAccount[]> {
    const supabase = getSupabaseClient();
    
    try {
      logger.debug('Fetching active Hedera accounts');
      
      const { data: accounts, error } = await supabase
        .from(TABLES.HEDERA_ACCOUNTS)
        .select('*')
        .eq('is_active', true);
      
      if (error) {
        logger.error('Failed to get active Hedera accounts', { error });
        throw new Error(`Failed to get active Hedera accounts: ${error.message}`);
      }
      
      logger.debug('Active Hedera accounts fetched', { count: accounts?.length || 0 });
      return accounts || [];
    } catch (error) {
      logger.error('Failed to get active Hedera accounts', { error });
      throw error;
    }
  }

  async updateAccountBalance(accountId: string, balance: number): Promise<void> {
    const supabase = getSupabaseClient();
    
    try {
      logger.debug('Updating account balance', { accountId, balance });
      
      const { error } = await supabase
        .from(TABLES.HEDERA_ACCOUNTS)
        .update({ 
          balance,
          updated_at: new Date().toISOString()
        })
        .eq('account_id', accountId);
      
      if (error) {
        logger.error('Failed to update account balance', { accountId, balance, error });
        throw new Error(`Failed to update account balance: ${error.message}`);
      }
      
      logger.debug('Account balance updated', { accountId, balance });

      // Update/Invalidate cache
      await cacheSet<number>(cacheKeys.balance(accountId), balance);
    } catch (error) {
      logger.error('Failed to update account balance', { accountId, balance, error });
      throw error;
    }
  }

  async getAccountBalance(accountId: string): Promise<{ code: string; amount: number }[]> {
    try {
      // Try cache first
      const key = cacheKeys.balance(accountId);
      const cached = await cacheGet<{ code: string; amount: number }[]>(key);
      if (cached !== null) {
        logger.debug('Account balance served from cache', { accountId });
        return cached;
      }

      logger.debug('Cache miss. Fetching account balance from Hedera network', { accountId });
      const balance = await this.hederaInfra.getAccountBalance(accountId);

      // Store in cache
      await cacheSet<{ code: string; amount: number }[]>(key, balance);

      logger.info('Account balance retrieved', { accountId, balance });
      return balance;
    } catch (error) {
      logger.error('Failed to get account balance', { accountId, error });
      throw error;
    }
  }

  async getAccountInfo(accountId: string): Promise<any> {
    try {
      logger.debug('Getting account info from Hedera network', { accountId });
      
      const accountInfo = await this.hederaInfra.getAccountInfo(accountId);
      
      logger.debug('Account info retrieved', { accountId });
      return accountInfo;
    } catch (error) {
      logger.error('Failed to get account info', { accountId, error });
      throw error;
    }
  }
}