import { io, Socket } from 'socket.io-client';
import type { Message, Conversation } from '../types';
import { config } from '../config/env';

class SocketService {
  private socket: Socket | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(token: string): void {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    
    const socketUrl = `${config.API_URL}/chat`;
    
    this.socket = io(socketUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnecting = false;
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.isConnecting = false;
      this.handleReconnect();
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    }, delay);
  }

  // Join a conversation room
  joinConversation(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('joinConversation', { conversationId });
    }
  }

  // Leave a conversation room
  leaveConversation(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leaveConversation', { conversationId });
    }
  }

  // Send a message
  sendMessage(message: Omit<Message, 'id' | 'timestamp'> & { tempId?: string }): void {
    if (this.socket?.connected) {
      this.socket.emit('sendMessage', message);
    } else {
      console.error('Socket not connected, cannot send message');
    }
  }

  // Mark messages as read
  markAsRead(messageIds: string[], conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('markAsRead', { messageIds, conversationId });
    } else {
    }
  }

  // Send typing status
  sendTyping(conversationId: string, isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('typing', { conversationId, isTyping });
    }
  }

  // Listen for new messages (from other users)
  onNewMessage(callback: (data: { message: Message; conversationId: string; timestamp: string }) => void): void {
    if (this.socket) {
      this.socket.on('newMessage', (data) => {
        callback(data);
      });
    }
  }

  // Listen for message sent confirmation (for sender)
  onMessageSent(callback: (data: { message: Message; conversationId: string; timestamp: string; tempId?: string }) => void): void {
    if (this.socket) {
      this.socket.on('messageSent', (data) => {
        callback(data);
      });
    }
  }

  // Listen for message read status
  onMessageRead(callback: (data: { messageIds: string[]; readBy: string; username: string; conversationId: string; timestamp: string }) => void): void {
    if (this.socket) {
      this.socket.on('messagesRead', (data) => {
        callback(data);
      });
    }
  }

  // Listen for user online status
  onUserOnline(callback: (data: { userId: string; username: string; timestamp: string }) => void): void {
    if (this.socket) {
      this.socket.on('userOnline', callback);
    }
  }

  // Listen for user offline status
  onUserOffline(callback: (data: { userId: string; username: string; timestamp: string }) => void): void {
    if (this.socket) {
      this.socket.on('userOffline', callback);
    }
  }

  // Listen for online users list
  onOnlineUsers(callback: (userIds: string[]) => void): void {
    if (this.socket) {
      this.socket.on('onlineUsers', callback);
    }
  }

  // Listen for user joining conversation
  onUserJoinedConversation(callback: (data: { userId: string; username: string; conversationId: string; timestamp: string }) => void): void {
    if (this.socket) {
      this.socket.on('userJoinedConversation', callback);
    }
  }

  // Listen for user leaving conversation
  onUserLeftConversation(callback: (data: { userId: string; username: string; conversationId: string; timestamp: string }) => void): void {
    if (this.socket) {
      this.socket.on('userLeftConversation', callback);
    }
  }

  // Listen for user typing
  onUserTyping(callback: (data: { userId: string; username: string; conversationId: string; isTyping: boolean; timestamp: string }) => void): void {
    if (this.socket) {
      this.socket.on('userTyping', callback);
    }
  }

  // Listen for conversation updates
  onConversationUpdated(callback: (conversation: Conversation) => void): void {
    if (this.socket) {
      this.socket.on('conversationUpdated', callback);
    }
  }

  // Listen for errors
  onError(callback: (error: { message: string }) => void): void {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  // Listen for successful join/leave events
  onJoinedConversation(callback: (data: { conversationId: string }) => void): void {
    if (this.socket) {
      this.socket.on('joinedConversation', callback);
    }
  }

  onLeftConversation(callback: (data: { conversationId: string }) => void): void {
    if (this.socket) {
      this.socket.on('leftConversation', callback);
    }
  }

  removeEventListener(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  removeAllListeners(event?: string): void {
    if (this.socket) {
      if (event) {
        this.socket.removeAllListeners(event);
      } else {
        this.socket.removeAllListeners();
      }
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get socket instance for advanced usage
  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
