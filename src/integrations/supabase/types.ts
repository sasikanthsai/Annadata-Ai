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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip: string | null
          metadata: Json | null
          path: string | null
          query: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip?: string | null
          metadata?: Json | null
          path?: string | null
          query?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip?: string | null
          metadata?: Json | null
          path?: string | null
          query?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          password_hash: string
          username: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          password_hash: string
          username: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          password_hash?: string
          username?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          admin_note: string | null
          category: string
          created_at: string
          id: string
          message: string
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          category?: string
          created_at?: string
          id?: string
          message: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      diseases: {
        Row: {
          causes: string[]
          created_at: string
          crop: string
          fertilizer: string | null
          id: string
          name: string
          prevention: string[]
          scientific_name: string | null
          severity: string | null
          slug: string
          symptoms: string[]
          treatment: string[]
        }
        Insert: {
          causes?: string[]
          created_at?: string
          crop: string
          fertilizer?: string | null
          id?: string
          name: string
          prevention?: string[]
          scientific_name?: string | null
          severity?: string | null
          slug: string
          symptoms?: string[]
          treatment?: string[]
        }
        Update: {
          causes?: string[]
          created_at?: string
          crop?: string
          fertilizer?: string | null
          id?: string
          name?: string
          prevention?: string[]
          scientific_name?: string | null
          severity?: string | null
          slug?: string
          symptoms?: string[]
          treatment?: string[]
        }
        Relationships: []
      }
      farms: {
        Row: {
          area_acres: number | null
          created_at: string
          crop: string | null
          id: string
          is_default: boolean
          name: string
          notes: string | null
          updated_at: string
          user_id: string
          village: string
        }
        Insert: {
          area_acres?: number | null
          created_at?: string
          crop?: string | null
          id?: string
          is_default?: boolean
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
          village: string
        }
        Update: {
          area_acres?: number | null
          created_at?: string
          crop?: string | null
          id?: string
          is_default?: boolean
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          village?: string
        }
        Relationships: []
      }
      predictions: {
        Row: {
          confidence: number | null
          created_at: string
          crop: string | null
          disease_name: string
          disease_slug: string | null
          id: string
          image_url: string
          is_healthy: boolean | null
          notes: string | null
          raw_response: Json | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          crop?: string | null
          disease_name: string
          disease_slug?: string | null
          id?: string
          image_url: string
          is_healthy?: boolean | null
          notes?: string | null
          raw_response?: Json | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          crop?: string | null
          disease_name?: string
          disease_slug?: string | null
          id?: string
          image_url?: string
          is_healthy?: boolean | null
          notes?: string | null
          raw_response?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          village: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
          village?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          village?: string | null
        }
        Relationships: []
      }
      reminders: {
        Row: {
          completed: boolean
          created_at: string
          crop: string | null
          due_date: string
          farm_id: string | null
          id: string
          kind: Database["public"]["Enums"]["reminder_kind"]
          notes: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          crop?: string | null
          due_date: string
          farm_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["reminder_kind"]
          notes?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          crop?: string | null
          due_date?: string
          farm_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["reminder_kind"]
          notes?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          accent: string
          created_at: string
          default_farm_id: string | null
          language: string
          notify_email_digest: boolean
          notify_reminders: boolean
          notify_weather: boolean
          rainfall_unit: string
          temperature_unit: string
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accent?: string
          created_at?: string
          default_farm_id?: string | null
          language?: string
          notify_email_digest?: boolean
          notify_reminders?: boolean
          notify_weather?: boolean
          rainfall_unit?: string
          temperature_unit?: string
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accent?: string
          created_at?: string
          default_farm_id?: string | null
          language?: string
          notify_email_digest?: boolean
          notify_reminders?: boolean
          notify_weather?: boolean
          rainfall_unit?: string
          temperature_unit?: string
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_default_farm_id_fkey"
            columns: ["default_farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      reminder_kind:
        | "sowing"
        | "irrigation"
        | "fertilizer"
        | "pesticide"
        | "harvest"
        | "custom"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      reminder_kind: [
        "sowing",
        "irrigation",
        "fertilizer",
        "pesticide",
        "harvest",
        "custom",
      ],
    },
  },
} as const
