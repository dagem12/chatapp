import React, { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { 
  ChatState, 
  ConversationPreview, 
  Conversation, 
  Message, 
  User,
  MessageStatus
} from '../types';
import { chatService } from '../services/chat';
import { socketService } from '../services/socket';
import { useAuth } from './useAuth';

interface ChatContextType extends ChatState {
  loadConversations: () => Promise<void>;
  loadMoreConversations: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  sendMessage: (content: string) => void;
  searchUsers: (query: string) => Promise<User[]>;
  createConversation: (participantIds: string[]) => Promise<string | null>;
  markMessagesAsRead: (messageIds: string[]) => void;
  markRecentMessagesAsRead: () => void;
  clearError: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADING_MORE'; payload: boolean }
  | { type: 'SET_LOADING_MORE_MESSAGES'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_CONVERSATIONS'; payload: { conversations: ConversationPreview[]; pagination: any } }
  | { type: 'APPEND_CONVERSATIONS'; payload: { conversations: ConversationPreview[]; pagination: any } }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: Conversation }
  | { type: 'SET_MESSAGES'; payload: { messages: Message[]; pagination: any } }
  | { type: 'PREPEND_MESSAGES'; payload: { messages: Message[]; pagination: any } }
  | { type: 'ADD_MESSAGE'; payload: Message & { currentUserId?: string } }
  | { type: 'ADD_TEMP_MESSAGE'; payload: Message }
  | { type: 'REPLACE_TEMP_MESSAGE'; payload: { tempId: string; realMessage: Message } }
  | { type: 'UPDATE_MESSAGE_STATUS'; payload: { messageId: string; status: string } }
  | { type: 'UPDATE_MESSAGES_READ'; payload: { messageIds: string[]; readBy: string } }
  | { type: 'UPDATE_CONVERSATION'; payload: ConversationPreview }
  | { type: 'UPDATE_USER_STATUS'; payload: { userId: string; isOnline: boolean } }
  | { type: 'MARK_MESSAGES_READ'; payload: string[] }
  | { type: 'RESET_CHAT' };

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_LOADING_MORE':
      return { ...state, isLoadingMore: action.payload };
    
    case 'SET_LOADING_MORE_MESSAGES':
      return { ...state, isLoadingMoreMessages: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false, isLoadingMore: false, isLoadingMoreMessages: false };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'SET_CONVERSATIONS':
      return { 
        ...state, 
        conversations: action.payload.conversations, 
        conversationsPagination: action.payload.pagination,
        isLoading: false 
      };
    
    case 'APPEND_CONVERSATIONS':
      return { 
        ...state, 
        conversations: [...action.payload.conversations, ...state.conversations], // Prepend older conversations
        conversationsPagination: action.payload.pagination,
        isLoadingMore: false 
      };
    
    case 'SET_CURRENT_CONVERSATION':
      return { ...state, currentConversation: action.payload, isLoading: false };
    
    case 'SET_MESSAGES':
      return { 
        ...state, 
        messages: action.payload.messages.sort((a, b) => 
          new Date(a.timestamp || a.createdAt || 0).getTime() - 
          new Date(b.timestamp || b.createdAt || 0).getTime()
        ), 
        messagesPagination: action.payload.pagination,
        isLoading: false 
      };
    
    case 'PREPEND_MESSAGES':
      const allMessages = [...action.payload.messages, ...state.messages];
      return { 
        ...state, 
        messages: allMessages.sort((a, b) => 
          new Date(a.timestamp || a.createdAt || 0).getTime() - 
          new Date(b.timestamp || b.createdAt || 0).getTime()
        ),
        messagesPagination: action.payload.pagination,
        isLoadingMoreMessages: false 
      };
    
    case 'ADD_MESSAGE':
      const isCurrentConversation = state.currentConversation?.id === action.payload.conversationId;
      
      // Check if this message already exists (to prevent duplicates)
      const messageExists = state.messages.some(msg => {
        // Check by exact ID match first
        if (msg.id === action.payload.id) {
          return true;
        }
        
        // Check by content, sender, and timestamp (within 5 seconds)
        const isSameContent = msg.content === action.payload.content;
        const isSameSender = msg.senderId === action.payload.senderId;
        const timeDiff = Math.abs(
          new Date(msg.timestamp || msg.createdAt || 0).getTime() - 
          new Date(action.payload.timestamp || action.payload.createdAt || 0).getTime()
        );
        const isSameTime = timeDiff < 5000; // 5 seconds tolerance
        
        if (isSameContent && isSameSender && isSameTime) {
          return true;
        }
        
        return false;
      });
      
      if (messageExists) {
        return state; // Don't add duplicate messages
      }
      
      // Only add to messages array if it's the current conversation
      let updatedMessages = state.messages;
      if (isCurrentConversation) {
        // Insert the new message in the correct chronological position
        updatedMessages = [...state.messages, action.payload].sort((a, b) => 
          new Date(a.timestamp || a.createdAt || 0).getTime() - 
          new Date(b.timestamp || b.createdAt || 0).getTime()
        );
      }
      
      // Update conversations and reorder them by latest activity
      const updatedConversations = state.conversations.map(conv => {
        if (conv.id === action.payload.conversationId) {
          const isFromOtherUser = action.payload.senderId !== action.payload.currentUserId;
          const isCurrentConversation = state.currentConversation?.id === action.payload.conversationId;
          
          // Only increment unread count if:
          // 1. Message is from another user AND
          // 2. User is not currently viewing this conversation AND
          // 3. The message is not already the last message (prevent double counting)
          const isAlreadyLastMessage = conv.lastMessage?.content === action.payload.content && 
            conv.lastMessage?.senderId === action.payload.senderId;
          const shouldIncrementUnread = isFromOtherUser && !isCurrentConversation && !isAlreadyLastMessage;
          const newUnreadCount = shouldIncrementUnread ? Math.max(conv.unreadCount + 1, 0) : conv.unreadCount;
          
          return {
            ...conv,
            lastMessage: {
              content: action.payload.content,
              timestamp: action.payload.timestamp || action.payload.createdAt,
              senderId: action.payload.senderId,
            },
            unreadCount: newUnreadCount,
            // Update the conversation's updatedAt to reflect latest activity
            updatedAt: new Date(action.payload.timestamp || action.payload.createdAt || Date.now()),
          };
        }
        return conv;
      });

      // Reorder conversations by latest activity (updatedAt)
      const reorderedConversations = updatedConversations.sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.lastMessage?.timestamp || 0).getTime();
        const bTime = new Date(b.updatedAt || b.lastMessage?.timestamp || 0).getTime();
        return bTime - aTime; // Most recent first
      });

      return { 
        ...state, 
        messages: updatedMessages,
        conversations: reorderedConversations,
      };
    
    case 'ADD_TEMP_MESSAGE':
      const isCurrentConversationForTemp = state.currentConversation?.id === action.payload.conversationId;
      if (!isCurrentConversationForTemp) {
        return state;
      }
      
      // Add temp message to messages array only (no conversation updates)
      const tempMessages = [...state.messages, action.payload].sort((a, b) => 
        new Date(a.timestamp || a.createdAt || 0).getTime() - 
        new Date(b.timestamp || b.createdAt || 0).getTime()
      );
      
      return { 
        ...state, 
        messages: tempMessages,
      };
    
    case 'REPLACE_TEMP_MESSAGE':
      const isCurrentConversationForReplace = state.currentConversation?.id === action.payload.realMessage.conversationId;
      if (!isCurrentConversationForReplace) {
        return state;
      }
      
      // Find and replace the temporary message with the real one
      const tempMessageIndex = state.messages.findIndex(msg => msg.id === action.payload.tempId);
      
      if (tempMessageIndex === -1) {
        // If temp message not found, just add the real message
        const updatedMessages = [...state.messages, action.payload.realMessage].sort((a, b) => 
          new Date(a.timestamp || a.createdAt || 0).getTime() - 
          new Date(b.timestamp || b.createdAt || 0).getTime()
        );
        
        // Update conversations and reorder them by latest activity
        const updatedConversationsForReplace = state.conversations.map(conv => 
          conv.id === action.payload.realMessage.conversationId 
            ? {
                ...conv,
                lastMessage: {
                  content: action.payload.realMessage.content,
                  timestamp: action.payload.realMessage.timestamp || action.payload.realMessage.createdAt,
                  senderId: action.payload.realMessage.senderId,
                },
                // Don't change unread count when replacing temp message (it's the sender's own message)
                unreadCount: conv.unreadCount,
                // Update the conversation's updatedAt to reflect latest activity
                updatedAt: new Date(action.payload.realMessage.timestamp || action.payload.realMessage.createdAt || Date.now()),
              }
            : conv
        );

        // Reorder conversations by latest activity (updatedAt)
        const reorderedConversationsForReplace = updatedConversationsForReplace.sort((a, b) => {
          const aTime = new Date(a.updatedAt || a.lastMessage?.timestamp || 0).getTime();
          const bTime = new Date(b.updatedAt || b.lastMessage?.timestamp || 0).getTime();
          return bTime - aTime; // Most recent first
        });

        return { 
          ...state, 
          messages: updatedMessages,
          conversations: reorderedConversationsForReplace,
        };
      }
      
      // Replace the temporary message with the real one
      const replacedMessages = [...state.messages];
      replacedMessages[tempMessageIndex] = action.payload.realMessage;
      
      const sortedMessages = replacedMessages.sort((a, b) => 
        new Date(a.timestamp || a.createdAt || 0).getTime() - 
        new Date(b.timestamp || b.createdAt || 0).getTime()
      );
      
      // Update conversations and reorder them by latest activity
      const updatedConversationsForReplace2 = state.conversations.map(conv => 
        conv.id === action.payload.realMessage.conversationId 
          ? {
              ...conv,
              lastMessage: {
                content: action.payload.realMessage.content,
                timestamp: action.payload.realMessage.timestamp || action.payload.realMessage.createdAt,
                senderId: action.payload.realMessage.senderId,
              },
              // Don't change unread count when replacing temp message (it's the sender's own message)
              unreadCount: conv.unreadCount,
              // Update the conversation's updatedAt to reflect latest activity
              updatedAt: new Date(action.payload.realMessage.timestamp || action.payload.realMessage.createdAt || Date.now()),
            }
          : conv
      );

      // Reorder conversations by latest activity (updatedAt)
      const reorderedConversationsForReplace2 = updatedConversationsForReplace2.sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.lastMessage?.timestamp || 0).getTime();
        const bTime = new Date(b.updatedAt || b.lastMessage?.timestamp || 0).getTime();
        return bTime - aTime; // Most recent first
      });

      return { 
        ...state, 
        messages: sortedMessages,
        conversations: reorderedConversationsForReplace2,
      };
    
    case 'UPDATE_MESSAGE_STATUS':
      return {
        ...state,
        messages: state.messages.map(message =>
          message.id === action.payload.messageId
            ? { ...message, status: action.payload.status as any }
            : message
        ),
      };
    
    case 'UPDATE_MESSAGES_READ':
      return {
        ...state,
        messages: state.messages.map(message =>
          action.payload.messageIds.includes(message.id)
            ? { ...message, isRead: true, status: 'read' as MessageStatus }
            : message
        ),
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
        conversations: state.conversations.map(conv => {
          if (conv.id === state.currentConversation?.id) {
            return {
              ...conv,
              unreadCount: 0, // Reset unread count when messages are marked as read
            };
          }
          return conv;
        }),
      };
    
    case 'RESET_CHAT':
      return {
        user: null,
        conversations: [],
        currentConversation: null,
        messages: [],
        isLoading: false,
        isLoadingMore: false,
        isLoadingMoreMessages: false,
        error: null,
        conversationsPagination: null,
        messagesPagination: null,
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
  isLoadingMore: false,
  isLoadingMoreMessages: false,
  error: null,
  conversationsPagination: null,
  messagesPagination: null,
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
      const response = await chatService.getConversations(1, 20); // Load first 20 conversations
      
      if (response.success && response.data) {
        dispatch({ 
          type: 'SET_CONVERSATIONS', 
          payload: { 
            conversations: response.data, 
            pagination: response.pagination 
          } 
        });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to load conversations' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load conversations' });
    }
  }, []);

  const loadMoreConversations = useCallback(async (): Promise<void> => {
    const currentPagination = state.conversationsPagination;
    if (!currentPagination || !currentPagination.hasNext || state.isLoadingMore) {
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING_MORE', payload: true });
      const nextPage = currentPagination.page + 1;
      const response = await chatService.getConversations(nextPage, currentPagination.limit);
      
      if (response.success && response.data) {
        dispatch({ 
          type: 'APPEND_CONVERSATIONS', 
          payload: { 
            conversations: response.data, 
            pagination: response.pagination 
          } 
        });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to load more conversations' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load more conversations' });
    }
  }, [state.conversationsPagination, state.isLoadingMore]);

  const loadMoreMessages = useCallback(async (): Promise<void> => {
    const currentPagination = state.messagesPagination;
    if (!currentPagination || !currentPagination.hasNext || state.isLoadingMoreMessages || !state.currentConversation) {
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING_MORE_MESSAGES', payload: true });
      const nextPage = currentPagination.page + 1;
      const response = await chatService.getMessages(
        state.currentConversation.id, 
        nextPage, 
        currentPagination.limit,
        currentPagination.cursor
      );
      
      if (response.success && response.data) {
        dispatch({ 
          type: 'PREPEND_MESSAGES', 
          payload: { 
            messages: response.data, 
            pagination: response.pagination 
          } 
        });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to load more messages' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load more messages' });
    }
  }, [state.messagesPagination, state.isLoadingMoreMessages, state.currentConversation]);

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
        chatService.getMessages(conversationId, 1, 20), // Load first 20 messages
      ]);

      if (conversationResponse.success && conversationResponse.data) {
        dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: conversationResponse.data });
        
        if (messagesResponse.success && messagesResponse.data) {
          dispatch({ 
            type: 'SET_MESSAGES', 
            payload: { 
              messages: messagesResponse.data, 
              pagination: messagesResponse.pagination 
            } 
          });
        }

        // Join new conversation room
        socketService.joinConversation(conversationId);

        // Mark messages as read - always send read receipt for recent messages from others
        // This ensures the sender sees double checkmarks even if we're already in the conversation
        const recentMessages = messagesResponse.data?.filter(m => 
          m.senderId !== user?.id && 
          m.createdAt && 
          new Date(m.createdAt).getTime() > (Date.now() - 5 * 60 * 1000) // Last 5 minutes
        ) || [];
        
        if (recentMessages.length > 0) {
          markMessagesAsRead(recentMessages.map(m => m.id), conversationId);
        }
        
        // Also mark all unread messages as read (for when user is already in conversation)
        const unreadMessages = messagesResponse.data?.filter(m => 
          !m.isRead && m.senderId !== user?.id
        ) || [];
        
        if (unreadMessages.length > 0) {
          markMessagesAsRead(unreadMessages.map(m => m.id), conversationId);
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

    // Generate a consistent temporary ID
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create a temporary message with pending status
    const tempMessage: Message = {
      id: tempId, // Consistent temporary ID
      content,
      senderId: user.id,
      conversationId: state.currentConversation.id,
      timestamp: new Date(),
      status: 'pending',
      sender: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
      },
    };

    // Add the temporary message immediately
    dispatch({ type: 'ADD_TEMP_MESSAGE', payload: tempMessage });

    // Send via socket with the temp ID for tracking
    const messageToSend = {
      content,
      senderId: user.id,
      conversationId: state.currentConversation.id,
      tempId, // Include temp ID for tracking
    };

    socketService.sendMessage(messageToSend);
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

  const markMessagesAsRead = useCallback((messageIds: string[], conversationId?: string): void => {
    const targetConversationId = conversationId || state.currentConversation?.id;
    
    if (targetConversationId) {
      socketService.markAsRead(messageIds, targetConversationId);
    }
    
    dispatch({ type: 'MARK_MESSAGES_READ', payload: messageIds });
  }, [state.currentConversation]);

  // Function to mark all recent messages as read (for when user is already in conversation)
  const markRecentMessagesAsRead = useCallback((): void => {
    if (!state.currentConversation || !user) {
      return;
    }
    
    // Get recent messages from others (last 5 minutes)
    const recentMessages = state.messages.filter(m => {
      const isFromOtherUser = m.senderId !== user.id;
      const hasTimestamp = !!m.timestamp;
      const isRecent = m.timestamp && new Date(m.timestamp).getTime() > (Date.now() - 5 * 60 * 1000);
      
      return isFromOtherUser && hasTimestamp && isRecent;
    });
    
    if (recentMessages.length > 0) {
      markMessagesAsRead(recentMessages.map(m => m.id), state.currentConversation.id);
    }
  }, [state.currentConversation, user, state.messages, markMessagesAsRead]);

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
      const handleNewMessage = (data: { message: Message; conversationId: string; timestamp: string }) => {
        // This is always a message from another user
        dispatch({ type: 'ADD_MESSAGE', payload: { ...data.message, currentUserId: user?.id } });
      };

      const handleMessageSent = (data: { message: Message; conversationId: string; timestamp: string; tempId?: string }) => {
        // This is always the sender's own message confirmation
        if (data.tempId) {
          // Replace the temporary message with the real one
          dispatch({ 
            type: 'REPLACE_TEMP_MESSAGE', 
            payload: { 
              tempId: data.tempId,
              realMessage: data.message
            } 
          });
        }
      };

      const handleMessageRead = (data: { messageIds: string[]; readBy: string; username: string; conversationId: string; timestamp: string }) => {
        // Always update message status to read when we receive a read receipt
        // This will show double check for the sender
        dispatch({ type: 'UPDATE_MESSAGES_READ', payload: { messageIds: data.messageIds, readBy: data.readBy } });
      };

      const handleUserOnline = (data: { userId: string; username: string; timestamp: string }) => {
        dispatch({ type: 'UPDATE_USER_STATUS', payload: { userId: data.userId, isOnline: true } });
      };

      const handleUserOffline = (data: { userId: string; username: string; timestamp: string }) => {
        dispatch({ type: 'UPDATE_USER_STATUS', payload: { userId: data.userId, isOnline: false } });
      };

      const handleOnlineUsers = (userIds: string[]) => {
        // Update all users in conversations to their online status
        userIds.forEach(userId => {
          dispatch({ type: 'UPDATE_USER_STATUS', payload: { userId, isOnline: true } });
        });
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

      const handleError = (error: { message: string }) => {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      };

      // Set up socket listeners
      socketService.onNewMessage(handleNewMessage);
      socketService.onMessageSent(handleMessageSent);
      socketService.onMessageRead(handleMessageRead);
      socketService.onUserOnline(handleUserOnline);
      socketService.onUserOffline(handleUserOffline);
      socketService.onOnlineUsers(handleOnlineUsers);
      socketService.onConversationUpdated(handleConversationUpdated);
      socketService.onError(handleError);

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
    loadMoreConversations,
    selectConversation,
    loadMoreMessages,
    sendMessage,
    searchUsers,
    createConversation,
    markMessagesAsRead,
    markRecentMessagesAsRead,
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