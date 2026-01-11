import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { MessageWithSender, AISummary, ChatWithDetails } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Environment variables loaded successfully
// Supabase initialized successfully

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Temporary workaround: Use any type to avoid TypeScript errors until database is set up
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  db: {
    schema: 'public',
  },
}) as any;

// Logging removed - was causing connection errors

// Define interfaces for chat helpers
interface AnalyticsData {
  userId: string;
  actionType: 'summary_view' | 'summary_click' | 'ai_interaction' | 'content_view' | 'link_click' | 'user_login' | 'user_logout';
  contentType: string;
  contentId?: string;
  metadata?: Record<string, any>;
}

interface AssistantMessageData {
  userId: string;
  sessionId: string;
  userMessage: string;
  assistantResponse: string;
  responseTimeMs?: number;
  aiModelUsed?: string;
  metadata?: Record<string, any>;
}

interface ChatHelpers {
  createChat(participants: string[], name?: string): Promise<any>;
  findIndividualChat(userId1: string, userId2: string): Promise<any>;
  sendMessage(chatId: string, content: string): Promise<any>;
  getChatMessages(chatId: string, limit?: number, offset?: number): Promise<any>;
  getUserChats(): Promise<any>;
  getChatParticipants(chatId: string): Promise<any>;
  addParticipant(chatId: string, userId: string): Promise<any>;
  removeParticipant(chatId: string, userId?: string): Promise<any>;
  deleteChat(chatId: string): Promise<any>;
  markMessagesAsRead(chatId: string): Promise<any>;
  getChatAISummaries(chatId: string): Promise<any>;
  searchUsers(searchTerm: string, searchType: "email" | "username" | "id"): Promise<any[]>;
  resolveParticipantToUserId(identifier: string, type: "email" | "username" | "id"): Promise<string | null>;
  recordAnalytics(data: AnalyticsData): Promise<void>;
  saveAssistantMessage(data: AssistantMessageData): Promise<void>;
  getAdminAnalyticsSummary(): Promise<any>;
  getAssistantMessages(userId?: string, limit?: number): Promise<any>;
  generateResetToken(): string;
  createPasswordResetToken(email: string): Promise<{ success: boolean; error?: string; token?: string }>;
  verifyPasswordResetToken(token: string): Promise<{ valid: boolean; userId?: string; email?: string; error?: string }>;
  markTokenAsUsed(token: string): Promise<boolean>;
}

