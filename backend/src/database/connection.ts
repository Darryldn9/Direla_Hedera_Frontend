import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';
import { Database } from './types.js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  logger.error('Missing Supabase configuration', { 
    hasUrl: !!supabaseUrl, 
    hasKey: !!supabaseKey 
  });
  throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
}

let supabase: ReturnType<typeof createClient<Database>>;

export const getSupabaseClient = () => {
  if (!supabase) {
    try {
      supabase = createClient<Database>(supabaseUrl, supabaseKey);
      logger.info('Supabase client initialized', { url: supabaseUrl });
    } catch (error) {
      logger.error('Failed to initialize Supabase client', { error, url: supabaseUrl });
      throw error;
    }
  }
  return supabase;
};

export const closeSupabaseConnection = async () => {
  // Supabase client doesn't require explicit closing
  logger.info('Supabase connection closed');
};