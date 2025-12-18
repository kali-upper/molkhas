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
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'admin_submission' | 'content_published' | 'system'
          related_id: string | null
          related_type: 'summary' | 'news' | 'appeal' | null
          read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'admin_submission' | 'content_published' | 'system'
          related_id?: string | null
          related_type?: 'summary' | 'news' | 'appeal' | null
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'admin_submission' | 'content_published' | 'system'
          related_id?: string | null
          related_type?: 'summary' | 'news' | 'appeal' | null
          read?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      chats: {
        Row: {
          id: string
          name: string | null
          type: 'individual' | 'group'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          type: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          type?: 'individual' | 'group'
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          sender_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          sender_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          sender_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      chat_participants: {
        Row: {
          chat_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          chat_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          chat_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      ai_summaries: {
        Row: {
          id: string
          chat_id: string
          summary_content: string | null
          important_messages: Json | null
          last_message_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          summary_content?: string | null
          important_messages?: Json | null
          last_message_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          summary_content?: string | null
          important_messages?: Json | null
          last_message_id?: string | null
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

export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];

export type Chat = Database['public']['Tables']['chats']['Row'];
export type ChatInsert = Database['public']['Tables']['chats']['Insert'];
export type ChatUpdate = Database['public']['Tables']['chats']['Update'];

export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type MessageUpdate = Database['public']['Tables']['messages']['Update'];

export type ChatParticipant = Database['public']['Tables']['chat_participants']['Row'];
export type ChatParticipantInsert = Database['public']['Tables']['chat_participants']['Insert'];
export type ChatParticipantUpdate = Database['public']['Tables']['chat_participants']['Update'];

export type AISummary = Database['public']['Tables']['ai_summaries']['Row'];
export type AISummaryInsert = Database['public']['Tables']['ai_summaries']['Insert'];
export type AISummaryUpdate = Database['public']['Tables']['ai_summaries']['Update'];

// Additional types for chat functionality
export interface MessageWithSender extends Message {
  sender: {
    id: string;
    email: string;
    raw_user_meta_data: {
      display_name?: string;
      name?: string;
      avatar_url?: string;
    };
  };
}

export interface ChatWithDetails extends Chat {
  chat_participants: ChatParticipant[];
  messages: MessageWithSender[];
  ai_summaries: AISummary[];
  lastMessage?: MessageWithSender;
}

export interface ImportantMessage {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  created_at: string;
  context: string; // Surrounding conversation context
}
