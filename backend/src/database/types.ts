export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      hedera_accounts: {
        Row: {
          account_id: string
          alias: string | null
          balance: number
          created_at: string
          id: number
          is_active: boolean
          private_key: string
          public_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          alias?: string | null
          balance?: number
          created_at?: string
          id?: number
          is_active?: boolean
          private_key: string
          public_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          alias?: string | null
          balance?: number
          created_at?: string
          id?: number
          is_active?: boolean
          private_key?: string
          public_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          balance: number
          created_at: string
          id: number
          updated_at: string
          user_id: string | null
          did?: string | null
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: number
          updated_at?: string
          user_id?: string | null
          did?: string | null
        }
        Update: {
          balance?: number
          created_at?: string
          id?: number
          updated_at?: string
          user_id?: string | null
          did?: string | null
        }
        Relationships: []
      }
      cached_transactions: {
        Row: {
          id: number
          account_id: string
          transaction_id: string
          amount: number
          currency: string
          gas_fee: number
          transaction_time: number
          to_account: string
          from_account: string
          from_alias: string | null
          to_alias: string | null
          transaction_type: 'SEND' | 'RECEIVE'
          period_type: 'daily' | 'weekly' | 'monthly' | 'all'
          period_start: number
          period_end: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          account_id: string
          transaction_id: string
          amount: number
          currency?: string
          gas_fee?: number
          transaction_time: number
          to_account: string
          from_account: string
          from_alias?: string | null
          to_alias?: string | null
          transaction_type: 'SEND' | 'RECEIVE'
          period_type: 'daily' | 'weekly' | 'monthly' | 'all'
          period_start: number
          period_end: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          account_id?: string
          transaction_id?: string
          amount?: number
          currency?: string
          gas_fee?: number
          transaction_time?: number
          to_account?: string
          from_account?: string
          from_alias?: string | null
          to_alias?: string | null
          transaction_type?: 'SEND' | 'RECEIVE'
          period_type?: 'daily' | 'weekly' | 'monthly' | 'all'
          period_start?: number
          period_end?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      transaction_cache_metadata: {
        Row: {
          id: number
          account_id: string
          period_type: 'daily' | 'weekly' | 'monthly' | 'all'
          period_start: number
          period_end: number
          last_updated: string
          transaction_count: number
          total_amount: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          account_id: string
          period_type: 'daily' | 'weekly' | 'monthly' | 'all'
          period_start: number
          period_end: number
          last_updated: string
          transaction_count?: number
          total_amount?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          account_id?: string
          period_type?: 'daily' | 'weekly' | 'monthly' | 'all'
          period_start?: number
          period_end?: number
          last_updated?: string
          transaction_count?: number
          total_amount?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
