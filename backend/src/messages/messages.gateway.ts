import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from './messages.service';
import { AuthService } from '../auth/auth.service';
import { CreateMessageDto } from './dto/message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/chat',
})
export class MessagesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private userCurrentConversations = new Map<string, string>(); // userId -> currentConversationId

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  afterInit(server: Server) {
    this.server = server;
    this.logger.log('WebSocket Gateway initialized with server instance');
    this.logger.log('Server instance details:', {
      hasServer: !!this.server,
      hasSockets: !!this.server?.sockets,
      hasAdapter: !!this.server?.sockets?.adapter,
      hasRooms: !!this.server?.sockets?.adapter?.rooms
    });
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token = this.extractTokenFromSocket(client);
      
      if (!token) {
        this.logger.warn('Connection rejected - no token provided');
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.user = {
        id: payload.sub,
        username: payload.username,
        email: payload.email,
      };

      // Store user connection
      this.connectedUsers.set(client.id, client.userId!);
      
      if (!this.userSockets.has(client.userId!)) {
        this.userSockets.set(client.userId!, new Set());
      }
      this.userSockets.get(client.userId!)!.add(client.id);

      this.logger.log(`User ${client.user.username} connected with socket ${client.id}`);
      
      // Update user online status in database
      await this.authService.updateOnlineStatus(client.userId!, true);
      
      // Automatically join user to all their conversation rooms
      await this.joinUserToAllConversations(client);
      
      // Notify other users that this user is online
      client.broadcast.emit('userOnline', {
        userId: client.userId,
        username: client.user.username,
        timestamp: new Date().toISOString(),
      });

      // Send current online users to the newly connected user
      const onlineUsers = Array.from(this.connectedUsers.values());
      client.emit('onlineUsers', onlineUsers);

    } catch (error) {
      this.logger.error('Connection failed:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.logger.log(`User ${client.user?.username} disconnected`);
      
      // Remove from connected users
      this.connectedUsers.delete(client.id);
      
      const userSockets = this.userSockets.get(client.userId);
      if (userSockets) {
        userSockets.delete(client.id);
        
        // If user has no more connections, mark as offline
        if (userSockets.size === 0) {
          this.userSockets.delete(client.userId);
          
          // Update user offline status in database
          await this.authService.updateOnlineStatus(client.userId, false);
          
          // Notify other users that this user is offline
          client.broadcast.emit('userOffline', {
            userId: client.userId,
            username: client.user?.username,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      const { conversationId } = data;
      
      // Verify user is participant in conversation
      const isParticipant = await this.messagesService.isUserParticipant(
        client.userId,
        conversationId,
      );

      if (!isParticipant) {
        client.emit('error', { message: 'Not a participant in this conversation' });
        return;
      }

      // Join the conversation room
      await client.join(`conversation:${conversationId}`);
      
      // Track which conversation the user is currently viewing
      this.userCurrentConversations.set(client.userId, conversationId);
      
      this.logger.log(`User ${client.userId} joined conversation ${conversationId}`);
      
      client.emit('joinedConversation', { conversationId });
      
      // Notify other participants
      client.to(`conversation:${conversationId}`).emit('userJoinedConversation', {
        userId: client.userId,
        username: client.user?.username,
        conversationId,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error('Error joining conversation:', error);
      client.emit('error', { message: 'Failed to join conversation' });
    }
  }

  @SubscribeMessage('leaveConversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    try {
      if (!client.userId) {
        return;
      }

      const { conversationId } = data;
      
      await client.leave(`conversation:${conversationId}`);
      
      // Remove the user's current conversation tracking
      const currentConversation = this.userCurrentConversations.get(client.userId);
      if (currentConversation === conversationId) {
        this.userCurrentConversations.delete(client.userId);
      }
      
      this.logger.log(`User ${client.userId} left conversation ${conversationId}`);
      
      client.emit('leftConversation', { conversationId });
      
      // Notify other participants
      client.to(`conversation:${conversationId}`).emit('userLeftConversation', {
        userId: client.userId,
        username: client.user?.username,
        conversationId,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error('Error leaving conversation:', error);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() createMessageDto: CreateMessageDto,
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      // Create message using the service
      const messageResponse = await this.messagesService.createMessage(
        client.userId,
        createMessageDto,
      );

      const message = messageResponse.data;
      
      this.logger.log(`Created message:`, {
        id: message.id,
        content: message.content,
        senderId: message.sender?.id,
        conversationId: message.conversationId
      });

      // Emit to all participants EXCEPT the sender
      const emitData = {
        message,
        conversationId: createMessageDto.conversationId,
        timestamp: new Date().toISOString(),
      };
      
      // Send confirmation to sender with tempId for message replacement
      const senderConfirmation = {
        message,
        conversationId: createMessageDto.conversationId,
        timestamp: new Date().toISOString(),
        tempId: createMessageDto.tempId, // Pass back the tempId for tracking
      };
      
      this.logger.log(`Emitting message to conversation ${createMessageDto.conversationId}:`, {
        senderId: client.userId,
        tempId: createMessageDto.tempId,
        messageId: message.id,
        content: createMessageDto.content
      });
      
      // Send to all participants except sender
      this.logger.log(`Sending newMessage to conversation ${createMessageDto.conversationId} (excluding sender ${client.userId})`);
      
      // Get all sockets in the conversation room for debugging
      try {
        this.logger.log('Checking server instance for room access:', {
          hasServer: !!this.server,
          hasSockets: !!this.server?.sockets,
          hasAdapter: !!this.server?.sockets?.adapter,
          hasRooms: !!this.server?.sockets?.adapter?.rooms
        });
        
        if (this.server && this.server.sockets && this.server.sockets.adapter && this.server.sockets.adapter.rooms) {
          const room = this.server.sockets.adapter.rooms.get(`conversation:${createMessageDto.conversationId}`);
          this.logger.log(`Room conversation:${createMessageDto.conversationId} has ${room?.size || 0} sockets`);
          
          if (room && room.size > 0) {
            this.logger.log(`Sockets in room: ${Array.from(room).join(', ')}`);
            
            // Log which users are in the room
            const userIdsInRoom = Array.from(room).map(socketId => {
              const socket = this.server.sockets.sockets.get(socketId) as AuthenticatedSocket;
              return socket?.userId || 'unknown';
            });
            this.logger.log(`User IDs in room: ${userIdsInRoom.join(', ')}`);
          } else {
            this.logger.warn(`No sockets found in room conversation:${createMessageDto.conversationId}`);
            
            // If no one is in the room, try to get all participants and join them
            this.logger.log(`Attempting to auto-join all participants to conversation ${createMessageDto.conversationId}`);
            await this.autoJoinConversationParticipants(createMessageDto.conversationId);
          }
        } else {
          this.logger.warn('Server instance not properly initialized, skipping room check');
        }
      } catch (error) {
        this.logger.warn('Error getting room info:', error.message);
      }
      
      // Try room-based broadcasting first
      client.to(`conversation:${createMessageDto.conversationId}`)
        .emit('newMessage', emitData);
      
      // Also try direct user-based broadcasting as fallback
      try {
        const participants = await this.messagesService.getConversationParticipants(createMessageDto.conversationId);
        if (participants.success && participants.data) {
          this.logger.log(`Direct broadcasting to ${participants.data.length} participants`);
          for (const participant of participants.data) {
            if (participant.userId !== client.userId) { // Don't send to sender
              const userSockets = this.userSockets.get(participant.userId);
              if (userSockets) {
                this.logger.log(`User ${participant.userId} has ${userSockets.size} sockets, attempting direct broadcast`);
                
                // Try to send directly to each socket
                for (const socketId of userSockets) {
                  try {
                    // Use the client socket to emit to the specific socket
                    // This is a workaround for the server instance issues
                    if (this.server && this.server.sockets && this.server.sockets.sockets) {
                      const socket = this.server.sockets.sockets.get(socketId) as AuthenticatedSocket;
                      if (socket) {
                        this.logger.log(`Direct sending to user ${participant.userId} (socket ${socketId})`);
                        socket.emit('newMessage', emitData);
                      }
                    } else {
                      // Fallback: use client.to() to broadcast to all sockets of this user
                      this.logger.log(`Server not available, using client.to() for user ${participant.userId}`);
                      client.to(socketId).emit('newMessage', emitData);
                    }
                  } catch (socketError) {
                    this.logger.warn(`Error sending to socket ${socketId}:`, socketError.message);
                  }
                }
              } else {
                this.logger.warn(`No sockets found for user ${participant.userId}`);
              }
            }
          }
        }
      } catch (error) {
        this.logger.warn('Error in direct broadcasting:', error.message);
      }
      
      // Send confirmation to sender
      this.logger.log(`Sending messageSent confirmation to sender ${client.userId} with tempId: ${createMessageDto.tempId}`);
      client.emit('messageSent', senderConfirmation);

      // Check if any recipients are currently viewing this conversation and send immediate read receipt
      this.logger.log(`Checking for immediate read receipt for conversation ${createMessageDto.conversationId}`);
      try {
        const participants = await this.messagesService.getConversationParticipants(createMessageDto.conversationId);
        this.logger.log(`Found ${participants.data?.length || 0} participants for immediate read receipt check`);
        
        if (participants.success && participants.data) {
          for (const participant of participants.data) {
            if (participant.userId !== client.userId) { // Don't send to sender
              this.logger.log(`Checking if user ${participant.userId} is viewing conversation ${createMessageDto.conversationId}`);
              
              const userSockets = this.userSockets.get(participant.userId);
              this.logger.log(`User ${participant.userId} has ${userSockets?.size || 0} sockets`);
              
              if (userSockets) {
                this.logger.log(`User ${participant.userId} has ${userSockets.size} sockets`);
                
                // Check if this user is currently viewing this specific conversation
                const currentConversation = this.userCurrentConversations.get(participant.userId);
                this.logger.log(`User ${participant.userId} current conversation: ${currentConversation}`);
                
                if (currentConversation === createMessageDto.conversationId) {
                  this.logger.log(`User ${participant.userId} is currently viewing conversation ${createMessageDto.conversationId}, sending immediate read receipt`);
                  
                  // Send immediate read receipt to the sender
                  const immediateReadReceipt = {
                    messageIds: [message.id],
                    readBy: participant.userId,
                    username: participant.userId, // We'll need to get the actual username
                    conversationId: createMessageDto.conversationId,
                    timestamp: new Date().toISOString(),
                  };
                  
                  // Send read receipt to sender
                  client.emit('messagesRead', immediateReadReceipt);
                  this.logger.log(`Immediate read receipt sent to sender ${client.userId} for message ${message.id}`);
                  break; // Only send one read receipt per user
                } else {
                  this.logger.log(`User ${participant.userId} is NOT currently viewing conversation ${createMessageDto.conversationId} (viewing: ${currentConversation})`);
                }
              } else {
                this.logger.log(`No sockets found for user ${participant.userId}`);
              }
            }
          }
        }
      } catch (error) {
        this.logger.warn('Error sending immediate read receipt:', error.message);
      }

      this.logger.log(`Message sent by ${client.userId} to conversation ${createMessageDto.conversationId}`);

    } catch (error) {
      this.logger.error('Error sending message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageIds: string[]; conversationId: string },
  ) {
    try {
      if (!client.userId) {
        this.logger.warn('markAsRead: No user ID in client');
        return;
      }

      const { messageIds, conversationId } = data;
      
      this.logger.log(`markAsRead: Received request from user ${client.userId}`, {
        messageIds,
        conversationId,
        messageCount: messageIds.length,
        timestamp: new Date().toISOString()
      });

      // Mark messages as read using the service
      this.logger.log(`markAsRead: Calling service to mark messages as read`);
      const result = await this.messagesService.markMessagesAsRead(client.userId, {
        messageIds,
      });
      
      this.logger.log(`markAsRead: Service result:`, {
        success: result.success,
        markedCount: result.data?.markedCount,
        messageIds: result.data?.messageIds
      });
      
      if (!result.success) {
        this.logger.error('markAsRead: Service returned failure:', result);
        return;
      }

      // Notify other participants that messages were read
      try {
        const readReceiptData = {
          messageIds,
          readBy: client.userId,
          username: client.user?.username,
          conversationId,
          timestamp: new Date().toISOString(),
        };
        
          // Get room info safely
          let recipientCount = 0;
          try {
            if (this.server && this.server.sockets && this.server.sockets.adapter && this.server.sockets.adapter.rooms) {
              const room = this.server.sockets.adapter.rooms.get(`conversation:${conversationId}`);
              recipientCount = room?.size || 0;
            } else {
              this.logger.warn('markAsRead: Server instance not properly initialized for room access');
            }
          } catch (roomError) {
            this.logger.warn('markAsRead: Could not get room info:', roomError.message);
          }
        
        this.logger.log(`markAsRead: Sending read receipt to conversation ${conversationId}:`, {
          messageIds,
          readBy: client.userId,
          username: client.user?.username,
          recipientCount
        });
        
          // Send read receipt to ALL participants in the conversation (including the sender)
          // This allows the sender to see double checkmarks when their messages are read
          try {
            if (this.server && this.server.sockets && this.server.sockets.adapter && this.server.sockets.adapter.rooms) {
              this.server.to(`conversation:${conversationId}`).emit('messagesRead', readReceiptData);
              this.logger.log(`markAsRead: Read receipt emitted via server.to() to conversation ${conversationId}`);
            } else {
              // Fallback: use client socket to broadcast to room
              client.to(`conversation:${conversationId}`).emit('messagesRead', readReceiptData);
              this.logger.log(`markAsRead: Read receipt emitted via client.to() to conversation ${conversationId}`);
            }
            
            // Also try direct user-based broadcasting as additional fallback
            try {
              const participants = await this.messagesService.getConversationParticipants(conversationId);
              if (participants.success && participants.data) {
                this.logger.log(`markAsRead: Direct broadcasting read receipt to ${participants.data.length} participants`);
                for (const participant of participants.data) {
                  const userSockets = this.userSockets.get(participant.userId);
                  if (userSockets && this.server && this.server.sockets && this.server.sockets.sockets) {
                    for (const socketId of userSockets) {
                      const socket = this.server.sockets.sockets.get(socketId) as AuthenticatedSocket;
                      if (socket) {
                        this.logger.log(`markAsRead: Direct sending read receipt to user ${participant.userId} (socket ${socketId})`);
                        socket.emit('messagesRead', readReceiptData);
                      }
                    }
                  }
                }
              }
            } catch (directError) {
              this.logger.warn('markAsRead: Error in direct read receipt broadcasting:', directError.message);
            }
          } catch (emitError) {
            this.logger.error('markAsRead: Error during read receipt emission:', {
              error: emitError.message,
              conversationId,
              hasServer: !!this.server
            });
            throw emitError; // Re-throw to be caught by outer catch
          }

        this.logger.log(`markAsRead: Read receipt sent successfully for ${messageIds.length} messages`);
      } catch (receiptError) {
        this.logger.error('markAsRead: Error sending read receipt:', {
          error: receiptError.message,
          stack: receiptError.stack,
          conversationId,
          messageIds,
          readBy: client.userId
        });
        // Don't throw - the main operation was successful
      }

    } catch (error) {
      this.logger.error('Error marking messages as read:', {
        error: error.message,
        stack: error.stack,
        userId: client.userId,
        messageIds: data?.messageIds,
        conversationId: data?.conversationId
      });
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    try {
      if (!client.userId) {
        return;
      }

      const { conversationId, isTyping } = data;

      // Broadcast typing status to other participants
      client.to(`conversation:${conversationId}`).emit('userTyping', {
        userId: client.userId,
        username: client.user?.username,
        conversationId,
        isTyping,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error('Error handling typing status:', error);
    }
  }

  // Helper method to extract token from socket handshake
  private extractTokenFromSocket(client: Socket): string | null {
    // Try to get token from Authorization header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try to get token from query parameters
    const token = client.handshake.query.token as string;
    if (token) {
      return token;
    }

    // Try to get token from auth object
    const authToken = client.handshake.auth?.token;
    if (authToken) {
      return authToken;
    }

    return null;
  }

  // Public method to emit events from other services
  async emitToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }

  async emitToUser(userId: string, event: string, data: any) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.forEach(socketId => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  // Get online users
  getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.values());
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  // Automatically join user to all their conversation rooms
  private async joinUserToAllConversations(client: AuthenticatedSocket) {
    try {
      if (!client.userId) {
        this.logger.warn('Cannot join conversations: user ID not available');
        return;
      }

      // Get all conversations for this user
      const conversations = await this.messagesService.getUserConversations(client.userId);
      
      this.logger.log(`Auto-joining conversations for user ${client.userId}:`, {
        success: conversations.success,
        conversationCount: conversations.data?.length || 0,
        conversationIds: conversations.data?.map(c => c.id) || []
      });
      
      if (conversations.success && conversations.data) {
        for (const conversation of conversations.data) {
          try {
            await client.join(`conversation:${conversation.id}`);
            this.logger.log(`User ${client.userId} auto-joined conversation ${conversation.id}`);
          } catch (error) {
            this.logger.warn(`Failed to auto-join conversation ${conversation.id}:`, error.message);
          }
        }
        this.logger.log(`User ${client.userId} auto-joined ${conversations.data.length} conversations`);
      } else {
        this.logger.warn(`Failed to get conversations for user ${client.userId}:`, conversations.error);
      }
    } catch (error) {
      this.logger.error('Error auto-joining conversations:', error);
    }
  }

  // Auto-join all participants of a conversation to the room
  private async autoJoinConversationParticipants(conversationId: string) {
    try {
      // Get all participants of this conversation
      const participants = await this.messagesService.getConversationParticipants(conversationId);
      
      if (participants.success && participants.data) {
        this.logger.log(`Auto-joining ${participants.data.length} participants to conversation ${conversationId}`);
        
        for (const participant of participants.data) {
          const userSockets = this.userSockets.get(participant.userId);
          if (userSockets && this.server && this.server.sockets && this.server.sockets.sockets) {
            for (const socketId of userSockets) {
              const socket = this.server.sockets.sockets.get(socketId) as AuthenticatedSocket;
              if (socket) {
                try {
                  await socket.join(`conversation:${conversationId}`);
                  this.logger.log(`Auto-joined user ${participant.userId} (socket ${socketId}) to conversation ${conversationId}`);
                } catch (error) {
                  this.logger.warn(`Failed to auto-join user ${participant.userId} to conversation ${conversationId}:`, error.message);
                }
              }
            }
          } else {
            this.logger.warn(`No sockets found for user ${participant.userId} or server not initialized`);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error auto-joining conversation participants:', error);
    }
  }
}
