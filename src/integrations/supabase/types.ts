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
      action_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_read: boolean | null
          can_update: boolean | null
          created_at: string | null
          id: string
          page_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          created_at?: string | null
          id?: string
          page_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          created_at?: string | null
          id?: string
          page_key?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bolivia_fitness_docs: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          Anuncio: string | null
          canal: string | null
          chat_status: string
          conversation_mode:
            | Database["public"]["Enums"]["conversation_mode"]
            | null
          created_at: string | null
          custom_fields: Json | null
          email: string | null
          id: string
          is_active: boolean | null
          last_order_at: string | null
          name: string | null
          needs_human_support: boolean | null
          notes: string | null
          phone: string
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          Anuncio?: string | null
          canal?: string | null
          chat_status?: string
          conversation_mode?:
            | Database["public"]["Enums"]["conversation_mode"]
            | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          last_order_at?: string | null
          name?: string | null
          needs_human_support?: boolean | null
          notes?: string | null
          phone: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          Anuncio?: string | null
          canal?: string | null
          chat_status?: string
          conversation_mode?:
            | Database["public"]["Enums"]["conversation_mode"]
            | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          last_order_at?: string | null
          name?: string | null
          needs_human_support?: boolean | null
          notes?: string | null
          phone?: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          address: string
          assigned_at: string | null
          created_at: string | null
          delivered_at: string | null
          driver_id: string | null
          driver_name: string | null
          driver_phone: string | null
          failure_reason: string | null
          id: string
          location_url: string | null
          notes: string | null
          order_id: string
          status: Database["public"]["Enums"]["delivery_status"] | null
          updated_at: string | null
        }
        Insert: {
          address: string
          assigned_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          driver_id?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          failure_reason?: string | null
          id?: string
          location_url?: string | null
          notes?: string | null
          order_id: string
          status?: Database["public"]["Enums"]["delivery_status"] | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          assigned_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          driver_id?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          failure_reason?: string | null
          id?: string
          location_url?: string | null
          notes?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["delivery_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "delivery_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "active_deliveries_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_complete_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pending_payments_view"
            referencedColumns: ["order_id"]
          },
        ]
      }
      delivery_drivers: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          is_active: boolean | null
          phone: string
          successful_deliveries: number | null
          total_deliveries: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          phone: string
          successful_deliveries?: number | null
          total_deliveries?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string
          successful_deliveries?: number | null
          total_deliveries?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "active_deliveries_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_complete_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pending_payments_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string | null
          custom_fields: Json | null
          customer_id: string
          id: string
          notes: string | null
          order_number: string
          status: Database["public"]["Enums"]["order_status"] | null
          total: number
          updated_at: string | null
        }
        Insert: {
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          customer_id: string
          id?: string
          notes?: string | null
          order_number: string
          status?: Database["public"]["Enums"]["order_status"] | null
          total: number
          updated_at?: string | null
        }
        Update: {
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          customer_id?: string
          id?: string
          notes?: string | null
          order_number?: string
          status?: Database["public"]["Enums"]["order_status"] | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "active_deliveries_view"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_stats_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "orders_complete_view"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "pending_payments_view"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      page_permissions: {
        Row: {
          can_access: boolean | null
          created_at: string | null
          id: string
          page_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          can_access?: boolean | null
          created_at?: string | null
          id?: string
          page_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          can_access?: boolean | null
          created_at?: string | null
          id?: string
          page_key?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          order_id: string
          rejection_reason: Json | null
          review_reason: string | null
          screenshot_url: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          order_id: string
          rejection_reason?: Json | null
          review_reason?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          order_id?: string
          rejection_reason?: Json | null
          review_reason?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "active_deliveries_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders_complete_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "pending_payments_view"
            referencedColumns: ["order_id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string | null
          custom_fields: Json | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          low_stock_threshold: number | null
          name: string
          price: number
          stock: number
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          low_stock_threshold?: number | null
          name: string
          price: number
          stock?: number
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          low_stock_threshold?: number | null
          name?: string
          price?: number
          stock?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          order_id: string | null
          product_id: string
          quantity: number
          reason: string | null
          stock_after: number
          stock_before: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          order_id?: string | null
          product_id: string
          quantity: number
          reason?: string | null
          stock_after: number
          stock_before: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          movement_type?: Database["public"]["Enums"]["stock_movement_type"]
          order_id?: string | null
          product_id?: string
          quantity?: number
          reason?: string | null
          stock_after?: number
          stock_before?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "active_deliveries_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "stock_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_complete_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pending_payments_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sucursales: {
        Row: {
          descripcion: string | null
          direccion: string
          id: number
          nombre: string
        }
        Insert: {
          descripcion?: string | null
          direccion: string
          id?: number
          nombre: string
        }
        Update: {
          descripcion?: string | null
          direccion?: string
          id?: number
          nombre?: string
        }
        Relationships: []
      }
      system_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          priority: Database["public"]["Enums"]["notification_priority"] | null
          read_at: string | null
          related_customer_id: string | null
          related_order_id: string | null
          related_product_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          priority?: Database["public"]["Enums"]["notification_priority"] | null
          read_at?: string | null
          related_customer_id?: string | null
          related_order_id?: string | null
          related_product_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          priority?: Database["public"]["Enums"]["notification_priority"] | null
          read_at?: string | null
          related_customer_id?: string | null
          related_order_id?: string | null
          related_product_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_notifications_related_customer_id_fkey"
            columns: ["related_customer_id"]
            isOneToOne: false
            referencedRelation: "active_deliveries_view"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "system_notifications_related_customer_id_fkey"
            columns: ["related_customer_id"]
            isOneToOne: false
            referencedRelation: "customer_stats_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_notifications_related_customer_id_fkey"
            columns: ["related_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_notifications_related_customer_id_fkey"
            columns: ["related_customer_id"]
            isOneToOne: false
            referencedRelation: "orders_complete_view"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "system_notifications_related_customer_id_fkey"
            columns: ["related_customer_id"]
            isOneToOne: false
            referencedRelation: "pending_payments_view"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "system_notifications_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "active_deliveries_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "system_notifications_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_notifications_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "orders_complete_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_notifications_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "pending_payments_view"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "system_notifications_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_notifications_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      table_column_definitions: {
        Row: {
          column_key: string
          column_name: string
          column_order: number
          column_type: Database["public"]["Enums"]["column_type"]
          column_width: number | null
          created_at: string | null
          default_value: string | null
          id: string
          is_required: boolean
          is_system: boolean
          is_visible: boolean
          module_key: string
          options: Json | null
          updated_at: string | null
        }
        Insert: {
          column_key: string
          column_name: string
          column_order?: number
          column_type?: Database["public"]["Enums"]["column_type"]
          column_width?: number | null
          created_at?: string | null
          default_value?: string | null
          id?: string
          is_required?: boolean
          is_system?: boolean
          is_visible?: boolean
          module_key: string
          options?: Json | null
          updated_at?: string | null
        }
        Update: {
          column_key?: string
          column_name?: string
          column_order?: number
          column_type?: Database["public"]["Enums"]["column_type"]
          column_width?: number | null
          created_at?: string | null
          default_value?: string | null
          id?: string
          is_required?: boolean
          is_system?: boolean
          is_visible?: boolean
          module_key?: string
          options?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          last_login: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_logs: {
        Row: {
          ai_agent_phase: string | null
          content: string
          created_at: string | null
          customer_id: string
          id: string
          is_automated: boolean | null
          message_type: string
        }
        Insert: {
          ai_agent_phase?: string | null
          content: string
          created_at?: string | null
          customer_id: string
          id?: string
          is_automated?: boolean | null
          message_type: string
        }
        Update: {
          ai_agent_phase?: string | null
          content?: string
          created_at?: string | null
          customer_id?: string
          id?: string
          is_automated?: boolean | null
          message_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "active_deliveries_view"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "whatsapp_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_stats_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "orders_complete_view"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "whatsapp_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "pending_payments_view"
            referencedColumns: ["customer_id"]
          },
        ]
      }
    }
    Views: {
      active_deliveries_view: {
        Row: {
          address: string | null
          assigned_at: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_id: string | null
          driver_name: string | null
          driver_phone: string | null
          location_url: string | null
          minutes_since_assigned: number | null
          order_id: string | null
          order_number: string | null
          payment_amount: number | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          products: Json | null
          status: Database["public"]["Enums"]["delivery_status"] | null
          total: number | null
        }
        Relationships: []
      }
      customer_stats_view: {
        Row: {
          average_order_value: number | null
          completed_orders: number | null
          conversation_mode:
            | Database["public"]["Enums"]["conversation_mode"]
            | null
          created_at: string | null
          id: string | null
          last_order_at: string | null
          last_order_date: string | null
          name: string | null
          phone: string | null
          total_orders: number | null
          total_spent: number | null
        }
        Relationships: []
      }
      daily_sales_summary: {
        Row: {
          average_order_value: number | null
          cancelled_orders: number | null
          completed_orders: number | null
          date: string | null
          total_orders: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      low_stock_products_view: {
        Row: {
          category_name: string | null
          id: string | null
          low_stock_threshold: number | null
          name: string | null
          price: number | null
          stock: number | null
        }
        Relationships: []
      }
      orders_complete_view: {
        Row: {
          completed_at: string | null
          confirmed_at: string | null
          conversation_mode:
            | Database["public"]["Enums"]["conversation_mode"]
            | null
          created_at: string | null
          customer_address: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          delivered_at: string | null
          delivery_address: string | null
          delivery_assigned_at: string | null
          delivery_id: string | null
          delivery_status: Database["public"]["Enums"]["delivery_status"] | null
          driver_name: string | null
          driver_phone: string | null
          id: string | null
          location_url: string | null
          order_notes: string | null
          order_number: string | null
          payment_amount: number | null
          payment_confirmed_at: string | null
          payment_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          screenshot_url: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          total: number | null
          updated_at: string | null
        }
        Relationships: []
      }
      pending_payments_view: {
        Row: {
          amount: number | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          method: Database["public"]["Enums"]["payment_method"] | null
          minutes_waiting: number | null
          order_id: string | null
          order_number: string | null
          order_total: number | null
          payment_id: string | null
          products: Json | null
          screenshot_url: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_page: {
        Args: { _page_key: string; _user_id: string }
        Returns: boolean
      }
      can_perform_action: {
        Args: { _action: string; _page_key: string; _user_id: string }
        Returns: boolean
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      normalize_search: { Args: { text_value: string }; Returns: string }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "employee"
      column_type:
        | "text"
        | "number"
        | "date"
        | "boolean"
        | "select"
        | "multi_select"
        | "status"
        | "email"
        | "phone"
        | "file"
        | "url"
      conversation_mode: "ai" | "manual"
      delivery_status:
        | "sin_asignar"
        | "asignado"
        | "en_camino"
        | "entregado"
        | "fallido"
        | "cancelado"
      notification_priority: "baja" | "media" | "alta" | "critica"
      order_status:
        | "nuevo"
        | "confirmado"
        | "en_entrega"
        | "completado"
        | "cancelado"
      payment_method: "qr" | "efectivo"
      payment_status: "pendiente" | "confirmado" | "rechazado" | "bajo_revision"
      stock_movement_type:
        | "venta"
        | "ingreso"
        | "ajuste"
        | "perdida"
        | "devolucion"
      user_role: "admin" | "operator" | "viewer"
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
      app_role: ["admin", "employee"],
      column_type: [
        "text",
        "number",
        "date",
        "boolean",
        "select",
        "multi_select",
        "status",
        "email",
        "phone",
        "file",
        "url",
      ],
      conversation_mode: ["ai", "manual"],
      delivery_status: [
        "sin_asignar",
        "asignado",
        "en_camino",
        "entregado",
        "fallido",
        "cancelado",
      ],
      notification_priority: ["baja", "media", "alta", "critica"],
      order_status: [
        "nuevo",
        "confirmado",
        "en_entrega",
        "completado",
        "cancelado",
      ],
      payment_method: ["qr", "efectivo"],
      payment_status: ["pendiente", "confirmado", "rechazado", "bajo_revision"],
      stock_movement_type: [
        "venta",
        "ingreso",
        "ajuste",
        "perdida",
        "devolucion",
      ],
      user_role: ["admin", "operator", "viewer"],
    },
  },
} as const
