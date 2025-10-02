import type { 
  Conversation, 
  ConversationPreview, 
  Message, 
  User, 
  ApiResponse 
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

export class ChatService {
  // Get all conversations for the current user
  async getConversations(): Promise<ApiResponse<ConversationPreview[]>> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    return {
      success: true,
      data: [...mockConversations],
    };
  }

  // Get a specific conversation with messages
  async getConversation(conversationId: string): Promise<ApiResponse<Conversation>> {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
    
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

  // Get messages for a conversation with pagination
  async getMessages(
    conversationId: string, 
    _page: number = 1, 
    _limit: number = 50
  ): Promise<ApiResponse<Message[]>> {
    await new Promise(resolve => setTimeout(resolve, 400)); // Simulate network delay
    
    const messages = mockMessages[conversationId] || [];
    return {
      success: true,
      data: [...messages],
    };
  }

  // Create a new conversation
  async createConversation(participantIds: string[]): Promise<ApiResponse<Conversation>> {
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network delay
    
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

  // Send a message (also handled via socket, but this is for backup/sync)
  async sendMessage(conversationId: string, content: string): Promise<ApiResponse<Message>> {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
    
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

  // Mark messages as read
  async markMessagesAsRead(messageIds: string[]): Promise<ApiResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
    
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
}

export const chatService = new ChatService();
