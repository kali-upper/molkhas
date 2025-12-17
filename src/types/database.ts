export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      summaries: {
        Row: {
          id: string
          title: string
          subject: string
          year: string
          department: string
          content: string
          pdf_url: string | null
          contributor_name: string | null
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          subject: string
          year: string
          department: string
          content: string
          pdf_url?: string | null
          contributor_name?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          subject?: string
          year?: string
          department?: string
          content?: string
          pdf_url?: string | null
          contributor_name?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      news: {
        Row: {
          id: string
          title: string
          content: string
          type: 'announcement' | 'update' | 'important'
          is_active: boolean
          priority: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          type?: 'announcement' | 'update' | 'important'
          is_active?: boolean
          priority?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          type?: 'announcement' | 'update' | 'important'
          is_active?: boolean
          priority?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      appeals: {
        Row: {
          id: string
          content_id: string
          content_type: 'summary' | 'news'
          reason: string
          description: string | null
          status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content_id: string
          content_type: 'summary' | 'news'
          reason: string
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content_id?: string
          content_type?: 'summary' | 'news'
          reason?: string
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
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

export type Summary = Database['public']['Tables']['summaries']['Row'];
export type SummaryInsert = Database['public']['Tables']['summaries']['Insert'];
export type SummaryUpdate = Database['public']['Tables']['summaries']['Update'];

export type News = Database['public']['Tables']['news']['Row'];
export type NewsInsert = Database['public']['Tables']['news']['Insert'];
export type NewsUpdate = Database['public']['Tables']['news']['Update'];

export type Appeal = Database['public']['Tables']['appeals']['Row'];
export type AppealInsert = Database['public']['Tables']['appeals']['Insert'];
export type AppealUpdate = Database['public']['Tables']['appeals']['Update'];
