import type { Message, Conversation } from '../types';
import { mockSocketService } from './mockSocket';

class SocketService {
  connect(token: string): void {
    mockSocketService.connect(token);
  }

  disconnect(): void {
    mockSocketService.disconnect();
  }

  // Join a conversation room
  joinConversation(conversationId: string): void {
    mockSocketService.joinConversation(conversationId);
  }

  // Leave a conversation room
  leaveConversation(conversationId: string): void {
    mockSocketService.leaveConversation(conversationId);
  }

  // Send a message
  sendMessage(message: Omit<Message, 'id' | 'timestamp'>): void {
    mockSocketService.sendMessage(message);
  }

  // Mark messages as read
  markAsRead(messageIds: string[]): void {
    mockSocketService.markAsRead(messageIds);
  }

  // Listen for new messages
  onNewMessage(callback: (message: Message) => void): void {
    mockSocketService.onNewMessage(callback);
  }

  // Listen for message read status
  onMessageRead(callback: (messageIds: string[]) => void): void {
    mockSocketService.onMessageRead(callback);
  }

  // Listen for user online status
  onUserOnline(callback: (userId: string) => void): void {
    mockSocketService.onUserOnline(callback);
  }

  // Listen for user offline status
  onUserOffline(callback: (userId: string) => void): void {
    mockSocketService.onUserOffline(callback);
  }

  // Listen for conversation updates
  onConversationUpdated(callback: (conversation: Conversation) => void): void {
    mockSocketService.onConversationUpdated(callback);
  }

  removeEventListener(event: string, callback: (...args: any[]) => void): void {
    mockSocketService.removeEventListener(event, callback);
  }

  removeAllListeners(event?: string): void {
    mockSocketService.removeAllListeners(event);
  }

  isConnected(): boolean {
    return mockSocketService.isConnected();
  }
}

export const socketService = new SocketService();
