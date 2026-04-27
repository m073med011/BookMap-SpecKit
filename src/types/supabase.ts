export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Enums: Record<string, never>;
    Functions: {
      authorize: {
        Args: { required_role: string };
        Returns: boolean;
      };
      authorize_library: {
        Args: { lib_id: string; required_role: string };
        Returns: boolean;
      };
      custom_access_token_hook: {
        Args: { event: Json };
        Returns: Json;
      };
      handle_new_user: {
        Args: Record<string, never>;
        Returns: unknown;
      };
    };
    Tables: {
      app_roles: {
        Insert: {
          description: string;
          id: string;
        };
        Relationships: [];
        Row: {
          description: string;
          id: string;
        };
        Update: {
          description?: string;
          id?: string;
        };
      };
      audit_logs: {
        Insert: {
          action: string;
          created_at?: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json;
          target_id?: string | null;
          target_type?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
        Row: {
          action: string;
          created_at: string;
          id: string;
          ip_address: string | null;
          metadata: Json;
          target_id: string | null;
          target_type: string | null;
          user_id: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json;
          target_id?: string | null;
          target_type?: string | null;
          user_id?: string | null;
        };
      };
      libraries: {
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
        };
        Relationships: [];
        Row: {
          created_at: string;
          id: string;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
        };
      };
      profiles: {
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string;
          id: string;
          preferred_locale?: "ar" | "en";
          status?: "active" | "suspended";
          updated_at?: string;
        };
        Relationships: [];
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          display_name: string;
          id: string;
          preferred_locale: "ar" | "en";
          status: "active" | "suspended";
          updated_at: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          preferred_locale?: "ar" | "en";
          status?: "active" | "suspended";
          updated_at?: string;
        };
      };
      staff_invitations: {
        Insert: {
          created_at?: string;
          email: string;
          expires_at: string;
          id?: string;
          invited_by: string;
          library_id: string;
          status?: "accepted" | "expired" | "pending" | "revoked";
          token: string;
        };
        Relationships: [];
        Row: {
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string;
          library_id: string;
          status: "accepted" | "expired" | "pending" | "revoked";
          token: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string;
          library_id?: string;
          status?: "accepted" | "expired" | "pending" | "revoked";
          token?: string;
        };
      };
      user_roles: {
        Insert: {
          assigned_at?: string;
          assigned_by?: string | null;
          id?: string;
          library_id?: string | null;
          role: "admin" | "library_staff" | "superadmin" | "user";
          user_id: string;
        };
        Relationships: [];
        Row: {
          assigned_at: string;
          assigned_by: string | null;
          id: string;
          library_id: string | null;
          role: "admin" | "library_staff" | "superadmin" | "user";
          user_id: string;
        };
        Update: {
          assigned_at?: string;
          assigned_by?: string | null;
          id?: string;
          library_id?: string | null;
          role?: "admin" | "library_staff" | "superadmin" | "user";
          user_id?: string;
        };
      };
    };
    Views: Record<string, never>;
  };
};
