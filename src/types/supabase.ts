export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Enums: {
      catalog_listing_format_type: "ebook" | "physical";
      catalog_listing_status:
        | "archived"
        | "draft"
        | "pending_review"
        | "published"
        | "unpublished";
    };
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
      record_library_status_change: {
        Args: {
          p_changed_by: string;
          p_library_id: string;
          p_new_status: string;
          p_previous_status: string | null;
          p_reason: string | null;
        };
        Returns: undefined;
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
      authors: {
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Relationships: [];
        Row: {
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
      };
      book_authors: {
        Insert: {
          author_id: string;
          book_id: string;
          created_at?: string;
        };
        Relationships: [];
        Row: {
          author_id: string;
          book_id: string;
          created_at: string;
        };
        Update: {
          author_id?: string;
          book_id?: string;
          created_at?: string;
        };
      };
      book_genres: {
        Insert: {
          book_id: string;
          created_at?: string;
          genre_id: string;
        };
        Relationships: [];
        Row: {
          book_id: string;
          created_at: string;
          genre_id: string;
        };
        Update: {
          book_id?: string;
          created_at?: string;
          genre_id?: string;
        };
      };
      books: {
        Insert: {
          cover_image_path?: string | null;
          created_at?: string;
          id?: string;
          isbn?: string | null;
          language: string;
          library_id: string;
          publication_year?: number | null;
          publisher_id?: string | null;
          subtitle?: string | null;
          title: string;
          updated_at?: string;
        };
        Relationships: [];
        Row: {
          cover_image_path: string | null;
          created_at: string;
          id: string;
          isbn: string | null;
          language: string;
          library_id: string;
          publication_year: number | null;
          publisher_id: string | null;
          subtitle: string | null;
          title: string;
          updated_at: string;
        };
        Update: {
          cover_image_path?: string | null;
          created_at?: string;
          id?: string;
          isbn?: string | null;
          language?: string;
          library_id?: string;
          publication_year?: number | null;
          publisher_id?: string | null;
          subtitle?: string | null;
          title?: string;
          updated_at?: string;
        };
      };
      genres: {
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          parent_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
        Row: {
          created_at: string;
          id: string;
          name: string;
          parent_id: string | null;
          updated_at: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          parent_id?: string | null;
          updated_at?: string;
        };
      };
      inventory: {
        Insert: {
          created_at?: string;
          id?: string;
          listing_format_id: string;
          stock_quantity?: number;
          updated_at?: string;
        };
        Relationships: [];
        Row: {
          created_at: string;
          id: string;
          listing_format_id: string;
          stock_quantity: number;
          updated_at: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          listing_format_id?: string;
          stock_quantity?: number;
          updated_at?: string;
        };
      };
      libraries: {
        Insert: {
          address?: string | null;
          banner_url?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          languages?: string[];
          logo_url?: string | null;
          name: string;
          owner_id: string;
          policies?: Json;
          slug: string;
          social_links?: Json;
          status?:
            | "active"
            | "archived"
            | "draft"
            | "pending_approval"
            | "rejected"
            | "suspended";
          updated_at?: string;
        };
        Relationships: [];
        Row: {
          address: string | null;
          banner_url: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          description: string | null;
          id: string;
          languages: string[];
          logo_url: string | null;
          name: string;
          owner_id: string;
          policies: Json;
          slug: string;
          social_links: Json;
          status:
            | "active"
            | "archived"
            | "draft"
            | "pending_approval"
            | "rejected"
            | "suspended";
          updated_at: string;
        };
        Update: {
          address?: string | null;
          banner_url?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          languages?: string[];
          logo_url?: string | null;
          name?: string;
          owner_id?: string;
          policies?: Json;
          slug?: string;
          social_links?: Json;
          status?:
            | "active"
            | "archived"
            | "draft"
            | "pending_approval"
            | "rejected"
            | "suspended";
          updated_at?: string;
        };
      };
      library_settings: {
        Insert: {
          custom_settings?: Json;
          id?: string;
          library_id: string;
          operating_hours?: Json;
          return_policy?: string | null;
          shipping_preferences?: Json;
          updated_at?: string;
        };
        Relationships: [];
        Row: {
          custom_settings: Json;
          id: string;
          library_id: string;
          operating_hours: Json;
          return_policy: string | null;
          shipping_preferences: Json;
          updated_at: string;
        };
        Update: {
          custom_settings?: Json;
          id?: string;
          library_id?: string;
          operating_hours?: Json;
          return_policy?: string | null;
          shipping_preferences?: Json;
          updated_at?: string;
        };
      };
      library_staff_memberships: {
        Insert: {
          assigned_by?: string | null;
          created_at?: string;
          id?: string;
          library_id: string;
          library_role: "owner" | "staff";
          user_id: string;
        };
        Relationships: [];
        Row: {
          assigned_by: string | null;
          created_at: string;
          id: string;
          library_id: string;
          library_role: "owner" | "staff";
          user_id: string;
        };
        Update: {
          assigned_by?: string | null;
          created_at?: string;
          id?: string;
          library_id?: string;
          library_role?: "owner" | "staff";
          user_id?: string;
        };
      };
      library_status_history: {
        Insert: {
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          library_id: string;
          new_status: string;
          previous_status?: string | null;
          reason?: string | null;
        };
        Relationships: [];
        Row: {
          changed_by: string | null;
          created_at: string;
          id: string;
          library_id: string;
          new_status:
            | "active"
            | "archived"
            | "draft"
            | "pending_approval"
            | "rejected"
            | "suspended";
          previous_status:
            | "active"
            | "archived"
            | "draft"
            | "pending_approval"
            | "rejected"
            | "suspended"
            | null;
          reason: string | null;
        };
        Update: {
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          library_id?: string;
          new_status?: string;
          previous_status?: string | null;
          reason?: string | null;
        };
      };
      listing_formats: {
        Insert: {
          created_at?: string;
          ebook_file_path?: string | null;
          format_type: "ebook" | "physical";
          id?: string;
          listing_id: string;
          price: number;
          updated_at?: string;
        };
        Relationships: [];
        Row: {
          created_at: string;
          ebook_file_path: string | null;
          format_type: "ebook" | "physical";
          id: string;
          listing_id: string;
          price: number;
          updated_at: string;
        };
        Update: {
          created_at?: string;
          ebook_file_path?: string | null;
          format_type?: "ebook" | "physical";
          id?: string;
          listing_id?: string;
          price?: number;
          updated_at?: string;
        };
      };
      listings: {
        Insert: {
          approval_required?: boolean;
          book_id: string;
          created_at?: string;
          id?: string;
          library_id: string;
          status?:
            | "archived"
            | "draft"
            | "pending_review"
            | "published"
            | "unpublished";
          updated_at?: string;
        };
        Relationships: [];
        Row: {
          approval_required: boolean;
          book_id: string;
          created_at: string;
          id: string;
          library_id: string;
          status:
            | "archived"
            | "draft"
            | "pending_review"
            | "published"
            | "unpublished";
          updated_at: string;
        };
        Update: {
          approval_required?: boolean;
          book_id?: string;
          created_at?: string;
          id?: string;
          library_id?: string;
          status?:
            | "archived"
            | "draft"
            | "pending_review"
            | "published"
            | "unpublished";
          updated_at?: string;
        };
      };
      publishers: {
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Relationships: [];
        Row: {
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
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
          invited_by?: string | null;
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
          invited_by: string | null;
          library_id: string;
          status: "accepted" | "expired" | "pending" | "revoked";
          token: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
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
