import type { 
  Conversation, 
  ConversationPreview, 
  Message, 
  User, 
  ApiResponse,
  PaginatedResponse 
} from '../types';
// Removed mock data imports - using only real API data
import { apiService as api } from './api';

export class ChatService {
  // Get all conversations for the current user
  async getConversations(page: number = 1, limit: number = 10): Promise<PaginatedResponse<ConversationPreview>> {
    try {
      const response = await api.get<PaginatedResponse<any>>(`/conversations?page=${page}&limit=${limit}`);
      
      // Convert API response to client format
      const convertedData = (response.data.data || []).map((conv: any) => ({
        id: conv.id,
        otherParticipant: {
          id: conv.otherParticipant.id,
          username: conv.otherParticipant.username,
          email: '', // Not provided by API
          avatar: conv.otherParticipant.avatar,
          isOnline: conv.otherParticipant.isOnline,
          lastSeen: new Date(conv.otherParticipant.lastSeen),
        },
        lastMessage: conv.lastMessage ? {
          content: conv.lastMessage.content,
          timestamp: new Date(conv.lastMessage.createdAt),
          senderId: conv.lastMessage.senderId,
        } : undefined,
        unreadCount: conv.unreadCount,
      }));
      
      return {
        success: response.data.success,
        data: convertedData,
        pagination: response.data.pagination,
      };
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return {
        success: false,
        error: 'Failed to fetch conversations',
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  // Get a specific conversation with messages
  async getConversation(conversationId: string): Promise<ApiResponse<Conversation>> {
    try {
      const response = await api.get<any>(`/conversations/${conversationId}`);
      
    
      
      // Handle both old and new response formats
      let rawConversationData;
      let success = true;
      
      if (response.data && response.data.data) {
        // New format: { success: true, data: conversation }
        rawConversationData = response.data.data;
        success = response.data.success;
      } else if (response.data && response.data.id) {
        // Old format: conversation directly
        rawConversationData = response.data;
        success = true;
      } else {
        console.error('Invalid API response structure:', response.data);
        throw new Error('Invalid response structure from server');
      }
      

      // Validate required fields
      if (!rawConversationData || !rawConversationData.id) {
        console.error('Missing conversation ID in response:', rawConversationData);
        throw new Error('Missing conversation ID in response');
      }
      
      const conversation: Conversation = {
        id: rawConversationData.id,
        participants: rawConversationData.participants?.map((p: any) => ({
          id: p.id,
          username: p.username,
          email: '', // Not provided by API
          avatar: p.avatar,
          isOnline: p.isOnline,
          lastSeen: new Date(p.lastSeen),
        })) || [],
        unreadCount: rawConversationData.unreadCount || 0,
        updatedAt: new Date(rawConversationData.updatedAt),
        createdAt: new Date(rawConversationData.createdAt),
        lastMessage: rawConversationData.lastMessage ? {
          id: rawConversationData.lastMessage.id,
          content: rawConversationData.lastMessage.content,
          senderId: rawConversationData.lastMessage.senderId,
          conversationId: conversationId,
          timestamp: new Date(rawConversationData.lastMessage.createdAt),
          isRead: false, // Default value
          messageType: rawConversationData.lastMessage.messageType,
        } : undefined,
      };
      
      return {
        success,
        data: conversation,
      };
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return {
        success: false,
        error: 'Failed to fetch conversation',
      };
    }
  }

  // Get messages for a conversation with pagination
  async getMessages(
    conversationId: string, 
    page: number = 1, 
    limit: number = 20,
    cursor?: string
  ): Promise<PaginatedResponse<Message>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (cursor) {
        params.append('cursor', cursor);
      }
      
      const response = await api.get<PaginatedResponse<any>>(`/messages/conversation/${conversationId}?${params}`);
      
      // Convert API response to client format
      const convertedData = (response.data.data || []).map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.sender.id,
        conversationId: msg.conversationId,
        timestamp: new Date(msg.createdAt),
        isRead: msg.isRead,
        messageType: msg.messageType,
        isEdited: msg.isEdited,
        isDeleted: msg.isDeleted,
        createdAt: new Date(msg.createdAt),
        updatedAt: new Date(msg.updatedAt),
        sender: msg.sender,
      }));
      
