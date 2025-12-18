import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { chatHelpers, realtimeHelpers, supabase } from "../lib/supabase";
import {
  Chat,
  MessageWithSender,
  ChatWithDetails,
  AISummary,
} from "../types/database";
import { useAuth } from "./AuthContext";

interface ChatContextType {
  // State
  chats: ChatWithDetails[];
  currentChat: ChatWithDetails | null;
  messages: MessageWithSender[];
  aiSummaries: AISummary[];
  loading: boolean;
  sendingMessage: boolean;

  // Actions
  selectChat: (chatId: string | null) => void;
  createChat: (participants: string[], name?: string) => Promise<Chat>;
  sendMessage: (chatId: string, content: string) => Promise<void>;
  loadMoreMessages: (chatId: string, offset: number) => Promise<void>;
  refreshChats: () => Promise<void>;
  addParticipant: (chatId: string, userId: string) => Promise<void>;
  removeParticipant: (chatId: string, userId?: string) => Promise<void>;
  triggerAISummarization: (chatId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatWithDetails[]>([]);
  const [currentChat, setCurrentChat] = useState<ChatWithDetails | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [aiSummaries, setAiSummaries] = useState<AISummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Realtime subscriptions
  const messageSubscriptionRef = useRef<RealtimeChannel | null>(null);
  const aiSummarySubscriptionRef = useRef<RealtimeChannel | null>(null);
  const userChatsSubscriptionRef = useRef<RealtimeChannel | null>(null);

  // Load user's chats
  const loadChats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userChats = await chatHelpers.getUserChats();
      setChats(userChats as ChatWithDetails[]);
    } catch (error) {
      console.error(
        "Error loading chats:",
        (error as any).code,
        (error as any).message
      );
    } finally {
      setLoading(false);
    }
  };

  // Load messages for a specific chat
  const loadMessages = async (chatId: string, offset = 0) => {
    if (!user) return;

    try {
      const chatMessages = await chatHelpers.getChatMessages(
        chatId,
        50,
        offset
      );
      if (offset === 0) {
        setMessages(chatMessages);
      } else {
        setMessages((prev) => [...chatMessages, ...prev]);
      }
    } catch (error) {
      console.error(
        "Error loading messages:",
        (error as any).code,
        (error as any).message
      );
    }
  };

  // Load AI summaries for a chat
  const loadAISummaries = async (chatId: string) => {
    if (!user) return;

    try {
      const summaries = await chatHelpers.getChatAISummaries(chatId);
      setAiSummaries(summaries);
    } catch (error) {
      console.error(
        "Error loading AI summaries:",
        (error as any).code,
        (error as any).message
      );
    }
  };

  // Select a chat
  const selectChat = async (chatId: string | null) => {
    if (!chatId) {
      setCurrentChat(null);
      setMessages([]);
      setAiSummaries([]);
      // Unsubscribe from previous subscriptions
      if (messageSubscriptionRef.current) {
        realtimeHelpers.unsubscribe(messageSubscriptionRef.current);
        messageSubscriptionRef.current = null;
      }
      if (aiSummarySubscriptionRef.current) {
        realtimeHelpers.unsubscribe(aiSummarySubscriptionRef.current);
        aiSummarySubscriptionRef.current = null;
      }
      return;
    }

    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;

    setCurrentChat(chat);
    await loadMessages(chatId);
    await loadAISummaries(chatId);

    // Subscribe to new messages
    if (messageSubscriptionRef.current) {
      realtimeHelpers.unsubscribe(messageSubscriptionRef.current);
    }
    messageSubscriptionRef.current = realtimeHelpers.subscribeToChatMessages(
      chatId,
      (newMessage: MessageWithSender) => {
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some((m) => m.id === newMessage.id);
          if (exists) return prev;

          return [...prev, newMessage];
        });
      }
    );

    // Subscribe to AI summaries
    if (aiSummarySubscriptionRef.current) {
      realtimeHelpers.unsubscribe(aiSummarySubscriptionRef.current);
    }
    aiSummarySubscriptionRef.current = realtimeHelpers.subscribeToAISummaries(
      chatId,
      (newSummary: AISummary) => {
        setAiSummaries((prev) => [newSummary, ...prev]);
      }
    );
  };

  // Create a new chat
  const createChat = async (
    participants: string[],
    name?: string
  ): Promise<Chat> => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    try {
      const newChat = await chatHelpers.createChat(participants, name);
      await loadChats(); // Refresh chats list
      return newChat;
    } catch (error) {
      console.error(
        "Error creating chat:",
        (error as any).code,
        (error as any).message
      );
      throw error;
    }
  };

  // Send a message
  const sendMessage = async (chatId: string, content: string) => {
    if (!user) throw new Error("User not authenticated");

    setSendingMessage(true);
    try {
      await chatHelpers.sendMessage(chatId, content);
      // Message will be added via realtime subscription
    } catch (error) {
      console.error(
        "Error sending message:",
        (error as any).code,
        (error as any).message
      );
      throw error;
    } finally {
      setSendingMessage(false);
    }
  };

  // Load more messages (pagination)
  const loadMoreMessages = async (chatId: string, offset: number) => {
    await loadMessages(chatId, offset);
  };

  // Refresh chats list
  const refreshChats = async () => {
    await loadChats();
  };

  // Add participant to chat
  const addParticipant = async (chatId: string, userId: string) => {
    try {
      await chatHelpers.addParticipant(chatId, userId);
      await loadChats(); // Refresh to show updated participants
    } catch (error) {
      console.error(
        "Error adding participant:",
        (error as any).code,
        (error as any).message
      );
      throw error;
    }
  };

  // Remove participant from chat
  const removeParticipant = async (chatId: string, userId?: string) => {
    try {
      await chatHelpers.removeParticipant(chatId, userId);
      await loadChats(); // Refresh to show updated participants
    } catch (error) {
      console.error(
        "Error removing participant:",
        (error as any).code,
        (error as any).message
      );
      throw error;
    }
  };

  // Trigger AI summarization for a chat
  const triggerAISummarization = async (chatId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "summarize-chat",
        {
          body: { chatId },
        }
      );

      if (error) throw error;

      // AI summaries will be updated via realtime subscription
      console.log("AI summarization completed:", data);
    } catch (error) {
      console.error(
        "Error triggering AI summarization:",
        (error as any).code,
        (error as any).message
      );
      throw error;
    }
  };

  // Initialize realtime subscriptions for user's chats
  useEffect(() => {
    if (!user) {
      // Clean up subscriptions when user logs out
      if (userChatsSubscriptionRef.current) {
        realtimeHelpers.unsubscribe(userChatsSubscriptionRef.current);
        userChatsSubscriptionRef.current = null;
      }
      if (messageSubscriptionRef.current) {
        realtimeHelpers.unsubscribe(messageSubscriptionRef.current);
        messageSubscriptionRef.current = null;
      }
      if (aiSummarySubscriptionRef.current) {
        realtimeHelpers.unsubscribe(aiSummarySubscriptionRef.current);
        aiSummarySubscriptionRef.current = null;
      }
      setChats([]);
      setCurrentChat(null);
      setMessages([]);
      setAiSummaries([]);
      return;
    }

    // Load initial chats
    loadChats();

    // Subscribe to user's chats updates
    userChatsSubscriptionRef.current = realtimeHelpers.subscribeToUserChats(
      () => {
        // Refresh chats when there are changes
        loadChats();
      }
    );

    return () => {
      // Cleanup subscriptions
      if (userChatsSubscriptionRef.current) {
        realtimeHelpers.unsubscribe(userChatsSubscriptionRef.current);
      }
      if (messageSubscriptionRef.current) {
        realtimeHelpers.unsubscribe(messageSubscriptionRef.current);
      }
      if (aiSummarySubscriptionRef.current) {
        realtimeHelpers.unsubscribe(aiSummarySubscriptionRef.current);
      }
    };
  }, [user]);

  const value: ChatContextType = {
    chats,
    currentChat,
    messages,
    aiSummaries,
    loading,
    sendingMessage,
    selectChat,
    createChat,
    sendMessage,
    loadMoreMessages,
    refreshChats,
    addParticipant,
    removeParticipant,
    triggerAISummarization,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
