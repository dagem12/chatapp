import { MessageType } from '../dto/message.dto';

export interface MessageResponse {
  id: string;
  content: string;
  messageType: MessageType;
  isRead: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  senderId: string; // Add senderId for frontend compatibility
  status: string; // Add status field for frontend
  sender: {
    id: string;
    username: string;
    avatar?: string;
  };
  conversationId: string;
}

export interface ConversationResponse {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  participants: {
    id: string;
    username: string;
    avatar?: string;
    isOnline: boolean;
    lastSeen: Date;
    joinedAt: Date;
    lastReadAt: Date;
  }[];
  lastMessage?: MessageResponse;
  unreadCount: number;
}

export interface ConversationPreviewResponse {
  id: string;
  otherParticipant: {
    id: string;
    username: string;
    avatar?: string;
    isOnline: boolean;
    lastSeen: Date;
  };
  lastMessage?: {
    id: string;
    content: string;
    messageType: MessageType;
    createdAt: Date;
    senderId: string;
  };
  unreadCount: number;
  updatedAt: Date;
}

export interface PaginatedMessagesResponse {
  success: boolean;
  message: string;
  data: MessageResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
    cursor?: string;
  };
}

export interface PaginatedConversationsResponse {
  success: boolean;
  message: string;
  data: ConversationPreviewResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface MessageCreatedResponse {
  success: boolean;
  message: string;
  data: MessageResponse;
}

export interface ConversationCreatedResponse {
  success: boolean;
  message: string;
  data: ConversationResponse;
}

export interface MessagesMarkedAsReadResponse {
  success: boolean;
  message: string;
  data: {
    markedCount: number;
    messageIds: string[];
  };
}
