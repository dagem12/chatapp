import { io, Socket } from 'socket.io-client';
import type { Message, Conversation } from '../types';
import { config } from '../config/env';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, ((...args: any[]) => void)[]> = new Map();

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(config.SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Re-register all listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket?.on(event, callback);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join a conversation room
  joinConversation(conversationId: string): void {
    this.socket?.emit('join-conversation', conversationId);
  }

  // Leave a conversation room
  leaveConversation(conversationId: string): void {
    this.socket?.emit('leave-conversation', conversationId);
  }

  // Send a message
  sendMessage(message: Omit<Message, 'id' | 'timestamp'>): void {
    this.socket?.emit('send-message', message);
  }

  // Mark messages as read
  markAsRead(messageIds: string[]): void {
    this.socket?.emit('mark-as-read', messageIds);
  }

  // Listen for new messages
  onNewMessage(callback: (message: Message) => void): void {
    this.addEventListener('new-message', callback);
  }

  // Listen for message read status
  onMessageRead(callback: (messageIds: string[]) => void): void {
    this.addEventListener('message-read', callback);
  }

  // Listen for user online status
  onUserOnline(callback: (userId: string) => void): void {
    this.addEventListener('user-online', callback);
  }

  // Listen for user offline status
  onUserOffline(callback: (userId: string) => void): void {
    this.addEventListener('user-offline', callback);
  }

  // Listen for conversation updates
  onConversationUpdated(callback: (conversation: Conversation) => void): void {
    this.addEventListener('conversation-updated', callback);
  }

  // Generic event listener management
  private addEventListener(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)?.push(callback);
    
    if (this.socket?.connected) {
      this.socket.on(event, callback as any);
    }
  }

  removeEventListener(event: string, callback: (...args: any[]) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
    
    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
      this.socket?.off(event);
    } else {
      this.listeners.clear();
      this.socket?.removeAllListeners();
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
