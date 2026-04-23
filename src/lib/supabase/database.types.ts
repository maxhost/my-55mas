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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      category_translations: {
        Row: {
          category_id: string
          created_at: string | null
          locale: string
          name: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          locale: string
          name: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          locale?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_translations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_translations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories_localized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_translations_locale_fkey"
            columns: ["locale"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      cities: {
        Row: {
          country_id: string
          created_at: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          country_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          country_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries_localized"
            referencedColumns: ["id"]
          },
        ]
      }
      city_translations: {
        Row: {
          city_id: string
          created_at: string | null
          locale: string
          name: string
          updated_at: string | null
        }
        Insert: {
          city_id: string
          created_at?: string | null
          locale: string
          name: string
          updated_at?: string | null
        }
        Update: {
          city_id?: string
          created_at?: string | null
          locale?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "city_translations_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_translations_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities_localized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_translations_locale_fkey"
            columns: ["locale"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      client_profiles: {
        Row: {
          billing_address: string | null
          billing_postal_code: string | null
          billing_state: string | null
          company_name: string | null
          company_tax_id: string | null
          created_at: string | null
          id: string
          is_business: boolean
          legacy_id: number | null
          status: string
          terms_accepted: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_address?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          company_name?: string | null
          company_tax_id?: string | null
          created_at?: string | null
          id?: string
          is_business?: boolean
          legacy_id?: number | null
          status?: string
          terms_accepted?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_address?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          company_name?: string | null
          company_tax_id?: string | null
          created_at?: string | null
          id?: string
          is_business?: boolean
          legacy_id?: number | null
          status?: string
          terms_accepted?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          currency: string
          id: string
          is_active: boolean
          locale_default: string
          sort_order: number | null
          timezone: string
        }
        Insert: {
          code: string
          currency: string
          id?: string
          is_active?: boolean
          locale_default?: string
          sort_order?: number | null
          timezone?: string
        }
        Update: {
          code?: string
          currency?: string
          id?: string
          is_active?: boolean
          locale_default?: string
          sort_order?: number | null
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "countries_locale_default_fkey"
            columns: ["locale_default"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      country_translations: {
        Row: {
          country_id: string
          created_at: string | null
          locale: string
          name: string
          updated_at: string | null
        }
        Insert: {
          country_id: string
          created_at?: string | null
          locale: string
          name: string
          updated_at?: string | null
        }
        Update: {
          country_id?: string
          created_at?: string | null
          locale?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "country_translations_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "country_translations_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries_localized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "country_translations_locale_fkey"
            columns: ["locale"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      form_field_definition_translations: {
        Row: {
          description: string | null
          field_id: string
          label: string
          locale: string
          option_labels: Json | null
          placeholder: string | null
        }
        Insert: {
          description?: string | null
          field_id: string
          label: string
          locale: string
          option_labels?: Json | null
          placeholder?: string | null
        }
        Update: {
          description?: string | null
          field_id?: string
          label?: string
          locale?: string
          option_labels?: Json | null
          placeholder?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_field_definition_translations_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "form_field_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      form_field_definitions: {
        Row: {
          config: Json | null
          created_at: string | null
          group_id: string
          id: string
          input_type: string
          is_active: boolean
          key: string
          options: Json | null
          options_source: string | null
          persistence_target: Json | null
          persistence_type: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          group_id: string
          id?: string
          input_type: string
          is_active?: boolean
          key: string
          options?: Json | null
          options_source?: string | null
          persistence_target?: Json | null
          persistence_type: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          group_id?: string
          id?: string
          input_type?: string
          is_active?: boolean
          key?: string
          options?: Json | null
          options_source?: string | null
          persistence_target?: Json | null
          persistence_type?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_field_definitions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "form_field_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      form_field_group_translations: {
        Row: {
          group_id: string
          locale: string
          name: string
        }
        Insert: {
          group_id: string
          locale: string
          name: string
        }
        Update: {
          group_id?: string
          locale?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_field_group_translations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "form_field_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      form_field_groups: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          slug: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          slug: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      languages: {
        Row: {
          code: string
          is_active: boolean
          name: string
          sort_order: number | null
        }
        Insert: {
          code: string
          is_active?: boolean
          name: string
          sort_order?: number | null
        }
        Update: {
          code?: string
          is_active?: boolean
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      order_schedules: {
        Row: {
          created_at: string
          day_of_month: number | null
          end_date: string | null
          generation_paused: boolean
          id: string
          next_session_date: string | null
          order_id: string
          start_date: string
          time_end: string | null
          time_start: string
          timezone: string
          updated_at: string | null
          weekdays: number[] | null
        }
        Insert: {
          created_at?: string
          day_of_month?: number | null
          end_date?: string | null
          generation_paused?: boolean
          id?: string
          next_session_date?: string | null
          order_id: string
          start_date: string
          time_end?: string | null
          time_start: string
          timezone: string
          updated_at?: string | null
          weekdays?: number[] | null
        }
        Update: {
          created_at?: string
          day_of_month?: number | null
          end_date?: string | null
          generation_paused?: boolean
          id?: string
          next_session_date?: string | null
          order_id?: string
          start_date?: string
          time_end?: string | null
          time_start?: string
          timezone?: string
          updated_at?: string | null
          weekdays?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "order_schedules_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_sessions: {
        Row: {
          created_at: string | null
          id: string
          local_timezone: string
          notes: string | null
          order_id: string
          scheduled_end: string | null
          scheduled_start: string
          status: string
          talent_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          local_timezone: string
          notes?: string | null
          order_id: string
          scheduled_end?: string | null
          scheduled_start: string
          status?: string
          talent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          local_timezone?: string
          notes?: string | null
          order_id?: string
          scheduled_end?: string | null
          scheduled_start?: string
          status?: string
          talent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_sessions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_sessions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          from_status: string | null
          id: string
          notes: string | null
          order_id: string
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          from_status?: string | null
          id?: string
          notes?: string | null
          order_id: string
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          from_status?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          appointment_date: string | null
          client_id: string
          contact_address: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          country_id: string
          created_at: string | null
          currency: string
          discount: number | null
          form_data: Json
          form_id: string | null
          id: string
          legacy_data: Json | null
          legacy_id: string | null
          notes: string | null
          order_number: number
          payment_status: string | null
          price_subtotal: number
          price_tax: number
          price_tax_rate: number
          price_total: number
          quantity: number | null
          rating: number | null
          schedule_type: string
          service_address: string | null
          service_city_id: string | null
          service_id: string | null
          service_postal_code: string | null
          service_state: string | null
          specialist_unit_price: number | null
          staff_member_id: string | null
          status: string
          stripe_id: string | null
          talent_amount: number | null
          talent_id: string | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          client_id: string
          contact_address?: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          country_id: string
          created_at?: string | null
          currency: string
          discount?: number | null
          form_data: Json
          form_id?: string | null
          id?: string
          legacy_data?: Json | null
          legacy_id?: string | null
          notes?: string | null
          order_number?: number
          payment_status?: string | null
          price_subtotal: number
          price_tax?: number
          price_tax_rate?: number
          price_total: number
          quantity?: number | null
          rating?: number | null
          schedule_type?: string
          service_address?: string | null
          service_city_id?: string | null
          service_id?: string | null
          service_postal_code?: string | null
          service_state?: string | null
          specialist_unit_price?: number | null
          staff_member_id?: string | null
          status?: string
          stripe_id?: string | null
          talent_amount?: number | null
          talent_id?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          client_id?: string
          contact_address?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          country_id?: string
          created_at?: string | null
          currency?: string
          discount?: number | null
          form_data?: Json
          form_id?: string | null
          id?: string
          legacy_data?: Json | null
          legacy_id?: string | null
          notes?: string | null
          order_number?: number
          payment_status?: string | null
          price_subtotal?: number
          price_tax?: number
          price_tax_rate?: number
          price_total?: number
          quantity?: number | null
          rating?: number | null
          schedule_type?: string
          service_address?: string | null
          service_city_id?: string | null
          service_id?: string | null
          service_postal_code?: string | null
          service_state?: string | null
          specialist_unit_price?: number | null
          staff_member_id?: string | null
          status?: string
          stripe_id?: string | null
          talent_amount?: number | null
          talent_id?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries_localized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "service_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_service_city_id_fkey"
            columns: ["service_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_service_city_id_fkey"
            columns: ["service_city_id"]
            isOneToOne: false
            referencedRelation: "cities_localized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_localized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_role: string
          address: Json | null
          avatar_url: string | null
          birth_date: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          id: string
          nif: string | null
          other_language: string[] | null
          phone: string | null
          preferred_city: string | null
          preferred_contact: string | null
          preferred_country: string | null
          preferred_locale: string | null
          updated_at: string | null
        }
        Insert: {
          active_role?: string
          address?: Json | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          nif?: string | null
          other_language?: string[] | null
          phone?: string | null
          preferred_city?: string | null
          preferred_contact?: string | null
          preferred_country?: string | null
          preferred_locale?: string | null
          updated_at?: string | null
        }
        Update: {
          active_role?: string
          address?: Json | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          nif?: string | null
          other_language?: string[] | null
          phone?: string | null
          preferred_city?: string | null
          preferred_contact?: string | null
          preferred_country?: string | null
          preferred_locale?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_preferred_city_fkey"
            columns: ["preferred_city"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_preferred_city_fkey"
            columns: ["preferred_city"]
            isOneToOne: false
            referencedRelation: "cities_localized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_preferred_country_fkey"
            columns: ["preferred_country"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_preferred_country_fkey"
            columns: ["preferred_country"]
            isOneToOne: false
            referencedRelation: "countries_localized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_preferred_locale_fkey"
            columns: ["preferred_locale"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      registration_form_cities: {
        Row: {
          city_id: string
          created_at: string | null
          form_id: string
        }
        Insert: {
          city_id: string
          created_at?: string | null
          form_id: string
        }
        Update: {
          city_id?: string
          created_at?: string | null
          form_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_form_cities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_form_cities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities_localized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_form_cities_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "registration_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_form_countries: {
        Row: {
          country_id: string
          created_at: string | null
          form_id: string
        }
        Insert: {
          country_id: string
          created_at?: string | null
          form_id: string
        }
        Update: {
          country_id?: string
          created_at?: string | null
          form_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_form_countries_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_form_countries_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries_localized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_form_countries_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "registration_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_form_translations: {
        Row: {
          created_at: string | null
          form_id: string
          labels: Json
          locale: string
          option_labels: Json | null
          placeholders: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          form_id: string
          labels?: Json
          locale: string
          option_labels?: Json | null
          placeholders?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          form_id?: string
          labels?: Json
          locale?: string
          option_labels?: Json | null
          placeholders?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_form_translations_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "registration_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_form_translations_locale_fkey"
            columns: ["locale"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      registration_forms: {
        Row: {
          city_id: string | null
          created_at: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          schema: Json
          slug: string
          target_role: string
          updated_at: string | null
          version: number
        }
        Insert: {
          city_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          schema?: Json
          slug: string
          target_role?: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          city_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          schema?: Json
          slug?: string
          target_role?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "registration_forms_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_forms_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities_localized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_forms_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "registration_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      service_cities: {
        Row: {
          base_price: number
          city_id: string
          created_at: string | null
          is_active: boolean
          service_id: string
          updated_at: string | null
        }
        Insert: {
          base_price: number
          city_id: string
          created_at?: string | null
          is_active?: boolean
          service_id: string
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          city_id?: string
          created_at?: string | null
          is_active?: boolean
          service_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_cities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_cities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities_localized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_cities_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_cities_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_localized"
            referencedColumns: ["id"]
          },
        ]
      }
      service_countries: {
        Row: {
          base_price: number
          country_id: string
          is_active: boolean
          service_id: string
        }
        Insert: {
          base_price: number
          country_id: string
          is_active?: boolean
          service_id: string
        }
        Update: {
          base_price?: number
          country_id?: string
          is_active?: boolean
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_countries_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_countries_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries_localized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_countries_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_countries_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_localized"
            referencedColumns: ["id"]
          },
        ]
      }
      service_form_translations: {
        Row: {
          created_at: string | null
          form_id: string
          labels: Json
          locale: string
          option_labels: Json | null
          placeholders: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          form_id: string
          labels: Json
          locale: string
          option_labels?: Json | null
          placeholders?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          form_id?: string
          labels?: Json
          locale?: string
          option_labels?: Json | null
          placeholders?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_form_translations_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "service_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_form_translations_locale_fkey"
            columns: ["locale"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      service_forms: {
        Row: {
          city_id: string | null
          created_at: string | null
          id: string
          is_active: boolean
          schema: Json
          service_id: string
          updated_at: string | null
          version: number
        }
        Insert: {
          city_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          schema: Json
          service_id: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          city_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          schema?: Json
          service_id?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_forms_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_forms_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities_localized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_forms_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_forms_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_localized"
            referencedColumns: ["id"]
          },
        ]
      }
      service_required_document_translations: {
        Row: {
          created_at: string | null
          description: string | null
          document_id: string
          label: string
          locale: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document_id: string
          label: string
          locale: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document_id?: string
          label?: string
          locale?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_required_document_translations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "service_required_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_required_document_translations_locale_fkey"
            columns: ["locale"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      service_required_documents: {
        Row: {
          country_id: string
          created_at: string | null
          document_type: string
          id: string
          is_required: boolean
          service_id: string
          updated_at: string | null
        }
        Insert: {
          country_id: string
          created_at?: string | null
          document_type: string
          id?: string
          is_required?: boolean
          service_id: string
          updated_at?: string | null
        }
        Update: {
          country_id?: string
          created_at?: string | null
          document_type?: string
          id?: string
          is_required?: boolean
          service_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_required_documents_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_required_documents_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries_localized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_required_documents_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_required_documents_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_localized"
            referencedColumns: ["id"]
          },
        ]
      }
      service_subtype_group_assignments: {
        Row: {
          created_at: string | null
          group_id: string
          service_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          group_id: string
          service_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string | null
          group_id?: string
          service_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_subtype_group_assignments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "service_subtype_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_subtype_group_assignments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_subtype_group_assignments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_localized"
            referencedColumns: ["id"]
          },
        ]
      }
      service_subtype_group_translations: {
        Row: {
          created_at: string | null
          group_id: string
          locale: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          group_id: string
          locale: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          group_id?: string
          locale?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_subtype_group_translations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "service_subtype_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_subtype_group_translations_locale_fkey"
            columns: ["locale"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      service_subtype_groups: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          slug: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          slug: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      service_subtype_translations: {
        Row: {
          created_at: string | null
          locale: string
          name: string
          subtype_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          locale: string
          name: string
          subtype_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          locale?: string
          name?: string
          subtype_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_subtype_translations_locale_fkey"
            columns: ["locale"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "service_subtype_translations_subtype_id_fkey"
            columns: ["subtype_id"]
            isOneToOne: false
            referencedRelation: "service_subtypes"
            referencedColumns: ["id"]
          },
        ]
      }
      service_subtypes: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          is_active: boolean
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          is_active?: boolean
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          is_active?: boolean
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_subtypes_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "service_subtype_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      service_translations: {
        Row: {
          benefits: Json | null
          created_at: string | null
          description: string | null
          faqs: Json | null
          guarantees: Json | null
          hero_subtitle: string | null
          hero_title: string | null
          includes: string | null
          locale: string
          name: string
          service_id: string
          updated_at: string | null
        }
        Insert: {
          benefits?: Json | null
          created_at?: string | null
          description?: string | null
          faqs?: Json | null
          guarantees?: Json | null
          hero_subtitle?: string | null
          hero_title?: string | null
          includes?: string | null
          locale: string
          name: string
          service_id: string
          updated_at?: string | null
        }
        Update: {
          benefits?: Json | null
          created_at?: string | null
          description?: string | null
          faqs?: Json | null
          guarantees?: Json | null
          hero_subtitle?: string | null
          hero_title?: string | null
          includes?: string | null
          locale?: string
          name?: string
          service_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_translations_locale_fkey"
            columns: ["locale"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "service_translations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_translations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_localized"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          allows_recurrence: boolean
          category_id: string | null
          cover_image_url: string | null
          created_at: string | null
          id: string
          slug: string
          status: string
          updated_at: string | null
        }
        Insert: {
          allows_recurrence?: boolean
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          slug: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          allows_recurrence?: boolean
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          slug?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories_localized"
            referencedColumns: ["id"]
          },
        ]
      }
      spoken_language_aliases: {
        Row: {
          alias_normalized: string
          language_code: string
          original_text: string
        }
        Insert: {
          alias_normalized: string
          language_code: string
          original_text: string
        }
        Update: {
          alias_normalized?: string
          language_code?: string
          original_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "spoken_language_aliases_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "spoken_languages"
            referencedColumns: ["code"]
          },
        ]
      }
      spoken_language_translations: {
        Row: {
          language_code: string
          locale: string
          name: string
        }
        Insert: {
          language_code: string
          locale: string
          name: string
        }
        Update: {
          language_code?: string
          locale?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "spoken_language_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "spoken_languages"
            referencedColumns: ["code"]
          },
        ]
      }
      spoken_languages: {
        Row: {
          code: string
          created_at: string
          is_active: boolean
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          is_active?: boolean
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          is_active?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      staff_profiles: {
        Row: {
          created_at: string | null
          first_name: string
          id: string
          last_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          first_name: string
          id?: string
          last_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          first_name?: string
          id?: string
          last_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_role_scopes: {
        Row: {
          city_id: string | null
          country_id: string | null
          created_at: string | null
          permissions: string[]
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          city_id?: string | null
          country_id?: string | null
          created_at?: string | null
          permissions?: string[]
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          city_id?: string | null
          country_id?: string | null
          created_at?: string | null
          permissions?: string[]
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_role_scopes_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_role_scopes_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities_localized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_role_scopes_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_role_scopes_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries_localized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_role_scopes_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "staff_roles"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "staff_role_scopes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_role_scopes_user_id_role_fkey"
            columns: ["user_id", "role"]
            isOneToOne: true
            referencedRelation: "user_roles"
            referencedColumns: ["user_id", "role"]
          },
        ]
      }
      staff_roles: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          is_active: boolean
          key: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          is_active?: boolean
          key: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          is_active?: boolean
          key?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      survey_question_translations: {
        Row: {
          created_at: string | null
          description: string | null
          label: string
          locale: string
          option_labels: Json | null
          question_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          label: string
          locale: string
          option_labels?: Json | null
          question_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          label?: string
          locale?: string
          option_labels?: Json | null
          question_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_question_translations_locale_fkey"
            columns: ["locale"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "survey_question_translations_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          key: string
          options: Json | null
          response_type: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          key: string
          options?: Json | null
          response_type: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          key?: string
          options?: Json | null
          response_type?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      survey_responses: {
        Row: {
          created_at: string | null
          id: string
          key: string
          user_id: string
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          user_id: string
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          user_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_analytics: {
        Row: {
          created_at: string | null
          id: string
          key: string
          talent_id: string
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          talent_id: string
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          talent_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_analytics_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_documents: {
        Row: {
          created_at: string | null
          document_type: string
          file_path: string
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          talent_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_type: string
          file_path: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          talent_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string
          file_path?: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          talent_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_documents_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_form_translations: {
        Row: {
          created_at: string | null
          form_id: string
          labels: Json
          locale: string
          option_labels: Json | null
          placeholders: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          form_id: string
          labels: Json
          locale: string
          option_labels?: Json | null
          placeholders?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          form_id?: string
          labels?: Json
          locale?: string
          option_labels?: Json | null
          placeholders?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_form_translations_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "talent_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_form_translations_locale_fkey"
            columns: ["locale"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      talent_forms: {
        Row: {
          city_id: string | null
          created_at: string | null
          id: string
          is_active: boolean
          schema: Json
          service_id: string
          updated_at: string | null
          version: number
        }
        Insert: {
          city_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          schema?: Json
          service_id: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          city_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          schema?: Json
          service_id?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "talent_forms_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_forms_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities_localized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_forms_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_forms_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_localized"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_profile_translations: {
        Row: {
          bio: string | null
          created_at: string | null
          experience: string | null
          locale: string
          talent_id: string
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          experience?: string | null
          locale: string
          talent_id: string
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          experience?: string | null
          locale?: string
          talent_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_profile_translations_locale_fkey"
            columns: ["locale"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "talent_profile_translations_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          city_id: string | null
          country_id: string | null
          created_at: string | null
          created_by: string | null
          has_car: boolean | null
          id: string
          internal_notes: string | null
          legacy_id: number | null
          photo_url: string | null
          preferred_payment: string | null
          professional_status: string | null
          status: string
          terms_accepted: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          city_id?: string | null
          country_id?: string | null
          created_at?: string | null
          created_by?: string | null
          has_car?: boolean | null
          id?: string
          internal_notes?: string | null
          legacy_id?: number | null
          photo_url?: string | null
          preferred_payment?: string | null
          professional_status?: string | null
          status?: string
          terms_accepted?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          city_id?: string | null
          country_id?: string | null
          created_at?: string | null
          created_by?: string | null
          has_car?: boolean | null
          id?: string
          internal_notes?: string | null
          legacy_id?: number | null
          photo_url?: string | null
          preferred_payment?: string | null
          professional_status?: string | null
          status?: string
          terms_accepted?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities_localized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_profiles_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_profiles_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries_localized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_service_subtypes: {
        Row: {
          created_at: string | null
          subtype_id: string
          talent_id: string
        }
        Insert: {
          created_at?: string | null
          subtype_id: string
          talent_id: string
        }
        Update: {
          created_at?: string | null
          subtype_id?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_service_subtypes_subtype_id_fkey"
            columns: ["subtype_id"]
            isOneToOne: false
            referencedRelation: "service_subtypes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_service_subtypes_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_services: {
        Row: {
          country_id: string
          created_at: string | null
          form_data: Json | null
          form_id: string | null
          is_verified: boolean
          service_id: string
          specializations: Json | null
          talent_id: string
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          country_id: string
          created_at?: string | null
          form_data?: Json | null
          form_id?: string | null
          is_verified?: boolean
          service_id: string
          specializations?: Json | null
          talent_id: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          country_id?: string
          created_at?: string | null
          form_data?: Json | null
          form_id?: string | null
          is_verified?: boolean
          service_id?: string
          specializations?: Json | null
          talent_id?: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_services_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_services_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries_localized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_services_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "talent_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_localized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_services_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_tag_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          tag_id: string
          talent_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          tag_id: string
          talent_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          tag_id?: string
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_tag_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "talent_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_tag_assignments_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_tag_translations: {
        Row: {
          created_at: string
          locale: string
          name: string
          tag_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          locale: string
          name: string
          tag_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          locale?: string
          name?: string
          tag_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_tag_translations_locale_fkey"
            columns: ["locale"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "talent_tag_translations_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "talent_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_tags: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          added_by: string | null
          created_at: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_form_responses: {
        Row: {
          created_at: string | null
          field_definition_id: string
          id: string
          updated_at: string | null
          user_id: string
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          field_definition_id: string
          id?: string
          updated_at?: string | null
          user_id: string
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          field_definition_id?: string
          id?: string
          updated_at?: string | null
          user_id?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_form_responses_field_definition_id_fkey"
            columns: ["field_definition_id"]
            isOneToOne: false
            referencedRelation: "form_field_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_form_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          granted_by: string | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted_by?: string | null
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted_by?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      categories_localized: {
        Row: {
          icon: string | null
          id: string | null
          is_active: boolean | null
          locale: string | null
          name: string | null
          slug: string | null
          sort_order: number | null
        }
        Relationships: [
          {
            foreignKeyName: "category_translations_locale_fkey"
            columns: ["locale"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      cities_localized: {
        Row: {
          country_id: string | null
          id: string | null
          is_active: boolean | null
          locale: string | null
          name: string | null
          slug: string | null
          sort_order: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries_localized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_translations_locale_fkey"
            columns: ["locale"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      countries_localized: {
        Row: {
          code: string | null
          currency: string | null
          id: string | null
          is_active: boolean | null
          locale: string | null
          locale_default: string | null
          name: string | null
          sort_order: number | null
          timezone: string | null
        }
        Relationships: [
          {
            foreignKeyName: "countries_locale_default_fkey"
            columns: ["locale_default"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "country_translations_locale_fkey"
            columns: ["locale"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      services_localized: {
        Row: {
          allows_recurrence: boolean | null
          category_id: string | null
          description: string | null
          id: string | null
          includes: string | null
          locale: string | null
          name: string | null
          slug: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_translations_locale_fkey"
            columns: ["locale"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories_localized"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      delete_service: { Args: { p_service_id: string }; Returns: undefined }
      save_service_config: {
        Args: {
          p_allows_recurrence?: boolean
          p_cities?: Json
          p_countries?: Json
          p_service_id: string
          p_status?: string
        }
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

