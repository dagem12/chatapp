import type { 
  Conversation, 
  ConversationPreview, 
  Message, 
  User, 
  ApiResponse,
  PaginatedResponse 
} from '../types';
import { 
  mockConversations, 
  mockFullConversations, 
  mockMessages, 
  mockUsers, 
  generateMessageId, 
  generateConversationId,
  currentUser 
} from '../utils/mockData';
import { apiService as api } from './api';

export class ChatService {
  // Get all conversations for the current user
  async getConversations(page: number = 1, limit: number = 10): Promise<PaginatedResponse<ConversationPreview>> {
    try {
      const response = await api.get<PaginatedResponse<ConversationPreview>>(`/conversations?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      // Fallback to mock data in development
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        data: [...mockConversations],
        pagination: {
          page: 1,
          limit: 10,
          total: mockConversations.length,
          totalPages: 1,
        },
      };
    }
  }

  // Get a specific conversation with messages
  async getConversation(conversationId: string): Promise<ApiResponse<Conversation>> {
    try {
      const response = await api.get<ApiResponse<Conversation>>(`/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      // Fallback to mock data in development
      await new Promise(resolve => setTimeout(resolve, 300));
      const conversation = mockFullConversations[conversationId];
      if (conversation) {
        return {
          success: true,
          data: conversation,
        };
      }
      
      return {
        success: false,
        error: 'Conversation not found',
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
      
      const response = await api.get<PaginatedResponse<Message>>(`/messages/conversation/${conversationId}?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Fallback to mock data in development
      await new Promise(resolve => setTimeout(resolve, 400));
      const messages = mockMessages[conversationId] || [];
      return {
        success: true,
        data: [...messages],
        pagination: {
          page: 1,
          limit: 20,
          total: messages.length,
          totalPages: 1,
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
      // Fallback to mock data in development
      await new Promise(resolve => setTimeout(resolve, 600));
      const otherParticipant = mockUsers.find(user => participantIds.includes(user.id));
      if (!otherParticipant) {
        return {
          success: false,
          error: 'User not found',
        };
      }
      
      const newConversationId = generateConversationId();
      const newConversation: Conversation = {
        id: newConversationId,
        participants: [currentUser, otherParticipant],
        unreadCount: 0,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      
      // Add to mock data
      mockFullConversations[newConversationId] = newConversation;
      mockMessages[newConversationId] = [];
      
      // Add to conversations list
      const newConversationPreview: ConversationPreview = {
        id: newConversationId,
        otherParticipant,
        unreadCount: 0,
      };
      mockConversations.unshift(newConversationPreview);
      
      return {
        success: true,
        data: newConversation,
      };
    }
  }

  // Send a message (also handled via socket, but this is for backup/sync)
  async sendMessage(conversationId: string, content: string, messageType: string = 'text'): Promise<ApiResponse<Message>> {
    try {
      const response = await api.post<ApiResponse<Message>>('/messages', {
        content,
        conversationId,
        messageType,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      // Fallback to mock data in development
      await new Promise(resolve => setTimeout(resolve, 200));
      const newMessage: Message = {
        id: generateMessageId(),
        content,
        senderId: currentUser.id,
        conversationId,
        timestamp: new Date(),
        isRead: false,
      };
      
      // Add to mock messages
      if (!mockMessages[conversationId]) {
        mockMessages[conversationId] = [];
      }
      mockMessages[conversationId].push(newMessage);
      
      return {
        success: true,
        data: newMessage,
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
      // Fallback to mock data in development
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update mock messages
      Object.values(mockMessages).forEach(messages => {
        messages.forEach(message => {
          if (messageIds.includes(message.id)) {
            message.isRead = true;
          }
        });
      });
      
      return {
        success: true,
      };
    }
  }

  // Search for users to start new conversations
  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
    
    const filteredUsers = mockUsers.filter(user => 
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    );
    
    return {
      success: true,
      data: filteredUsers,
    };
  }

  // Get user profile
  async getUserProfile(userId: string): Promise<ApiResponse<User>> {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
    
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      return {
        success: true,
        data: user,
      };
    }
    
    return {
      success: false,
      error: 'User not found',
    };
  }

  // Update user online status
  async updateOnlineStatus(isOnline: boolean): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
    
    // Update current user status in mock data
    currentUser.isOnline = isOnline;
    
    return {
      success: true,
    };
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
