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
          client_id: string
          contact_address: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          country_id: string
          created_at: string | null
          currency: string
          form_data: Json
          form_id: string
          id: string
          notes: string | null
          price_subtotal: number
          price_tax: number
          price_tax_rate: number
          price_total: number
          schedule_type: string
          service_address: string | null
          service_city_id: string | null
          service_id: string
          service_postal_code: string | null
          status: string
          talent_id: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          contact_address?: string | null
          contact_email: string
          contact_name: string
          contact_phone: string
          country_id: string
          created_at?: string | null
          currency: string
          form_data: Json
          form_id: string
          id?: string
          notes?: string | null
          price_subtotal: number
          price_tax?: number
          price_tax_rate?: number
          price_total: number
          schedule_type?: string
          service_address?: string | null
          service_city_id?: string | null
          service_id: string
          service_postal_code?: string | null
          status?: string
          talent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          contact_address?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          country_id?: string
          created_at?: string | null
          currency?: string
          form_data?: Json
          form_id?: string
          id?: string
          notes?: string | null
          price_subtotal?: number
          price_tax?: number
          price_tax_rate?: number
          price_total?: number
          schedule_type?: string
          service_address?: string | null
          service_city_id?: string | null
          service_id?: string
          service_postal_code?: string | null
          status?: string
          talent_id?: string | null
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
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          preferred_country: string | null
          preferred_locale: string | null
          updated_at: string | null
        }
        Insert: {
          active_role?: string
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          preferred_country?: string | null
          preferred_locale?: string | null
          updated_at?: string | null
        }
        Update: {
          active_role?: string
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_country?: string | null
          preferred_locale?: string | null
          updated_at?: string | null
        }
        Relationships: [
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
          country_id: string | null
          created_at: string | null
          id: string
          is_active: boolean
          schema: Json
          service_id: string
          updated_at: string | null
          version: number
        }
        Insert: {
          country_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          schema: Json
          service_id: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          country_id?: string | null
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
            foreignKeyName: "service_forms_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_forms_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries_localized"
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
          address: string | null
          approved_at: string | null
          approved_by: string | null
          birth_date: string
          city_id: string | null
          country_id: string | null
          created_at: string | null
          id: string
          photo_url: string | null
          postal_code: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          birth_date: string
          city_id?: string | null
          country_id?: string | null
          created_at?: string | null
          id?: string
          photo_url?: string | null
          postal_code?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          birth_date?: string
          city_id?: string | null
          country_id?: string | null
          created_at?: string | null
          id?: string
          photo_url?: string | null
          postal_code?: string | null
          status?: string
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
            foreignKeyName: "talent_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_services: {
        Row: {
          country_id: string
          created_at: string | null
          is_verified: boolean
          service_id: string
          talent_id: string
          updated_at: string | null
        }
        Insert: {
          country_id: string
          created_at?: string | null
          is_verified?: boolean
          service_id: string
          talent_id: string
          updated_at?: string | null
        }
        Update: {
          country_id?: string
          created_at?: string | null
          is_verified?: boolean
          service_id?: string
          talent_id?: string
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

