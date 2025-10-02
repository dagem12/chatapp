import React, { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { 
  ChatState, 
  ConversationPreview, 
  Conversation, 
  Message, 
  User 
} from '../types';
import { chatService } from '../services/chat';
import { socketService } from '../services/socket';
import { useAuth } from './useAuth';

interface ChatContextType extends ChatState {
  loadConversations: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  sendMessage: (content: string) => void;
  searchUsers: (query: string) => Promise<User[]>;
  createConversation: (participantIds: string[]) => Promise<string | null>;
  markMessagesAsRead: (messageIds: string[]) => void;
  clearError: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_CONVERSATIONS'; payload: ConversationPreview[] }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: Conversation }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_CONVERSATION'; payload: ConversationPreview }
  | { type: 'UPDATE_USER_STATUS'; payload: { userId: string; isOnline: boolean } }
  | { type: 'MARK_MESSAGES_READ'; payload: string[] }
  | { type: 'RESET_CHAT' };

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload, isLoading: false };
    
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversation: action.payload, isLoading: false };
    
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload, isLoading: false };
    
    case 'ADD_MESSAGE':
      return { 
        ...state, 
        messages: [...state.messages, action.payload],
        conversations: state.conversations.map(conv => 
          conv.id === action.payload.conversationId 
            ? {
                ...conv,
                lastMessage: {
                  content: action.payload.content,
                  timestamp: action.payload.timestamp,
                  senderId: action.payload.senderId,
                },
                unreadCount: action.payload.senderId !== state.user?.id 
                  ? conv.unreadCount + 1 
                  : conv.unreadCount,
              }
            : conv
        )
      };
    
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.id ? action.payload : conv
        ),
      };
    
    case 'UPDATE_USER_STATUS':
      return {
        ...state,
        conversations: state.conversations.map(conv => ({
          ...conv,
          otherParticipant: conv.otherParticipant.id === action.payload.userId
            ? { ...conv.otherParticipant, isOnline: action.payload.isOnline }
            : conv.otherParticipant,
        })),
        currentConversation: state.currentConversation ? {
          ...state.currentConversation,
          participants: state.currentConversation.participants.map(participant =>
            participant.id === action.payload.userId
              ? { ...participant, isOnline: action.payload.isOnline }
              : participant
          ),
        } : null,
      };
    
    case 'MARK_MESSAGES_READ':
      return {
        ...state,
        messages: state.messages.map(message =>
          action.payload.includes(message.id)
            ? { ...message, isRead: true }
            : message
        ),
      };
    
    case 'RESET_CHAT':
      return {
        user: null,
        conversations: [],
        currentConversation: null,
        messages: [],
        isLoading: false,
        error: null,
      };
    
    default:
      return state;
  }
};

const initialState: ChatState = {
  user: null,
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  error: null,
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  // Memoized functions to prevent infinite re-renders
  const loadConversations = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await chatService.getConversations();
      
      if (response.success && response.data) {
        dispatch({ type: 'SET_CONVERSATIONS', payload: response.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to load conversations' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load conversations' });
    }
  }, []);

  const selectConversation = useCallback(async (conversationId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Leave current conversation room
      if (state.currentConversation) {
        socketService.leaveConversation(state.currentConversation.id);
      }

      // Get conversation details and messages
      const [conversationResponse, messagesResponse] = await Promise.all([
        chatService.getConversation(conversationId),
        chatService.getMessages(conversationId),
      ]);

      if (conversationResponse.success && conversationResponse.data) {
        dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversationResponse.data });
        
        if (messagesResponse.success && messagesResponse.data) {
          dispatch({ type: 'SET_MESSAGES', payload: messagesResponse.data });
        }

        // Join new conversation room
        socketService.joinConversation(conversationId);

        // Mark messages as read
        const unreadMessages = messagesResponse.data?.filter(m => 
          !m.isRead && m.senderId !== user?.id
        ) || [];
        
        if (unreadMessages.length > 0) {
          markMessagesAsRead(unreadMessages.map(m => m.id));
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: conversationResponse.error || 'Failed to load conversation' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load conversation' });
    }
  }, [state.currentConversation, user]);

  const sendMessage = useCallback((content: string): void => {
    if (!state.currentConversation || !user) return;

    const message = {
      content,
      senderId: user.id,
      conversationId: state.currentConversation.id,
    };

    socketService.sendMessage(message);
  }, [state.currentConversation, user]);

  const searchUsers = useCallback(async (query: string): Promise<User[]> => {
    try {
      const response = await chatService.searchUsers(query);
      return response.success && response.data ? response.data : [];
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  }, []);

  const createConversation = useCallback(async (participantIds: string[]): Promise<string | null> => {
    try {
      const response = await chatService.createConversation(participantIds);
      
      if (response.success && response.data) {
        // Reload conversations to include the new one
        await loadConversations();
        return response.data.id;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to create conversation' });
        return null;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create conversation' });
      return null;
    }
  }, [loadConversations]);

  const markMessagesAsRead = useCallback((messageIds: string[]): void => {
    socketService.markAsRead(messageIds);
    dispatch({ type: 'MARK_MESSAGES_READ', payload: messageIds });
  }, []);

  const clearError = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Setup socket listeners and load initial data
  useEffect(() => {
    if (isAuthenticated && user) {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Reset chat state
      dispatch({ type: 'RESET_CHAT' });
      
      // Load conversations
      loadConversations();

      // Set up socket listeners with stable callbacks
      const handleNewMessage = (message: Message) => {
        dispatch({ type: 'ADD_MESSAGE', payload: message });
      };

      const handleMessageRead = (messageIds: string[]) => {
        dispatch({ type: 'MARK_MESSAGES_READ', payload: messageIds });
      };

      const handleUserOnline = (userId: string) => {
        dispatch({ type: 'UPDATE_USER_STATUS', payload: { userId, isOnline: true } });
      };

      const handleUserOffline = (userId: string) => {
        dispatch({ type: 'UPDATE_USER_STATUS', payload: { userId, isOnline: false } });
      };

      const handleConversationUpdated = (conversation: Conversation) => {
        // Convert to ConversationPreview format
        const preview: ConversationPreview = {
          id: conversation.id,
          otherParticipant: conversation.participants.find(p => p.id !== user.id)!,
          lastMessage: conversation.lastMessage ? {
            content: conversation.lastMessage.content,
            timestamp: conversation.lastMessage.timestamp,
            senderId: conversation.lastMessage.senderId,
          } : undefined,
          unreadCount: conversation.unreadCount,
        };
        dispatch({ type: 'UPDATE_CONVERSATION', payload: preview });
      };

      socketService.onNewMessage(handleNewMessage);
      socketService.onMessageRead(handleMessageRead);
      socketService.onUserOnline(handleUserOnline);
      socketService.onUserOffline(handleUserOffline);
      socketService.onConversationUpdated(handleConversationUpdated);

      return () => {
        socketService.removeAllListeners();
      };
    } else {
      dispatch({ type: 'RESET_CHAT' });
    }
  }, [isAuthenticated, user?.id, loadConversations]); // Only depend on user.id, not the entire user object

  const value: ChatContextType = {
    ...state,
    user,
    loadConversations,
    selectConversation,
    sendMessage,
    searchUsers,
    createConversation,
    markMessagesAsRead,
    clearError,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};