      return {
        success: response.data.success,
        data: convertedData,
        pagination: response.data.pagination,
      };
    } catch (error) {
      console.error('Error fetching messages:', error);
      return {
        success: false,
        error: 'Failed to fetch messages',
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  // Create a new conversation
  async createConversation(participantIds: string[]): Promise<ApiResponse<Conversation>> {
    try {
      const response = await api.post<ApiResponse<Conversation>>('/conversations', {
        participantIds,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return {
        success: false,
        error: 'Failed to create conversation',
      };
    }
  }

  // Send a message (also handled via socket, but this is for backup/sync)
  async sendMessage(conversationId: string, content: string, messageType: string = 'text'): Promise<ApiResponse<Message>> {
    try {
      const response = await api.post<ApiResponse<any>>('/messages', {
        content,
        conversationId,
        messageType,
      });
      
      // Convert API response to client format
      const rawMessageData = response.data.data;
      const message: Message = {
        id: rawMessageData.id,
        content: rawMessageData.content,
        senderId: rawMessageData.sender.id,
        conversationId: rawMessageData.conversationId,
        timestamp: new Date(rawMessageData.createdAt),
        isRead: rawMessageData.isRead,
        messageType: rawMessageData.messageType,
        isEdited: rawMessageData.isEdited,
        isDeleted: rawMessageData.isDeleted,
        createdAt: new Date(rawMessageData.createdAt),
        updatedAt: new Date(rawMessageData.updatedAt),
        sender: rawMessageData.sender,
      };
      
      return {
        success: response.data.success,
        data: message,
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        error: 'Failed to send message',
      };
    }
  }

  // Mark messages as read
  async markMessagesAsRead(messageIds: string[]): Promise<ApiResponse<void>> {
    try {
      const response = await api.put<ApiResponse<void>>('/messages/mark-as-read', {
        messageIds,
      });
      return response.data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return {
        success: false,
        error: 'Failed to mark messages as read',
      };
    }
  }

  // Search for users to start new conversations
  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    try {
      const response = await api.get<ApiResponse<User[]>>(`/users/search?q=${encodeURIComponent(query)}`);
      
      return {
        success: response.data.success,
        data: response.data.data || [],
      };
    } catch (error) {
      console.error('Error searching users:', error);
      return {
        success: false,
        error: 'Failed to search users',
        data: [],
      };
    }
  }

  // Get user profile
  async getUserProfile(userId: string): Promise<ApiResponse<User>> {
    try {
      const response = await api.get<ApiResponse<User>>(`/users/${userId}`);
      
      return {
        success: response.data.success,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return {
        success: false,
        error: 'Failed to fetch user profile',
      };
    }
  }

  // Update user online status
  async updateOnlineStatus(isOnline: boolean): Promise<ApiResponse<void>> {
    try {
      const response = await api.put<ApiResponse<void>>('/users/online-status', {
        isOnline,
      });
      
      return {
        success: response.data.success,
      };
    } catch (error) {
      console.error('Error updating online status:', error);
      return {
        success: false,
        error: 'Failed to update online status',
      };
    }
  }

  // Edit a message
  async editMessage(messageId: string, content: string): Promise<ApiResponse<Message>> {
    try {
      const response = await api.put<ApiResponse<Message>>(`/messages/${messageId}`, {
        content,
      });
      return response.data;
    } catch (error) {
      console.error('Error editing message:', error);
      return {
        success: false,
        error: 'Failed to edit message',
      };
    }
  }

  // Delete a message
  async deleteMessage(messageId: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete<ApiResponse<void>>(`/messages/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      return {
        success: false,
        error: 'Failed to delete message',
      };
    }
  }
}

export const chatService = new ChatService();
