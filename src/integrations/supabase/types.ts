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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id: string | null
          entity_id: string
          entity_type: string
          id: string
          meta: Json | null
          timestamp: string
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id?: string | null
          entity_id: string
          entity_type: string
          id?: string
          meta?: Json | null
          timestamp?: string
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          actor_id?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          meta?: Json | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      case_participants: {
        Row: {
          case_id: string
          created_at: string
          id: string
          role_in_case: Database["public"]["Enums"]["participant_role"]
          user_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          role_in_case: Database["public"]["Enums"]["participant_role"]
          user_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          role_in_case?: Database["public"]["Enums"]["participant_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_participants_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          assigned_judge_id: string | null
          case_number: string
          closed_at: string | null
          created_at: string
          created_by_id: string
          filed_at: string
          id: string
          priority: Database["public"]["Enums"]["case_priority"]
          status: Database["public"]["Enums"]["case_status"]
          title: string
          type: Database["public"]["Enums"]["case_type"]
          updated_at: string
        }
        Insert: {
          assigned_judge_id?: string | null
          case_number: string
          closed_at?: string | null
          created_at?: string
          created_by_id: string
          filed_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["case_priority"]
          status?: Database["public"]["Enums"]["case_status"]
          title: string
          type: Database["public"]["Enums"]["case_type"]
          updated_at?: string
        }
        Update: {
          assigned_judge_id?: string | null
          case_number?: string
          closed_at?: string | null
          created_at?: string
          created_by_id?: string
          filed_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["case_priority"]
          status?: Database["public"]["Enums"]["case_status"]
          title?: string
          type?: Database["public"]["Enums"]["case_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_assigned_judge_id_fkey"
            columns: ["assigned_judge_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          case_id: string
          created_at: string
          id: string
          mime_type: string
          original_name: string
          size: number
          storage_key: string
          updated_at: string
          uploaded_at: string
          uploaded_by_id: string
          visibility: Database["public"]["Enums"]["document_visibility"]
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          mime_type: string
          original_name: string
          size: number
          storage_key: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by_id: string
          visibility?: Database["public"]["Enums"]["document_visibility"]
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          mime_type?: string
          original_name?: string
          size?: number
          storage_key?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by_id?: string
          visibility?: Database["public"]["Enums"]["document_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_id_fkey"
            columns: ["uploaded_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      filings: {
        Row: {
          case_id: string
          created_at: string
          description: string
          filing_type: Database["public"]["Enums"]["filing_type"]
          id: string
          review_notes: string | null
          reviewed_by_id: string | null
          status: Database["public"]["Enums"]["filing_status"]
          submitted_at: string
          submitted_by_id: string
          updated_at: string
        }
        Insert: {
          case_id: string
          created_at?: string
          description: string
          filing_type: Database["public"]["Enums"]["filing_type"]
          id?: string
          review_notes?: string | null
          reviewed_by_id?: string | null
          status?: Database["public"]["Enums"]["filing_status"]
          submitted_at?: string
          submitted_by_id: string
          updated_at?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          description?: string
          filing_type?: Database["public"]["Enums"]["filing_type"]
          id?: string
          review_notes?: string | null
          reviewed_by_id?: string | null
          status?: Database["public"]["Enums"]["filing_status"]
          submitted_at?: string
          submitted_by_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "filings_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filings_reviewed_by_id_fkey"
            columns: ["reviewed_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filings_submitted_by_id_fkey"
            columns: ["submitted_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hearings: {
        Row: {
          case_id: string
          courtroom: string
          created_at: string
          created_by_id: string
          end_at: string
          id: string
          notes: string | null
          start_at: string
          status: Database["public"]["Enums"]["hearing_status"]
          updated_at: string
        }
        Insert: {
          case_id: string
          courtroom: string
          created_at?: string
          created_by_id: string
          end_at: string
          id?: string
          notes?: string | null
          start_at: string
          status?: Database["public"]["Enums"]["hearing_status"]
          updated_at?: string
        }
        Update: {
          case_id?: string
          courtroom?: string
          created_at?: string
          created_by_id?: string
          end_at?: string
          id?: string
          notes?: string | null
          start_at?: string
          status?: Database["public"]["Enums"]["hearing_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hearings_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hearings_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      users: {
        Row: {
          active: boolean
          auth_user_id: string
          created_at: string
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          username: string
        }
        Insert: {
          active?: boolean
          auth_user_id: string
          created_at?: string
          email: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username: string
        }
        Update: {
          active?: boolean
          auth_user_id?: string
          created_at?: string
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username?: string
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
      audit_action:
        | "CREATE"
        | "UPDATE"
        | "DELETE"
        | "VIEW"
        | "APPROVE"
        | "REJECT"
      case_priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
      case_status: "FILED" | "ACTIVE" | "PENDING" | "CLOSED" | "DISMISSED"
      case_type: "CIVIL" | "CRIMINAL" | "FAMILY" | "TRAFFIC" | "PROBATE"
      document_visibility: "PUBLIC" | "PRIVATE" | "RESTRICTED"
      filing_status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED"
      filing_type:
        | "MOTION"
        | "BRIEF"
        | "COMPLAINT"
        | "ANSWER"
        | "DISCOVERY"
        | "ORDER"
      hearing_status:
        | "SCHEDULED"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "CANCELLED"
        | "POSTPONED"
      participant_role:
        | "PLAINTIFF"
        | "DEFENDANT"
        | "ATTORNEY"
        | "WITNESS"
        | "EXPERT"
      user_role: "public" | "judge" | "attorney" | "clerk" | "admin"
      user_role_old:
        | "ADMIN"
        | "JUDGE"
        | "ATTORNEY"
        | "CLERK"
        | "PUBLIC"
        | "admin"
        | "public"
        | "judge"
        | "attorney"
        | "clerk"
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
    Enums: {
      audit_action: ["CREATE", "UPDATE", "DELETE", "VIEW", "APPROVE", "REJECT"],
      case_priority: ["LOW", "NORMAL", "HIGH", "URGENT"],
      case_status: ["FILED", "ACTIVE", "PENDING", "CLOSED", "DISMISSED"],
      case_type: ["CIVIL", "CRIMINAL", "FAMILY", "TRAFFIC", "PROBATE"],
      document_visibility: ["PUBLIC", "PRIVATE", "RESTRICTED"],
      filing_status: ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"],
      filing_type: [
        "MOTION",
        "BRIEF",
        "COMPLAINT",
        "ANSWER",
        "DISCOVERY",
        "ORDER",
      ],
      hearing_status: [
        "SCHEDULED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "POSTPONED",
      ],
      participant_role: [
        "PLAINTIFF",
        "DEFENDANT",
        "ATTORNEY",
        "WITNESS",
        "EXPERT",
      ],
      user_role: ["public", "judge", "attorney", "clerk", "admin"],
      user_role_old: [
        "ADMIN",
        "JUDGE",
        "ATTORNEY",
        "CLERK",
        "PUBLIC",
        "admin",
        "public",
        "judge",
        "attorney",
        "clerk",
      ],
    },
  },
} as const
