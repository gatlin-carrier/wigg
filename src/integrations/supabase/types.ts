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
      title_metrics: {
        Row: {
          title_id: string
          t2g_comm_pct: number | null
          t2g_comm_iqr: number | null
          peak_label: string | null
          peak_at_pct: number | null
          sample_size: number | null
          updated_at: string | null
        }
        Insert: {
          title_id: string
          t2g_comm_pct?: number | null
          t2g_comm_iqr?: number | null
          peak_label?: string | null
          peak_at_pct?: number | null
          sample_size?: number | null
          updated_at?: string | null
        }
        Update: {
          title_id?: string
          t2g_comm_pct?: number | null
          t2g_comm_iqr?: number | null
          peak_label?: string | null
          peak_at_pct?: number | null
          sample_size?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_first_good: {
        Row: {
          id: string
          user_id: string
          title_id: string
          first_good_pct: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title_id: string
          first_good_pct: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title_id?: string
          first_good_pct?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_first_good_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          created_at: string
          duration_sec: number | null
          episode: number | null
          id: string
          media_id: string
          release_date: string | null
          season: number | null
          title: string | null
        }
        Insert: {
          created_at?: string
          duration_sec?: number | null
          episode?: number | null
          id?: string
          media_id: string
          release_date?: string | null
          season?: number | null
          title?: string | null
        }
        Update: {
          created_at?: string
          duration_sec?: number | null
          episode?: number | null
          id?: string
          media_id?: string
          release_date?: string | null
          season?: number | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "episodes_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "episodes_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_lookup"
            referencedColumns: ["media_id"]
          },
        ]
      }
      flags: {
        Row: {
          created_at: string
          id: string
          point_id: string
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          point_id: string
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          point_id?: string
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flags_point_id_fkey"
            columns: ["point_id"]
            isOneToOne: false
            referencedRelation: "wigg_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      list_items: {
        Row: {
          created_at: string
          episode_id: string | null
          id: string
          list_id: string
          media_id: string | null
          position: number | null
        }
        Insert: {
          created_at?: string
          episode_id?: string | null
          id?: string
          list_id: string
          media_id?: string | null
          position?: number | null
        }
        Update: {
          created_at?: string
          episode_id?: string | null
          id?: string
          list_id?: string
          media_id?: string | null
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "list_items_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_items_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "media_lookup"
            referencedColumns: ["episode_id"]
          },
          {
            foreignKeyName: "list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_items_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_items_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_lookup"
            referencedColumns: ["media_id"]
          },
        ]
      }
      lists: {
        Row: {
          created_at: string
          id: string
          is_smart: boolean
          name: string
          rules: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_smart?: boolean
          name: string
          rules?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_smart?: boolean
          name?: string
          rules?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          created_at: string
          duration_sec: number | null
          external_ids: Json
          id: string
          metadata: Json
          pages: number | null
          title: string
          type: Database["public"]["Enums"]["media_type"]
          year: number | null
        }
        Insert: {
          created_at?: string
          duration_sec?: number | null
          external_ids?: Json
          id?: string
          metadata?: Json
          pages?: number | null
          title: string
          type: Database["public"]["Enums"]["media_type"]
          year?: number | null
        }
        Update: {
          created_at?: string
          duration_sec?: number | null
          external_ids?: Json
          id?: string
          metadata?: Json
          pages?: number | null
          title?: string
          type?: Database["public"]["Enums"]["media_type"]
          year?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          patience: number
          preferred_media_types: Json | null
          sensitivity_flags: string[]
          trust_score: number
          username: string | null
        }
        Insert: {
          created_at?: string
          id: string
          patience?: number
          preferred_media_types?: Json | null
          sensitivity_flags?: string[]
          trust_score?: number
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          patience?: number
          preferred_media_types?: Json | null
          sensitivity_flags?: string[]
          trust_score?: number
          username?: string | null
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string
          id: string
          point_id: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          point_id: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          point_id?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "votes_point_id_fkey"
            columns: ["point_id"]
            isOneToOne: false
            referencedRelation: "wigg_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wigg_points: {
        Row: {
          created_at: string
          episode_id: string | null
          id: string
          media_id: string
          pos_kind: Database["public"]["Enums"]["pos_type"]
          pos_value: number
          reason_short: string | null
          span_end: number | null
          span_start: number | null
          spoiler: Database["public"]["Enums"]["spoiler_level"]
          tags: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          episode_id?: string | null
          id?: string
          media_id: string
          pos_kind?: Database["public"]["Enums"]["pos_type"]
          pos_value: number
          reason_short?: string | null
          span_end?: number | null
          span_start?: number | null
          spoiler?: Database["public"]["Enums"]["spoiler_level"]
          tags?: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          episode_id?: string | null
          id?: string
          media_id?: string
          pos_kind?: Database["public"]["Enums"]["pos_type"]
          pos_value?: number
          reason_short?: string | null
          span_end?: number | null
          span_start?: number | null
          spoiler?: Database["public"]["Enums"]["spoiler_level"]
          tags?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wigg_points_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wigg_points_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "media_lookup"
            referencedColumns: ["episode_id"]
          },
          {
            foreignKeyName: "wigg_points_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wigg_points_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_lookup"
            referencedColumns: ["media_id"]
          },
          {
            foreignKeyName: "wigg_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      consensus_wigg: {
        Row: {
          episode_id: string | null
          first_at: string | null
          last_at: string | null
          media_id: string | null
          median_pos: number | null
          n_points: number | null
          pos_kind: Database["public"]["Enums"]["pos_type"] | null
          q1_pos: number | null
          q3_pos: number | null
          scope_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wigg_points_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wigg_points_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "media_lookup"
            referencedColumns: ["episode_id"]
          },
          {
            foreignKeyName: "wigg_points_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wigg_points_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_lookup"
            referencedColumns: ["media_id"]
          },
        ]
      }
      media_lookup: {
        Row: {
          duration_sec: number | null
          episode: number | null
          episode_id: string | null
          episode_title: string | null
          media_id: string | null
          media_title: string | null
          season: number | null
          type: Database["public"]["Enums"]["media_type"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_wigg: {
        Args: {
          p_episode_id: string
          p_media_id: string
          p_pos_kind: Database["public"]["Enums"]["pos_type"]
          p_pos_value: number
          p_reason_short?: string
          p_span_end?: number
          p_span_start?: number
          p_spoiler?: Database["public"]["Enums"]["spoiler_level"]
          p_tags?: string[]
          p_user_id: string
        }
        Returns: string
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      upsert_media: {
        Args: {
          p_duration_sec?: number
          p_external_ids?: Json
          p_pages?: number
          p_title: string
          p_type: Database["public"]["Enums"]["media_type"]
          p_year: number
        }
        Returns: string
      }
    }
    Enums: {
      media_type: "movie" | "tv" | "anime" | "game" | "book" | "podcast"
      pos_type: "sec" | "page" | "percent"
      spoiler_level: "0" | "1" | "2"
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
      media_type: ["movie", "tv", "anime", "game", "book", "podcast"],
      pos_type: ["sec", "page", "percent"],
      spoiler_level: ["0", "1", "2"],
    },
  },
} as const