// Chat-related helper functions
export const chatHelpers: ChatHelpers = {
  // Create a new chat (individual or group)
  async createChat(participants: string[], name?: string) {
    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user) throw new Error('User not authenticated');

    // Filter out invalid participants (test users that don't exist in auth)
    const validParticipants = participants.filter(participantId => {
      // For now, consider any UUID-like string as potentially valid
      // In production, you might want to validate against actual users
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(participantId);
    });

    // For individual chats, find existing chat between these users (only if we have valid participants)
    if (!name && validParticipants.length === 2) {
      try {
        const existingChat = await this.findIndividualChat(validParticipants[0], validParticipants[1]);
        if (existingChat) {
          return existingChat;
        }
      } catch (error) {
        // If finding existing chat fails, continue with creating new chat
        console.warn('Could not find existing individual chat, creating new one:', error);
      }
    }

    // Determine chat type
    const isGroupChat = name || validParticipants.length > 1;

    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .insert({
        name,
        type: isGroupChat ? 'group' : 'individual',
        created_by: currentUser.data.user.id,
      })
      .select()
      .single();

    if (chatError) throw chatError;

    // Add participants to the chat (only valid ones plus current user)
    const participantInserts = [...validParticipants, currentUser.data.user.id].map(userId => ({
      chat_id: chat.id,
      user_id: userId,
    }));

    // Only try to insert participants if we have any
    if (participantInserts.length > 0) {
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participantInserts);

      if (participantsError) {
        // If participant insertion fails, log warning but don't fail the chat creation
        console.warn('Could not add all participants to chat:', participantsError);
      }
    }

    return chat;
  },

  // Find existing individual chat between two users
  async findIndividualChat(userId1: string, userId2: string) {
    // Validate that both user IDs are valid UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(userId1) || !uuidRegex.test(userId2)) {
      // If either user ID is not a valid UUID, return null (no existing chat)
      return null;
    }

    const { data, error } = await supabase
      .from('chats')
      .select(`
        *,
        chat_participants!inner(user_id)
      `)
      .eq('type', 'individual')
      .eq('chat_participants.user_id', userId1)
      .eq('chat_participants.user_id', userId2);

    if (error) throw error;
    return data?.[0] || null;
  },

  // Send a message to a chat
  async sendMessage(chatId: string, content: string) {
    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: currentUser.data.user.id,
        content,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get chat messages with pagination
  async getChatMessages(chatId: string, limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:auth.users!messages_sender_id_fkey(id, email, raw_user_meta_data)
      `)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data.reverse(); // Reverse to show oldest first
  },

  // Get user's chats
  async getUserChats() {
    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chats')
      .select(`
        *,
        chat_participants!inner(user_id),
        messages!inner(id, created_at),
        ai_summaries(id, created_at, summary_content)
      `)
      .eq('chat_participants.user_id', currentUser.data.user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get chat participants
  async getChatParticipants(chatId: string) {
    const { data, error } = await supabase
      .from('chat_participants')
      .select(`
        user_id,
        joined_at,
        user:auth.users!chat_participants_user_id_fkey(id, email, raw_user_meta_data)
      `)
      .eq('chat_id', chatId);

    if (error) throw error;
    return data;
  },

  // Add participant to group chat
  async addParticipant(chatId: string, userId: string) {
    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chat_participants')
      .insert({
        chat_id: chatId,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remove participant from chat (or leave chat)
  async removeParticipant(chatId: string, userId?: string) {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('chat_participants')
      .delete()
      .eq('chat_id', chatId)
      .eq('user_id', targetUserId);

    if (error) throw error;
  },

  // Delete a chat
  async deleteChat(chatId: string) {
    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user) throw new Error('User not authenticated');

    // First check if user is participant in the chat
    const { data: participant } = await supabase
      .from('chat_participants')
      .select('*')
      .eq('chat_id', chatId)
      .eq('user_id', currentUser.data.user.id)
      .single();

    if (!participant) throw new Error('User is not a participant in this chat');

    // Delete all messages first (due to foreign key constraint)
    await supabase
      .from('messages')
      .delete()
      .eq('chat_id', chatId);

    // Delete all participants
    await supabase
      .from('chat_participants')
      .delete()
      .eq('chat_id', chatId);

    // Delete the chat
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId);

    if (error) throw error;
  },

  // Mark messages as read in a chat
  async markMessagesAsRead(chatId: string) {
    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('chat_id', chatId)
      .neq('sender_id', currentUser.data.user.id);

    if (error) throw error;
  },

  // Get AI summaries for a chat
  async getChatAISummaries(chatId: string) {
    const { data, error } = await supabase
      .from('ai_summaries')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Record user analytics interactions
  async recordAnalytics(data: {
    userId: string;
    actionType: 'summary_view' | 'summary_click' | 'ai_interaction' | 'content_view' | 'link_click';
    contentType: string;
    contentId?: string;
    metadata?: Record<string, any>;
  }) {
    const { userId, actionType, contentType, contentId, metadata } = data;
    const { error } = await supabase.from('analytics').insert({
      user_id: userId,
      action_type: actionType,
      content_type: contentType,
      content_id: contentId,
      metadata: metadata || {},
    });

    if (error) {
      console.error('Error recording analytics:', error);
    }
  },

  // Save assistant conversation message
  async saveAssistantMessage(data: {
    userId: string;
    sessionId: string;
    userMessage: string;
    assistantResponse: string;
    responseTimeMs?: number;
    aiModelUsed?: string;
    metadata?: Record<string, any>;
  }) {
    const { userId, sessionId, userMessage, assistantResponse, responseTimeMs, aiModelUsed, metadata } = data;
    const { error } = await supabase.from('assistant_messages').insert({
      user_id: userId,
      session_id: sessionId,
      user_message: userMessage,
      assistant_response: assistantResponse,
      response_time_ms: responseTimeMs,
      ai_model_used: aiModelUsed || 'unknown',
      metadata: metadata || {},
    });

    if (error) {
      console.error('Error saving assistant message:', error);
    }
  },

  // Get admin analytics summary (admin only)
  async getAdminAnalyticsSummary() {
    const { data, error } = await supabase
      .rpc('get_admin_analytics_summary');

    if (error) {
      console.error('Error getting admin analytics:', error);
      return null;
    }

    return data;
  },

  // Get assistant messages for a user (admin only or user's own messages)
  async getAssistantMessages(userId?: string, limit = 50) {
    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user) throw new Error('User not authenticated');

    let query = supabase
      .from('assistant_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // If userId is provided and user is admin, get messages for that user
    // Otherwise, get current user's messages
    if (userId && currentUser.data.user.id !== userId) {
      // Check if current user is admin
      const { data: userData } = await supabase.auth.getUser();
      const isAdmin = userData.user?.raw_user_meta_data?.role === 'admin';

      if (isAdmin) {
        query = query.eq('user_id', userId);
      } else {
        query = query.eq('user_id', currentUser.data.user.id);
      }
    } else {
      query = query.eq('user_id', currentUser.data.user.id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Search for users by email, username, or ID
  async searchUsers(searchTerm: string, searchType: "email" | "username" | "id"): Promise<any[]> {
    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user) throw new Error('User not authenticated');

    let query = supabase.from('profiles').select('id, username, email');

    switch (searchType) {
      case "email":
        query = query.ilike('email', `%${searchTerm}%`);
        break;
      case "username":
        query = query.ilike('username', `%${searchTerm}%`);
        break;
      case "id":
        query = query.eq('id', searchTerm);
        break;
    }

    // Exclude current user from results
    query = query.neq('id', currentUser.data.user.id);

    const { data, error } = await query.limit(10);
    if (error) throw error;
    return data || [];
  },

  // Convert participant identifier to user ID
  async resolveParticipantToUserId(identifier: string, type: "email" | "username" | "id"): Promise<string | null> {
    const users = await this.searchUsers(identifier, type);

    // For exact matches
    if (type === "email") {
      const exactMatch = users.find(user => user.email?.toLowerCase() === identifier.toLowerCase());
      return exactMatch?.id || null;
    } else if (type === "username") {
      const exactMatch = users.find(user => user.username?.toLowerCase() === identifier.toLowerCase());
      return exactMatch?.id || null;
    } else if (type === "id") {
      const exactMatch = users.find(user => user.id === identifier);
      return exactMatch?.id || null;
    }

    return null;
  },

  // Generate secure password reset token
  generateResetToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  // Create password reset token for user
  async createPasswordResetToken(email: string): Promise<{ success: boolean; error?: string; token?: string }> {
    try {
      // Find user by email from profiles table
      const { data: userFromProfiles, error: userFromProfilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .single();

      let user: { id: string; email: string | undefined; } | null = userFromProfiles;
      let userError: any = userFromProfilesError;

      if (userError || !user) {
        // If not found in profiles, try auth.users table as fallback
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(email);
        if (authError || !authUser.user) {
          return { success: false, error: 'البريد الإلكتروني غير مسجل في النظام' };
        }

        // Check if user exists in profiles, if not create a basic profile
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', authUser.user.id)
          .single();

        if (!existingProfile) {
          // Create basic profile
          await supabase.from('profiles').insert({
            id: authUser.user.id,
            email: authUser.user.email,
            username: authUser.user.email?.split('@')[0] || 'user'
          });
        }

        // Use auth user data for consistency
        user = { id: authUser.user.id, email: authUser.user.email };
      }

      if (!user?.id) {
        return { success: false, error: 'لم يتم العثور على معرّف المستخدم' };
      }

      // Generate token and expiry (24 hours from now)
      const token = this.generateResetToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Clean up any existing tokens for this user
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('user_id', user.id);

      // Insert new token
      const { error: insertError } = await supabase
        .from('password_reset_tokens')
        .insert({
          user_id: user.id,
          email: email.toLowerCase(),
          token,
          expires_at: expiresAt.toISOString()
        });

      if (insertError) {
        console.error('Error creating reset token:', insertError);
        return { success: false, error: 'فشل في إنشاء رمز إعادة التعيين' };
      }

      return { success: true, token };
    } catch (error: any) {
      console.error('Error in createPasswordResetToken:', error);
      return { success: false, error: error.message || 'حدث خطأ غير متوقع' };
    }
  },

  // Verify password reset token
  async verifyPasswordResetToken(token: string): Promise<{ valid: boolean; userId?: string; email?: string; error?: string }> {
    try {
      // Clean token - remove any trailing :number (React dev artifact)
      const cleanToken = token.replace(/:\d+$/, '');


      // Now try the specific token
      const response = await fetch(
        `${supabaseUrl}/rest/v1/password_reset_tokens?token=eq.${encodeURIComponent(cleanToken)}&select=token,email,expires_at,used_at`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );


      if (!response.ok) {
        console.log('❌ Token query failed');
        const errorText = await response.text();
        console.log('❌ Token query error:', errorText);
        return { valid: false, error: 'رمز إعادة التعيين غير صالح' };
      }

      const data = await response.json();
      console.log('📊 Token query response data:', data);

      if (!data || data.length === 0) {
        return { valid: false, error: 'رمز إعادة التعيين غير صالح' };
      }

      const tokenData = data[0];

      // Check if token is used or expired
      if (tokenData.used_at) {
        return { valid: false, error: 'تم استخدام رمز إعادة التعيين مسبقاً' };
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        return { valid: false, error: 'انتهت صلاحية رمز إعادة التعيين' };
      }

      return { valid: true, userId: undefined, email: tokenData.email };
    } catch (error) {
      console.error('Error verifying reset token:', error);
      return { valid: false, error: 'حدث خطأ في التحقق من الرمز' };
    }
  },

  // Mark token as used
  async markTokenAsUsed(token: string): Promise<boolean> {
    try {
      // Clean token - remove any trailing :number (React dev artifact)
      const cleanToken = token.replace(/:\d+$/, '');

      const { error } = await supabase
        .from('password_reset_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('token', cleanToken);

      return !error;
    } catch (error) {
      console.error('Error marking token as used:', error);
      return false;
    }
  },
};

// Realtime functionality
export const realtimeHelpers = {
  // Subscribe to messages in a specific chat
  subscribeToChatMessages(chatId: string, callback: (message: MessageWithSender) => void): RealtimeChannel {
    const channel = supabase
      .channel(`chat_messages_${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload: any) => {
          // Fetch the complete message with sender info
          const { data: message, error } = await supabase
            .from('messages')
            .select(`
              *,
              sender:auth.users!messages_sender_id_fkey(id, email, raw_user_meta_data)
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && message) {
            callback(message);
          }
        }
      )
      .subscribe();

    return channel;
  },

  // Subscribe to AI summaries for a chat
  subscribeToAISummaries(chatId: string, callback: (summary: AISummary) => void): RealtimeChannel {
    const channel = supabase
      .channel(`ai_summaries_${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_summaries',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload: any) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return channel;
  },

  // Subscribe to user's chats updates
  subscribeToUserChats(callback: (chat: ChatWithDetails) => void): RealtimeChannel {
    const channel = supabase
      .channel('user_chats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
        },
        (payload: any) => {
          callback(payload.new || payload.old);
        }
      )
      .subscribe();

    return channel;
  },

  // Unsubscribe from a channel
  unsubscribe(channel: RealtimeChannel) {
    supabase.removeChannel(channel);
  },

  // Analytics and assistant message helpers

  // Record user analytics interactions
  async recordAnalytics(data: {
    userId: string;
    actionType: 'summary_view' | 'summary_click' | 'ai_interaction' | 'content_view';
    contentType: string; // e.g., 'summary', 'exam_info', 'course_info', 'ai_response'
    contentId?: string;
    metadata?: Record<string, any>;
  }) {
    const { userId, actionType, contentType, contentId, metadata } = data;
    const { error } = await supabase.from('analytics').insert({
      user_id: userId,
      action_type: actionType,
      content_type: contentType,
      content_id: contentId,
      metadata: metadata || {},
    });

    if (error) {
      console.error('Error recording analytics:', error);
    }
  },

  // Save assistant conversation message
  async saveAssistantMessage(data: {
    userId: string;
    sessionId: string;
    userMessage: string;
    assistantResponse: string;
    responseTimeMs?: number;
    aiModelUsed?: string; // 'gemini', 'fallback', 'error'
    metadata?: Record<string, any>;
  }) {
    const { userId, sessionId, userMessage, assistantResponse, responseTimeMs, aiModelUsed, metadata } = data;
    const { error } = await supabase.from('assistant_messages').insert({
      user_id: userId,
      session_id: sessionId,
      user_message: userMessage,
      assistant_response: assistantResponse,
      response_time_ms: responseTimeMs,
      ai_model_used: aiModelUsed || 'unknown',
      metadata: metadata || {},
    });

    if (error) {
      console.error('Error saving assistant message:', error);
    }
  },


  // Get admin analytics summary (admin only)
  async getAdminAnalyticsSummary() {
    const { data, error } = await supabase
      .rpc('get_admin_analytics_summary');

    if (error) {
      console.error('Error getting admin analytics:', error);
      return null;
    }

    return data;
  },

  // Get assistant messages for a user (admin only or user's own messages)
  async getAssistantMessages(userId?: string, limit = 50) {
    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user) throw new Error('User not authenticated');

    let query = supabase
      .from('assistant_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // If userId is provided and user is admin, get messages for that user
    // Otherwise, get current user's messages
    if (userId && currentUser.data.user.id !== userId) {
      // Check if current user is admin
      const { data: userData } = await supabase.auth.getUser();
      const isAdmin = userData.user?.raw_user_meta_data?.role === 'admin';

      if (isAdmin) {
        query = query.eq('user_id', userId);
      } else {
        query = query.eq('user_id', currentUser.data.user.id);
      }
    } else {
      query = query.eq('user_id', currentUser.data.user.id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

};
