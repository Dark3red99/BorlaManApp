// Generated from the Supabase schema (supabase/migrations), with the helper
// types at the bottom trimmed. Regenerate after every migration.

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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      collection_points: {
        Row: {
          gps_text: string | null
          label: string
          lat: number | null
          lng: number | null
          location: unknown
          source: Database["public"]["Enums"]["location_source"]
          updated_at: string
          user_id: string
        }
        Insert: {
          gps_text?: string | null
          label: string
          location: unknown
          source?: Database["public"]["Enums"]["location_source"]
          updated_at?: string
          user_id: string
        }
        Update: {
          gps_text?: string | null
          label?: string
          location?: unknown
          source?: Database["public"]["Enums"]["location_source"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_requests: {
        Row: {
          address_text: string
          arrived_at: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          claimed_at: string | null
          collected_at: string | null
          completed_at: string | null
          created_at: string
          customer_id: string
          en_route_at: string | null
          id: string
          lat: number | null
          lng: number | null
          location: unknown
          mode: Database["public"]["Enums"]["dispatch_mode"]
          photos: string[]
          plan_id: string | null
          price_ghs: number
          priority_fee_ghs: number
          proof_photo: string | null
          rider_id: string | null
          scheduled_for: string
          size_ghs: number
          status: Database["public"]["Enums"]["request_status"]
          type_multiplier: number
          volume_kg: number
          waste_type: Database["public"]["Enums"]["waste_type"]
        }
        Insert: {
          address_text: string
          arrived_at?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          claimed_at?: string | null
          collected_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id: string
          en_route_at?: string | null
          id?: string
          location: unknown
          mode: Database["public"]["Enums"]["dispatch_mode"]
          photos?: string[]
          plan_id?: string | null
          price_ghs: number
          priority_fee_ghs?: number
          proof_photo?: string | null
          rider_id?: string | null
          scheduled_for: string
          size_ghs: number
          status?: Database["public"]["Enums"]["request_status"]
          type_multiplier: number
          volume_kg: number
          waste_type: Database["public"]["Enums"]["waste_type"]
        }
        Update: {
          address_text?: string
          arrived_at?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          claimed_at?: string | null
          collected_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string
          en_route_at?: string | null
          id?: string
          location?: unknown
          mode?: Database["public"]["Enums"]["dispatch_mode"]
          photos?: string[]
          plan_id?: string | null
          price_ghs?: number
          priority_fee_ghs?: number
          proof_photo?: string | null
          rider_id?: string | null
          scheduled_for?: string
          size_ghs?: number
          status?: Database["public"]["Enums"]["request_status"]
          type_multiplier?: number
          volume_kg?: number
          waste_type?: Database["public"]["Enums"]["waste_type"]
        }
        Relationships: [
          {
            foreignKeyName: "pickup_requests_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_requests_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "recurring_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_requests_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_requests_volume_kg_fkey"
            columns: ["volume_kg"]
            isOneToOne: false
            referencedRelation: "size_bands"
            referencedColumns: ["kg"]
          },
        ]
      }
      points_entries: {
        Row: {
          created_at: string
          id: string
          points: number
          ref_id: string | null
          source: Database["public"]["Enums"]["point_source"]
          user_id: string
          waste_type: Database["public"]["Enums"]["waste_type"] | null
        }
        Insert: {
          created_at?: string
          id?: string
          points: number
          ref_id?: string | null
          source: Database["public"]["Enums"]["point_source"]
          user_id: string
          waste_type?: Database["public"]["Enums"]["waste_type"] | null
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          ref_id?: string | null
          source?: Database["public"]["Enums"]["point_source"]
          user_id?: string
          waste_type?: Database["public"]["Enums"]["waste_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "points_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_settings: {
        Row: {
          co2_per_kg: number
          dev_simulation: boolean
          id: boolean
          points_per_kg: number
          priority_fee_ghs: number
          updated_at: string
        }
        Insert: {
          co2_per_kg?: number
          dev_simulation?: boolean
          id?: boolean
          points_per_kg?: number
          priority_fee_ghs?: number
          updated_at?: string
        }
        Update: {
          co2_per_kg?: number
          dev_simulation?: boolean
          id?: boolean
          points_per_kg?: number
          priority_fee_ghs?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_line: string | null
          area: string | null
          category: Database["public"]["Enums"]["customer_category"] | null
          created_at: string
          district: string | null
          email: string | null
          full_name: string
          gps_text: string | null
          id: string
          phone: string | null
          region: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          address_line?: string | null
          area?: string | null
          category?: Database["public"]["Enums"]["customer_category"] | null
          created_at?: string
          district?: string | null
          email?: string | null
          full_name?: string
          gps_text?: string | null
          id: string
          phone?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          address_line?: string | null
          area?: string | null
          category?: Database["public"]["Enums"]["customer_category"] | null
          created_at?: string
          district?: string | null
          email?: string | null
          full_name?: string
          gps_text?: string | null
          id?: string
          phone?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      quiz_results: {
        Row: {
          best_score: number
          completed_at: string
          id: string
          points_earned: number
          quiz_id: string
          total_questions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          best_score: number
          completed_at?: string
          id?: string
          points_earned?: number
          quiz_id: string
          total_questions: number
          updated_at?: string
          user_id: string
        }
        Update: {
          best_score?: number
          completed_at?: string
          id?: string
          points_earned?: number
          quiz_id?: string
          total_questions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_plans: {
        Row: {
          active: boolean
          address_text: string
          created_at: string
          customer_id: string
          frequency: Database["public"]["Enums"]["plan_frequency"]
          hour: number
          id: string
          lat: number | null
          lng: number | null
          location: unknown
          price_ghs: number
          volume_kg: number
          waste_type: Database["public"]["Enums"]["waste_type"]
          weekday: number
        }
        Insert: {
          active?: boolean
          address_text: string
          created_at?: string
          customer_id: string
          frequency?: Database["public"]["Enums"]["plan_frequency"]
          hour: number
          id?: string
          location: unknown
          price_ghs: number
          volume_kg: number
          waste_type: Database["public"]["Enums"]["waste_type"]
          weekday: number
        }
        Update: {
          active?: boolean
          address_text?: string
          created_at?: string
          customer_id?: string
          frequency?: Database["public"]["Enums"]["plan_frequency"]
          hour?: number
          id?: string
          location?: unknown
          price_ghs?: number
          volume_kg?: number
          waste_type?: Database["public"]["Enums"]["waste_type"]
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "recurring_plans_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_plans_volume_kg_fkey"
            columns: ["volume_kg"]
            isOneToOne: false
            referencedRelation: "size_bands"
            referencedColumns: ["kg"]
          },
        ]
      }
      rider_documents: {
        Row: {
          created_at: string
          doc_type: Database["public"]["Enums"]["rider_doc_type"]
          id: string
          reviewed: boolean
          rider_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          doc_type: Database["public"]["Enums"]["rider_doc_type"]
          id?: string
          reviewed?: boolean
          rider_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          doc_type?: Database["public"]["Enums"]["rider_doc_type"]
          id?: string
          reviewed?: boolean
          rider_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "rider_documents_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      riders: {
        Row: {
          approved_at: string | null
          capacity_kg: number
          created_at: string
          fleet_owner_id: string | null
          id: string
          is_online: boolean
          load_kg: number
          lat: number | null
          lng: number | null
          location: unknown
          location_updated_at: string | null
          payout_momo: string | null
          rating: number
          status: Database["public"]["Enums"]["rider_status"]
          vehicle_plate: string | null
          waste_types: Database["public"]["Enums"]["waste_type"][]
        }
        Insert: {
          approved_at?: string | null
          capacity_kg?: number
          created_at?: string
          fleet_owner_id?: string | null
          id: string
          is_online?: boolean
          load_kg?: number
          location?: unknown
          location_updated_at?: string | null
          payout_momo?: string | null
          rating?: number
          status?: Database["public"]["Enums"]["rider_status"]
          vehicle_plate?: string | null
          waste_types?: Database["public"]["Enums"]["waste_type"][]
        }
        Update: {
          approved_at?: string | null
          capacity_kg?: number
          created_at?: string
          fleet_owner_id?: string | null
          id?: string
          is_online?: boolean
          load_kg?: number
          location?: unknown
          location_updated_at?: string | null
          payout_momo?: string | null
          rating?: number
          status?: Database["public"]["Enums"]["rider_status"]
          vehicle_plate?: string | null
          waste_types?: Database["public"]["Enums"]["waste_type"][]
        }
        Relationships: [
          {
            foreignKeyName: "riders_fleet_owner_id_fkey"
            columns: ["fleet_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riders_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      size_bands: {
        Row: {
          hint: string
          kg: number
          label: string
          on_demand_ghs: number
          plan_ghs: number
          short: string
          sort: number
        }
        Insert: {
          hint: string
          kg: number
          label: string
          on_demand_ghs: number
          plan_ghs: number
          short: string
          sort: number
        }
        Update: {
          hint?: string
          kg?: number
          label?: string
          on_demand_ghs?: number
          plan_ghs?: number
          short?: string
          sort?: number
        }
        Relationships: []
      }
      waste_type_rates: {
        Row: {
          label: string
          multiplier: number
          type: Database["public"]["Enums"]["waste_type"]
        }
        Insert: {
          label: string
          multiplier: number
          type: Database["public"]["Enums"]["waste_type"]
        }
        Update: {
          label?: string
          multiplier?: number
          type?: Database["public"]["Enums"]["waste_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_pickup_request: {
        Args: { p_request_id: string }
        Returns: Database["public"]["Tables"]["pickup_requests"]["Row"]
        SetofOptions: {
          from: "*"
          to: "pickup_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_pickup_request: {
        Args: {
          p_address_text: string
          p_asap: boolean
          p_lat: number
          p_lng: number
          p_photos?: string[]
          p_scheduled_for?: string
          p_volume_kg: number
          p_waste_type: Database["public"]["Enums"]["waste_type"]
        }
        Returns: Database["public"]["Tables"]["pickup_requests"]["Row"]
        SetofOptions: {
          from: "*"
          to: "pickup_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_recurring_plans: {
        Args: {
          p_address_text: string
          p_frequency: Database["public"]["Enums"]["plan_frequency"]
          p_hour: number
          p_lat: number
          p_lng: number
          p_volume_kg: number
          p_waste_type: Database["public"]["Enums"]["waste_type"]
          p_weekdays: number[]
        }
        Returns: Database["public"]["Tables"]["recurring_plans"]["Row"][]
        SetofOptions: {
          from: "*"
          to: "recurring_plans"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      dev_advance_request: {
        Args: {
          p_request_id: string
          p_status: Database["public"]["Enums"]["request_status"]
        }
        Returns: Database["public"]["Tables"]["pickup_requests"]["Row"]
      }
      set_collection_point: {
        Args: {
          p_lat: number
          p_lng: number
          p_label: string
          p_gps_text?: string | null
          p_source?: Database["public"]["Enums"]["location_source"]
        }
        Returns: Database["public"]["Tables"]["collection_points"]["Row"]
      }
      submit_quiz: {
        Args: { p_quiz_id: string; p_correct: number; p_total: number }
        Returns: {
          result: Database["public"]["Tables"]["quiz_results"]["Row"]
          points_awarded: number
        }[]
      }
      plan_price: {
        Args: {
          p_volume_kg: number
          p_waste_type: Database["public"]["Enums"]["waste_type"]
        }
        Returns: number
      }
      quote_price: {
        Args: {
          p_asap: boolean
          p_volume_kg: number
          p_waste_type: Database["public"]["Enums"]["waste_type"]
        }
        Returns: {
          priority_fee_ghs: number
          size_ghs: number
          total_ghs: number
          type_multiplier: number
        }[]
      }
    }
    Enums: {
      customer_category: "household" | "corporate"
      dispatch_mode: "asap" | "scheduled"
      location_source: "gps" | "search" | "pin" | "digital_address"
      plan_frequency: "weekly" | "biweekly"
      point_source: "pickup" | "quiz"
      request_status:
        | "pending"
        | "claimed"
        | "en_route"
        | "arrived"
        | "collecting"
        | "completed"
        | "cancelled"
      rider_doc_type:
        | "ghana_card"
        | "selfie"
        | "tricycle_photo"
        | "licence"
        | "other"
      rider_status: "pending_review" | "approved" | "suspended" | "rejected"
      user_role: "customer" | "rider" | "fleet_owner" | "admin"
      waste_type: "household" | "recyclables" | "organic" | "ewaste" | "mixed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T]
