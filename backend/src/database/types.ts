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
      bnpl_terms: {
        Row: {
          accepted_at: number | null
          buyer_account_id: string
          created_at: number
          created_at_timestamp: string | null
          currency: string
          expires_at: number
          id: string
          installment_amount: number
          installment_count: number
          interest_rate: number
          merchant_account_id: string
          payment_id: string
          rejected_at: number | null
          rejection_reason: string | null
          smart_contract_agreement_id: string | null
          status: string
          total_amount: number
          total_amount_with_interest: number
          total_interest: number
          updated_at_timestamp: string | null
        }
        Insert: {
          accepted_at?: number | null
          buyer_account_id: string
          created_at: number
          created_at_timestamp?: string | null
          currency?: string
          expires_at: number
          id?: string
          installment_amount: number
          installment_count?: number
          interest_rate?: number
          merchant_account_id: string
          payment_id: string
          rejected_at?: number | null
          rejection_reason?: string | null
          smart_contract_agreement_id?: string | null
          status?: string
          total_amount: number
          total_amount_with_interest: number
          total_interest: number
          updated_at_timestamp?: string | null
        }
        Update: {
          accepted_at?: number | null
          buyer_account_id?: string
          created_at?: number
          created_at_timestamp?: string | null
          currency?: string
          expires_at?: number
          id?: string
          installment_amount?: number
          installment_count?: number
          interest_rate?: number
          merchant_account_id?: string
          payment_id?: string
          rejected_at?: number | null
          rejection_reason?: string | null
          smart_contract_agreement_id?: string | null
          status?: string
          total_amount?: number
          total_amount_with_interest?: number
          total_interest?: number
          updated_at_timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_bnpl_terms_buyer_account"
            columns: ["buyer_account_id"]
            isOneToOne: false
            referencedRelation: "hedera_accounts"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "fk_bnpl_terms_merchant_account"
            columns: ["merchant_account_id"]
            isOneToOne: false
            referencedRelation: "hedera_accounts"
            referencedColumns: ["account_id"]
          },
        ]
      }
      cached_transactions: {
        Row: {
          account_id: string
          amount: number
          created_at: string | null
          currency: string
          from_account: string
          from_alias: string | null
          gas_fee: number
          id: number
          period_end: number
          period_start: number
          period_type: string
          to_account: string
          to_alias: string | null
          transaction_id: string
          transaction_time: number
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string | null
          currency?: string
          from_account: string
          from_alias?: string | null
          gas_fee?: number
          id?: number
          period_end: number
          period_start: number
          period_type: string
          to_account: string
          to_alias?: string | null
          transaction_id: string
          transaction_time: number
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string | null
          currency?: string
          from_account?: string
          from_alias?: string | null
          gas_fee?: number
          id?: number
          period_end?: number
          period_start?: number
          period_type?: string
          to_account?: string
          to_alias?: string | null
          transaction_id?: string
          transaction_time?: number
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_cached_transactions_account"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "hedera_accounts"
            referencedColumns: ["account_id"]
          },
        ]
      }
      hedera_accounts: {
        Row: {
          account_id: string
          alias: string | null
          balance: number
          created_at: string
          currency: string
          hex_private_key: string | null
          id: number
          is_active: boolean
          private_key: string
          public_key: string
          updated_at: string
          user_id: string
          whatsapp_phone: string | null
        }
        Insert: {
          account_id: string
          alias?: string | null
          balance?: number
          created_at?: string
          currency?: string
          hex_private_key?: string | null
          id?: number
          is_active?: boolean
          private_key: string
          public_key: string
          updated_at?: string
          user_id: string
          whatsapp_phone?: string | null
        }
        Update: {
          account_id?: string
          alias?: string | null
          balance?: number
          created_at?: string
          currency?: string
          hex_private_key?: string | null
          id?: number
          is_active?: boolean
          private_key?: string
          public_key?: string
          updated_at?: string
          user_id?: string
          whatsapp_phone?: string | null
        }
        Relationships: []
      }
      kyc: {
        Row: {
          address: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          id: number
          id_number: string | null
          last_name: string | null
          occupation: string | null
          phone: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          id?: number
          id_number?: string | null
          last_name?: string | null
          occupation?: string | null
          phone?: string | null
          user_id?: string
        }
        Update: {
          address?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          id?: number
          id_number?: string | null
          last_name?: string | null
          occupation?: string | null
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_quotes: {
        Row: {
          created_at: string | null
          exchange_rate: number
          expires_at: string
          from_amount: number
          from_currency: string
          id: string
          receiver_account_id: string
          status: string | null
          to_amount: number
          to_currency: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          exchange_rate: number
          expires_at: string
          from_amount: number
          from_currency: string
          id: string
          receiver_account_id: string
          status?: string | null
          to_amount: number
          to_currency: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          exchange_rate?: number
          expires_at?: string
          from_amount?: number
          from_currency?: string
          id?: string
          receiver_account_id?: string
          status?: string | null
          to_amount?: number
          to_currency?: string
          used_at?: string | null
        }
        Relationships: []
      }
      transaction_cache_metadata: {
        Row: {
          account_id: string
          created_at: string | null
          id: number
          is_active: boolean
          last_updated: string | null
          period_end: number
          period_start: number
          period_type: string
          total_amount: number
          transaction_count: number
          updated_at: string | null
        }
        Insert: {
          account_id: string
          created_at?: string | null
          id?: number
          is_active?: boolean
          last_updated?: string | null
          period_end: number
          period_start: number
          period_type: string
          total_amount?: number
          transaction_count?: number
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string | null
          id?: number
          is_active?: boolean
          last_updated?: string | null
          period_end?: number
          period_start?: number
          period_type?: string
          total_amount?: number
          transaction_count?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_transaction_cache_metadata_account"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "hedera_accounts"
            referencedColumns: ["account_id"]
          },
        ]
      }
      users: {
        Row: {
          balance: number
          created_at: string
          did: string | null
          id: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          balance?: number
          created_at?: string
          did?: string | null
          id?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          balance?: number
          created_at?: string
          did?: string | null
          id?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      mark_expired_quotes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
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
