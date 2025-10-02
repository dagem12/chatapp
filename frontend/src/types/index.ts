export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface AuthUser extends User {
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  conversationId: string;
  timestamp: Date;
  isRead?: boolean;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: Date;
  createdAt: Date;
}

export interface ConversationPreview {
  id: string;
  otherParticipant: User;
  lastMessage?: {
    content: string;
    timestamp: Date;
    senderId: string;
  };
  unreadCount: number;
}

export interface SocketEvents {
  // Client to Server
  'join-conversation': (conversationId: string) => void;
  'leave-conversation': (conversationId: string) => void;
  'send-message': (message: Omit<Message, 'id' | 'timestamp'>) => void;
  'mark-as-read': (messageIds: string[]) => void;
  
  // Server to Client
  'new-message': (message: Message) => void;
  'message-read': (messageIds: string[]) => void;
  'user-online': (userId: string) => void;
  'user-offline': (userId: string) => void;
  'conversation-updated': (conversation: Conversation) => void;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ChatState {
  user: AuthUser | null;
  conversations: ConversationPreview[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
