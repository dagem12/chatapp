import type { Message } from '../types';
import { getRandomAutoReply, generateMessageId, mockMessages, mockUsers, currentUser } from '../utils/mockData';

class MockSocketService {
  private listeners: Map<string, ((...args: any[]) => void)[]> = new Map();
  private connected = false;
  private autoReplyTimeouts: number[] = [];

  connect(_token: string): void {
    if (this.connected) {
      return;
    }

    console.log('Mock Socket: Connected');
    this.connected = true;

    // Simulate connection event
    setTimeout(() => {
      this.emit('connect');
    }, 100);
  }

  disconnect(): void {
    if (!this.connected) {
      return;
    }

    console.log('Mock Socket: Disconnected');
    this.connected = false;
    
    // Clear all auto-reply timeouts
    this.autoReplyTimeouts.forEach(timeout => clearTimeout(timeout));
    this.autoReplyTimeouts = [];

    this.emit('disconnect');
  }

  // Join a conversation room
  joinConversation(conversationId: string): void {
    console.log(`Mock Socket: Joined conversation ${conversationId}`);
  }

  // Leave a conversation room
  leaveConversation(conversationId: string): void {
    console.log(`Mock Socket: Left conversation ${conversationId}`);
  }

  // Send a message
  sendMessage(message: Omit<Message, 'id' | 'timestamp'>): void {
    console.log('Mock Socket: Sending message', message);
    
    // Create the full message
    const fullMessage: Message = {
      ...message,
      id: generateMessageId(),
      timestamp: new Date(),
      isRead: false,
    };

    // Add to mock messages
    if (!mockMessages[message.conversationId]) {
      mockMessages[message.conversationId] = [];
    }
    mockMessages[message.conversationId].push(fullMessage);

    // Emit the message back to simulate real-time
    setTimeout(() => {
      this.emit('new-message', fullMessage);
    }, 100);

    // Simulate auto-reply from other user after a delay
    this.simulateAutoReply(message.conversationId);
  }

  // Mark messages as read
  markAsRead(messageIds: string[]): void {
    console.log('Mock Socket: Marking messages as read', messageIds);
    
    // Update mock messages
    Object.values(mockMessages).forEach(messages => {
      messages.forEach(message => {
        if (messageIds.includes(message.id)) {
          message.isRead = true;
        }
      });
    });

    // Emit read confirmation
    setTimeout(() => {
      this.emit('message-read', messageIds);
    }, 50);
  }

  // Simulate auto-reply from other users
  private simulateAutoReply(conversationId: string): void {
    // Get the other participant in this conversation
    const messages = mockMessages[conversationId];
    if (!messages || messages.length === 0) return;

    // Find a message from another user to determine who should reply
    const otherUserMessage = messages.find(msg => msg.senderId !== currentUser.id);
    if (!otherUserMessage) return;

    const otherUserId = otherUserMessage.senderId;
    const otherUser = mockUsers.find(user => user.id === otherUserId);
    
    if (!otherUser || !otherUser.isOnline) return;

    // Random delay between 2-8 seconds for auto-reply
    const delay = Math.random() * 6000 + 2000;
    
    const timeout = setTimeout(() => {
      const autoReplyMessage: Message = {
        id: generateMessageId(),
        content: getRandomAutoReply(),
        senderId: otherUserId,
        conversationId,
        timestamp: new Date(),
        isRead: false,
      };

      // Add to mock messages
      mockMessages[conversationId].push(autoReplyMessage);

      // Emit the auto-reply
      this.emit('new-message', autoReplyMessage);
    }, delay);

    this.autoReplyTimeouts.push(timeout);
  }

  // Simulate random user status changes (unused for now)
  // private simulateUserStatusChanges(): void {
  //   setInterval(() => {
  //     if (!this.connected) return;

  //     // Randomly change a user's online status
  //     const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
  //     const wasOnline = randomUser.isOnline;
      
  //     // 20% chance to change status
  //     if (Math.random() < 0.2) {
  //       randomUser.isOnline = !randomUser.isOnline;
        
  //       if (randomUser.isOnline !== wasOnline) {
  //         const event = randomUser.isOnline ? 'user-online' : 'user-offline';
  //         this.emit(event, randomUser.id);
  //       }
  //     }
  //   }, 10000); // Check every 10 seconds
  // }

  // Generic event listener management
  private addEventListener(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)?.push(callback);
  }

  removeEventListener(event: string, callback: (...args: any[]) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  private emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in mock socket event ${event}:`, error);
        }
      });
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Public event listener methods
  onNewMessage(callback: (message: Message) => void): void {
    this.addEventListener('new-message', callback);
  }

  onMessageRead(callback: (messageIds: string[]) => void): void {
    this.addEventListener('message-read', callback);
  }

  onUserOnline(callback: (userId: string) => void): void {
    this.addEventListener('user-online', callback);
  }

  onUserOffline(callback: (userId: string) => void): void {
    this.addEventListener('user-offline', callback);
  }

  onConversationUpdated(callback: (conversation: any) => void): void {
    this.addEventListener('conversation-updated', callback);
  }
}

export const mockSocketService = new MockSocketService();
