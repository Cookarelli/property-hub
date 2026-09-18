// Generated from the migrated PostgreSQL catalog by pnpm db:types.
import type { OnboardingRpc } from "./organizations/rpc-types";
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
export type Database = {
  public: {
    Tables: {
      activity_events: {
        Row: {
          id: string;
          organization_id: string;
          actor_id: string | null;
          event_type: string;
          title: string;
          description: string;
          created_at: string;
          updated_at: string;
          property_id: string | null;
          related_id: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          actor_id?: string | null;
          event_type: string;
          title: string;
          description: string;
          created_at?: string;
          updated_at?: string;
          property_id?: string | null;
          related_id?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          actor_id?: string | null;
          event_type?: string;
          title?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
          property_id?: string | null;
          related_id?: string | null;
        };
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          organization_id: string;
          property_id: string | null;
          title: string;
          body: string;
          category: string;
          published_at: string | null;
          created_at: string;
          updated_at: string;
          building_id: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          property_id?: string | null;
          title: string;
          body: string;
          category?: string;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          building_id?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          property_id?: string | null;
          title?: string;
          body?: string;
          category?: string;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          building_id?: string | null;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          organization_id: string;
          property_id: string;
          unit_id: string;
          user_id: string;
          name: string;
          email: string;
          status: string;
          desired_move_in: string;
          monthly_income_cents: number | null;
          created_at: string;
          updated_at: string;
          phone: string;
          occupants: number;
          pets: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          property_id: string;
          unit_id: string;
          user_id: string;
          name: string;
          email: string;
          status?: string;
          desired_move_in: string;
          monthly_income_cents?: number | null;
          created_at?: string;
          updated_at?: string;
          phone?: string;
          occupants?: number;
          pets?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          property_id?: string;
          unit_id?: string;
          user_id?: string;
          name?: string;
          email?: string;
          status?: string;
          desired_move_in?: string;
          monthly_income_cents?: number | null;
          created_at?: string;
          updated_at?: string;
          phone?: string;
          occupants?: number;
          pets?: string;
        };
        Relationships: [];
      };
      buildings: {
        Row: {
          id: string;
          organization_id: string;
          property_id: string;
          name: string;
          floors: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          property_id: string;
          name: string;
          floors: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          property_id?: string;
          name?: string;
          floors?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      document_assignments: {
        Row: {
          id: string;
          organization_id: string;
          document_id: string;
          resident_id: string;
          assigned_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          document_id: string;
          resident_id: string;
          assigned_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          document_id?: string;
          resident_id?: string;
          assigned_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          organization_id: string;
          property_id: string | null;
          resident_id: string | null;
          title: string;
          category: string;
          content: string;
          storage_path: string | null;
          created_at: string;
          updated_at: string;
          visibility: string;
          building_id: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          property_id?: string | null;
          resident_id?: string | null;
          title: string;
          category: string;
          content?: string;
          storage_path?: string | null;
          created_at?: string;
          updated_at?: string;
          visibility?: string;
          building_id?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          property_id?: string | null;
          resident_id?: string | null;
          title?: string;
          category?: string;
          content?: string;
          storage_path?: string | null;
          created_at?: string;
          updated_at?: string;
          visibility?: string;
          building_id?: string | null;
        };
        Relationships: [];
      };
      floor_plans: {
        Row: {
          id: string;
          organization_id: string;
          property_id: string;
          name: string;
          bedrooms: number;
          bathrooms: number;
          sqft: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          property_id: string;
          name: string;
          bedrooms: number;
          bathrooms: number;
          sqft: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          property_id?: string;
          name?: string;
          bedrooms?: number;
          bathrooms?: number;
          sqft?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          organization_id: string;
          property_id: string;
          name: string;
          email: string;
          source: string;
          status: string;
          interested_bedrooms: number;
          created_at: string;
          updated_at: string;
          phone: string;
          unit_id: string | null;
          desired_move_in: string | null;
          message: string;
          request_key: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          property_id: string;
          name: string;
          email: string;
          source: string;
          status: string;
          interested_bedrooms: number;
          created_at?: string;
          updated_at?: string;
          phone?: string;
          unit_id?: string | null;
          desired_move_in?: string | null;
          message?: string;
          request_key?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          property_id?: string;
          name?: string;
          email?: string;
          source?: string;
          status?: string;
          interested_bedrooms?: number;
          created_at?: string;
          updated_at?: string;
          phone?: string;
          unit_id?: string | null;
          desired_move_in?: string | null;
          message?: string;
          request_key?: string | null;
        };
        Relationships: [];
      };
      lease_residents: {
        Row: {
          id: string;
          organization_id: string;
          lease_id: string;
          resident_id: string;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          lease_id: string;
          resident_id: string;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          lease_id?: string;
          resident_id?: string;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      leases: {
        Row: {
          id: string;
          organization_id: string;
          unit_id: string;
          starts_on: string;
          ends_on: string;
          rent_cents: number;
          deposit_cents: number;
          status: string;
          created_at: string;
          updated_at: string;
          renewal_status: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          unit_id: string;
          starts_on: string;
          ends_on: string;
          rent_cents: number;
          deposit_cents: number;
          status: string;
          created_at?: string;
          updated_at?: string;
          renewal_status?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          unit_id?: string;
          starts_on?: string;
          ends_on?: string;
          rent_cents?: number;
          deposit_cents?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
          renewal_status?: string;
        };
        Relationships: [];
      };
      leasing_intakes: {
        Row: {
          id: string;
          organization_id: string;
          property_id: string;
          unit_id: string | null;
          floor_plan_id: string | null;
          kind: string;
          session_id: string;
          request_id: string;
          payload: Json;
          lead_id: string | null;
          tour_request_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          property_id: string;
          unit_id?: string | null;
          floor_plan_id?: string | null;
          kind: string;
          session_id: string;
          request_id: string;
          payload: Json;
          lead_id?: string | null;
          tour_request_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          property_id?: string;
          unit_id?: string | null;
          floor_plan_id?: string | null;
          kind?: string;
          session_id?: string;
          request_id?: string;
          payload?: Json;
          lead_id?: string | null;
          tour_request_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      maintenance_attachments: {
        Row: {
          id: string;
          organization_id: string;
          maintenance_request_id: string;
          uploaded_by: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          maintenance_request_id: string;
          uploaded_by: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          maintenance_request_id?: string;
          uploaded_by?: string;
          storage_path?: string;
          mime_type?: string;
          size_bytes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      maintenance_internal_notes: {
        Row: {
          id: string;
          organization_id: string;
          maintenance_request_id: string;
          author_id: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          maintenance_request_id: string;
          author_id: string;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          maintenance_request_id?: string;
          author_id?: string;
          body?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      maintenance_requests: {
        Row: {
          id: string;
          organization_id: string;
          property_id: string;
          unit_id: string;
          resident_id: string;
          assigned_to: string | null;
          title: string;
          description: string;
          category: string;
          priority: string;
          status: string;
          permission_to_enter: boolean;
          created_at: string;
          updated_at: string;
          pets_in_unit: boolean;
          pet_notes: string;
          preferred_access_date: string | null;
          preferred_access_time: string;
          contact_preference: string;
          scheduled_for: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          property_id: string;
          unit_id: string;
          resident_id: string;
          assigned_to?: string | null;
          title: string;
          description: string;
          category: string;
          priority?: string;
          status?: string;
          permission_to_enter?: boolean;
          created_at?: string;
          updated_at?: string;
          pets_in_unit?: boolean;
          pet_notes?: string;
          preferred_access_date?: string | null;
          preferred_access_time?: string;
          contact_preference?: string;
          scheduled_for?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          property_id?: string;
          unit_id?: string;
          resident_id?: string;
          assigned_to?: string | null;
          title?: string;
          description?: string;
          category?: string;
          priority?: string;
          status?: string;
          permission_to_enter?: boolean;
          created_at?: string;
          updated_at?: string;
          pets_in_unit?: boolean;
          pet_notes?: string;
          preferred_access_date?: string | null;
          preferred_access_time?: string;
          contact_preference?: string;
          scheduled_for?: string | null;
        };
        Relationships: [];
      };
      maintenance_updates: {
        Row: {
          id: string;
          organization_id: string;
          maintenance_request_id: string;
          author_id: string;
          body: string;
          created_at: string;
          updated_at: string;
          status: string | null;
          scheduled_for: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          maintenance_request_id: string;
          author_id: string;
          body: string;
          created_at?: string;
          updated_at?: string;
          status?: string | null;
          scheduled_for?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          maintenance_request_id?: string;
          author_id?: string;
          body?: string;
          created_at?: string;
          updated_at?: string;
          status?: string | null;
          scheduled_for?: string | null;
        };
        Relationships: [];
      };
      organization_assets: {
        Row: {
          id: string;
          organization_id: string;
          path: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          path: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          path?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_domains: {
        Row: {
          id: string;
          organization_id: string;
          hostname: string;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          hostname: string;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          hostname?: string;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_invitations: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role:
            | "platform_admin"
            | "owner"
            | "property_manager"
            | "staff"
            | "maintenance"
            | "resident"
            | "applicant"
            | "admin"
            | "leasing";
          token_hash: string;
          invited_by: string;
          expires_at: string;
          accepted_at: string | null;
          revoked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          role:
            | "platform_admin"
            | "owner"
            | "property_manager"
            | "staff"
            | "maintenance"
            | "resident"
            | "applicant"
            | "admin"
            | "leasing";
          token_hash: string;
          invited_by: string;
          expires_at?: string;
          accepted_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          role?:
            | "platform_admin"
            | "owner"
            | "property_manager"
            | "staff"
            | "maintenance"
            | "resident"
            | "applicant"
            | "admin"
            | "leasing";
          token_hash?: string;
          invited_by?: string;
          expires_at?: string;
          accepted_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_memberships: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role:
            | "platform_admin"
            | "owner"
            | "property_manager"
            | "staff"
            | "maintenance"
            | "resident"
            | "applicant"
            | "admin"
            | "leasing";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role:
            | "platform_admin"
            | "owner"
            | "property_manager"
            | "staff"
            | "maintenance"
            | "resident"
            | "applicant"
            | "admin"
            | "leasing";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?:
            | "platform_admin"
            | "owner"
            | "property_manager"
            | "staff"
            | "maintenance"
            | "resident"
            | "applicant"
            | "admin"
            | "leasing";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_settings: {
        Row: {
          id: string;
          organization_id: string;
          timezone: string;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          timezone?: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          timezone?: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
          legal_name: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          logo_url: string | null;
          primary_color: string;
          secondary_color: string;
          address: string | null;
          status: string;
          subscription_status: string;
          plan: string;
          features: Json;
          portal_configured_at: string | null;
          maintenance_configured_at: string | null;
          payments_deferred_at: string | null;
          public_reviewed_at: string | null;
          onboarding_completed_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
          legal_name?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          address?: string | null;
          status?: string;
          subscription_status?: string;
          plan?: string;
          features?: Json;
          portal_configured_at?: string | null;
          maintenance_configured_at?: string | null;
          payments_deferred_at?: string | null;
          public_reviewed_at?: string | null;
          onboarding_completed_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
          updated_at?: string;
          legal_name?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          logo_url?: string | null;
          primary_color?: string;
          secondary_color?: string;
          address?: string | null;
          status?: string;
          subscription_status?: string;
          plan?: string;
          features?: Json;
          portal_configured_at?: string | null;
          maintenance_configured_at?: string | null;
          payments_deferred_at?: string | null;
          public_reviewed_at?: string | null;
          onboarding_completed_at?: string | null;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          organization_id: string;
          lease_id: string;
          resident_id: string;
          amount_cents: number;
          due_on: string;
          paid_at: string | null;
          status: string;
          method: string;
          simulated: boolean;
          provider_event_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          lease_id: string;
          resident_id: string;
          amount_cents: number;
          due_on: string;
          paid_at?: string | null;
          status: string;
          method: string;
          simulated?: boolean;
          provider_event_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          lease_id?: string;
          resident_id?: string;
          amount_cents?: number;
          due_on?: string;
          paid_at?: string | null;
          status?: string;
          method?: string;
          simulated?: boolean;
          provider_event_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_configuration: {
        Row: {
          id: string;
          key: string;
          value: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_memberships: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          address: string;
          city: string;
          state: string;
          zip: string;
          description: string;
          image: string;
          neighborhood: string;
          amenities: string[];
          published: boolean;
          created_at: string;
          updated_at: string;
          application_mode: string;
          application_url: string | null;
          photos: string[];
          office_hours: string;
          office_phone: string;
          office_email: string;
          emergency_phone: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          slug: string;
          address: string;
          city: string;
          state: string;
          zip: string;
          description?: string;
          image?: string;
          neighborhood?: string;
          amenities?: string[];
          published?: boolean;
          created_at?: string;
          updated_at?: string;
          application_mode?: string;
          application_url?: string | null;
          photos?: string[];
          office_hours?: string;
          office_phone?: string;
          office_email?: string;
          emergency_phone?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          slug?: string;
          address?: string;
          city?: string;
          state?: string;
          zip?: string;
          description?: string;
          image?: string;
          neighborhood?: string;
          amenities?: string[];
          published?: boolean;
          created_at?: string;
          updated_at?: string;
          application_mode?: string;
          application_url?: string | null;
          photos?: string[];
          office_hours?: string;
          office_phone?: string;
          office_email?: string;
          emergency_phone?: string;
        };
        Relationships: [];
      };
      residents: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          name: string;
          email: string;
          phone: string;
          created_at: string;
          updated_at: string;
          contact_preference: string;
          community_notifications: boolean;
          maintenance_notifications: boolean;
          payment_notifications: boolean;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          name: string;
          email: string;
          phone?: string;
          created_at?: string;
          updated_at?: string;
          contact_preference?: string;
          community_notifications?: boolean;
          maintenance_notifications?: boolean;
          payment_notifications?: boolean;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          name?: string;
          email?: string;
          phone?: string;
          created_at?: string;
          updated_at?: string;
          contact_preference?: string;
          community_notifications?: boolean;
          maintenance_notifications?: boolean;
          payment_notifications?: boolean;
        };
        Relationships: [];
      };
      tour_requests: {
        Row: {
          id: string;
          organization_id: string;
          property_id: string;
          unit_id: string | null;
          user_id: string | null;
          scheduled_at: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          property_id: string;
          unit_id?: string | null;
          user_id?: string | null;
          scheduled_at: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          property_id?: string;
          unit_id?: string | null;
          user_id?: string | null;
          scheduled_at?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      units: {
        Row: {
          id: string;
          organization_id: string;
          property_id: string;
          building_id: string;
          floor_plan_id: string;
          number: string;
          floor: number;
          rent_cents: number;
          status: string;
          available_on: string | null;
          created_at: string;
          updated_at: string;
          deposit_cents: number;
          photos: string[];
        };
        Insert: {
          id?: string;
          organization_id: string;
          property_id: string;
          building_id: string;
          floor_plan_id: string;
          number: string;
          floor: number;
          rent_cents: number;
          status: string;
          available_on?: string | null;
          created_at?: string;
          updated_at?: string;
          deposit_cents?: number;
          photos?: string[];
        };
        Update: {
          id?: string;
          organization_id?: string;
          property_id?: string;
          building_id?: string;
          floor_plan_id?: string;
          number?: string;
          floor?: number;
          rent_cents?: number;
          status?: string;
          available_on?: string | null;
          created_at?: string;
          updated_at?: string;
          deposit_cents?: number;
          photos?: string[];
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      organization_members: {
        Row: {
          id: string | null;
          organization_id: string | null;
          user_id: string | null;
          role:
            | "platform_admin"
            | "owner"
            | "property_manager"
            | "staff"
            | "maintenance"
            | "resident"
            | "applicant"
            | "admin"
            | "leasing"
            | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      submit_leasing_intake: {
        Args: {
          p_org: string;
          p_session: string;
          p_request: string;
          p_payload: Json;
        };
        Returns: string;
      };
    } & OnboardingRpc;
    Enums: {
      app_role:
        | "platform_admin"
        | "owner"
        | "property_manager"
        | "staff"
        | "maintenance"
        | "resident"
        | "applicant"
        | "admin"
        | "leasing";
    };
    CompositeTypes: { [_ in never]: never };
  };
};
