import { apiService } from './api';
import type { 
  Conversation, 
  ConversationPreview, 
  Message, 
  User, 
  ApiResponse 
} from '../types';

export class ChatService {
  // Get all conversations for the current user
  async getConversations(): Promise<ApiResponse<ConversationPreview[]>> {
    return apiService.get<ConversationPreview[]>('/conversations');
  }

  // Get a specific conversation with messages
  async getConversation(conversationId: string): Promise<ApiResponse<Conversation>> {
    return apiService.get<Conversation>(`/conversations/${conversationId}`);
  }

  // Get messages for a conversation with pagination
  async getMessages(
    conversationId: string, 
    page: number = 1, 
    limit: number = 50
  ): Promise<ApiResponse<Message[]>> {
    return apiService.get<Message[]>(`/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
  }

  // Create a new conversation
  async createConversation(participantIds: string[]): Promise<ApiResponse<Conversation>> {
    return apiService.post<Conversation>('/conversations', { participantIds });
  }

  // Send a message (also handled via socket, but this is for backup/sync)
  async sendMessage(conversationId: string, content: string): Promise<ApiResponse<Message>> {
    return apiService.post<Message>(`/conversations/${conversationId}/messages`, { content });
  }

  // Mark messages as read
  async markMessagesAsRead(messageIds: string[]): Promise<ApiResponse<void>> {
    return apiService.put<void>('/messages/mark-read', { messageIds });
  }

  // Search for users to start new conversations
  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    return apiService.get<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
  }

  // Get user profile
  async getUserProfile(userId: string): Promise<ApiResponse<User>> {
    return apiService.get<User>(`/users/${userId}`);
  }

  // Update user online status
  async updateOnlineStatus(isOnline: boolean): Promise<ApiResponse<void>> {
    return apiService.put<void>('/users/status', { isOnline });
  }
}

export const chatService = new ChatService();
