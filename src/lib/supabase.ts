import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { MessageWithSender, AISummary, ChatWithDetails } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Environment variables loaded successfully
console.log('🔧 Supabase initialized successfully');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Temporary workaround: Use any type to avoid TypeScript errors until database is set up
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  db: {
    schema: 'public',
  },
}) as any;

// #region agent log
fetch('http://127.0.0.1:7242/ingest/52e8e74b-b736-498f-b9e1-72a9590567d1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabase.ts:19',message:'Supabase client created',data:{clientType:typeof supabase,hasFrom:!!supabase.from},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A,B,C,D'})}).catch(()=>{});
// #endregion

// Chat-related helper functions
export const chatHelpers = {
  // Create a new chat (individual or group)
  async createChat(participants: string[], name?: string) {
    const currentUser = await supabase.auth.getUser();
    if (!currentUser.data.user) throw new Error('User not authenticated');

    // For individual chats, find existing chat between these users
    if (!name && participants.length === 2) {
      const existingChat = await this.findIndividualChat(participants[0], participants[1]);
      if (existingChat) {
        return existingChat;
      }
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/52e8e74b-b736-498f-b9e1-72a9590567d1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'supabase.ts:37',message:'About to insert chat',data:{name,hasName:!!name,createdBy:currentUser.data.user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A,E'})}).catch(()=>{});
    // #endregion

    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .insert({
        name,
        type: name ? 'group' : 'individual',
        created_by: currentUser.data.user.id,
      })
      .select()
      .single();

    if (chatError) throw chatError;

    // Add participants to the chat
    const participantInserts = [...participants, currentUser.data.user.id].map(userId => ({
      chat_id: chat.id,
      user_id: userId,
    }));

    const { error: participantsError } = await supabase
      .from('chat_participants')
      .insert(participantInserts);

    if (participantsError) throw participantsError;

    return chat;
  },

  // Find existing individual chat between two users
  async findIndividualChat(userId1: string, userId2: string) {
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
};
