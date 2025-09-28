import { getSupabaseClient } from '../database/connection.js';
import { TABLES } from '../database/schema.js';
import { SupabaseAuthResponse, User } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class AuthService {
  async signUp(email: string, password: string): Promise<SupabaseAuthResponse> {
    const supabase = getSupabaseClient();
    
    try {
      logger.info('Attempting user signup', { email });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        logger.error('Signup failed', { error: error.message, email });
        return {
          user: null,
          session: null,
          error: {
            message: error.message,
            status: error.status || 500
          }
        };
      }

      logger.info('User signup successful', { 
        userId: data.user?.id, 
        email: data.user?.email 
      });

      return {
        user: data.user,
        session: data.session,
        error: null
      };
    } catch (error) {
      logger.error('Signup error', { error, email });
      return {
        user: null,
        session: null,
        error: {
          message: 'Internal server error during signup',
          status: 500
        }
      };
    }
  }

  async signIn(email: string, password: string): Promise<SupabaseAuthResponse> {
    const supabase = getSupabaseClient();
    
    try {
      logger.info('Attempting user signin', { email });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        logger.error('Signin failed', { error: error.message, email });
        return {
          user: null,
          session: null,
          error: {
            message: error.message,
            status: error.status || 500
          }
        };
      }

      logger.info('User signin successful', { 
        userId: data.user?.id, 
        email: data.user?.email 
      });

      return {
        user: data.user,
        session: data.session,
        error: null
      };
    } catch (error) {
      logger.error('Signin error', { error, email });
      return {
        user: null,
        session: null,
        error: {
          message: 'Internal server error during signin',
          status: 500
        }
      };
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    const supabase = getSupabaseClient();
    
    try {
      logger.debug('Fetching user by ID from Supabase Auth', { userId });
      
      const { data: { user }, error } = await supabase.auth.getUser();

      const { data: userData, error: userError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        logger.error('Failed to get user from Supabase Auth', { error: error.message, userId });
        return null;
      }

      if (user?.id !== userId) {
        logger.warn('User ID mismatch', { requestedUserId: userId, actualUserId: user?.id });
        return null;
      }

      logger.debug('User found in Supabase Auth', { userId });
      return userData;
    } catch (error) {
      logger.error('Error getting user from Supabase Auth', { error, userId });
      return null;
    }
  }
}
