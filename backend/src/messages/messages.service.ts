import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException,
  ConflictException,
  Logger 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../config/redis.config';
import { 
  CreateMessageDto, 
  UpdateMessageDto, 
  MarkMessagesAsReadDto,
  GetMessagesQueryDto,
  CreateConversationDto,
  GetConversationsQueryDto 
} from './dto/message.dto';
import {
  MessageResponse,
  ConversationResponse,
  ConversationPreviewResponse,
  PaginatedMessagesResponse,
  PaginatedConversationsResponse,
  MessageCreatedResponse,
  ConversationCreatedResponse,
  MessagesMarkedAsReadResponse,
} from './interfaces/message.interface';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly PARTICIPANT_CACHE_TTL = 600; // 10 minutes
  private readonly USER_CACHE_TTL = 1800; // 30 minutes
  private readonly CONVERSATION_CACHE_TTL = 600; // 10 minutes
  private readonly MESSAGE_CACHE_TTL = 120; // 2 minutes
  private readonly ONLINE_USERS_CACHE_TTL = 60; // 1 minute

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async createMessage(userId: string, createMessageDto: CreateMessageDto): Promise<MessageCreatedResponse> {
    const { content, conversationId, messageType } = createMessageDto;

    this.logger.log(`Message creation request from user: ${userId} to conversation: ${conversationId}`);

    // Check if user is a participant in the conversation
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: {
        userId,
        conversationId,
      },
    });

    if (!participant) {
      this.logger.warn(`Message creation failed - user not participant: ${userId} in conversation: ${conversationId}`);
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    // Create the message
    const message = await this.prisma.message.create({
      data: {
        content,
        messageType: messageType || 'text',
        senderId: userId,
        conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // Update conversation's updatedAt timestamp
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Invalidate relevant caches with pattern-based deletion
    await Promise.all([
      this.redisService.delPattern(`conversation:${conversationId}*`),
      this.redisService.delPattern(`participants:${conversationId}*`),
      this.redisService.delPattern(`messages:${conversationId}*`),
      this.redisService.delPattern(`user_conversations:${userId}*`),
      // Invalidate conversation cache for all participants
      this.invalidateConversationCacheForParticipants(conversationId),
      // Update online users cache
      this.updateOnlineUsersCache(),
    ]);

    this.logger.log(`Message created successfully: ${message.id} by user: ${userId} in conversation: ${conversationId}`);

    return {
      success: true,
      message: 'Message created successfully',
      data: this.mapMessageToResponse(message),
    };
  }

  async getMessages(
    userId: string,
    conversationId: string,
    query: GetMessagesQueryDto,
  ): Promise<PaginatedMessagesResponse> {
    const { page = 1, limit = 20, cursor } = query;

    // Check cache first for messages
    const cacheKey = `messages:${conversationId}:${userId}:${page}:${limit}:${cursor || 'no-cursor'}`;
    const cachedMessages = await this.redisService.get<PaginatedMessagesResponse>(cacheKey);
    
    if (cachedMessages) {
      this.logger.log(`getMessages: Cache hit for conversation ${conversationId}`);
      return cachedMessages;
    }

    // Check if user is a participant in the conversation
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: {
        userId,
        conversationId,
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    // Validate pagination parameters
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(Math.max(1, limit), 100);
    const skip = (validatedPage - 1) * validatedLimit;

    // Build where clause for cursor-based pagination
    const whereClause: any = {
      conversationId,
      isDeleted: false,
    };

    if (cursor) {
      whereClause.id = { lt: cursor };
    }

    // Get messages with pagination
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: whereClause,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: validatedLimit + 1, // Take one extra to check if there are more
        skip: cursor ? 0 : skip,
      }),
      this.prisma.message.count({
        where: {
          conversationId,
          isDeleted: false,
        },
      }),
    ]);

    // Check if there are more messages
    const hasNext = messages.length > validatedLimit;
    if (hasNext) {
      messages.pop(); // Remove the extra message
    }

    const totalPages = Math.ceil(total / validatedLimit);
    const nextCursor = hasNext ? messages[messages.length - 1]?.id : undefined;

    const result = {
      success: true,
      message: 'Messages retrieved successfully',
      data: messages.map(message => this.mapMessageToResponse(message)),
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        totalPages,
        hasNext,
        hasPrevious: validatedPage > 1,
        cursor: nextCursor,
      },
    };

    // Cache the result for 2 minutes (shorter TTL for messages as they change frequently)
    await this.redisService.set(cacheKey, result, 120);

    return result;
  }

  async updateMessage(
    userId: string,
    messageId: string,
    updateMessageDto: UpdateMessageDto,
  ): Promise<MessageCreatedResponse> {
    const { content } = updateMessageDto;

    // Find the message and check ownership
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: userId,
        isDeleted: false,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found or you do not have permission to edit it');
    }

    // Check if message is too old to edit (e.g., 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
      throw new BadRequestException('Message is too old to edit');
    }

    // Update the message
    const updatedMessage = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
        updatedAt: new Date(),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Message updated successfully',
      data: this.mapMessageToResponse(updatedMessage),
    };
  }

  async deleteMessage(userId: string, messageId: string): Promise<{ success: boolean; message: string }> {
    // Find the message and check ownership
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: userId,
        isDeleted: false,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found or you do not have permission to delete it');
    }

    // Soft delete the message
    await this.prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        content: 'This message was deleted',
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Message deleted successfully',
    };
  }

  async markMessagesAsRead(
    userId: string,
    markAsReadDto: MarkMessagesAsReadDto,
  ): Promise<MessagesMarkedAsReadResponse> {
    const { messageIds } = markAsReadDto;
    
    this.logger.log(`markMessagesAsRead: Processing request for user ${userId}`, {
      messageIds,
      messageCount: messageIds.length
    });

    // Check if this operation is already in progress to prevent duplicates
    const operationKey = `mark_read:${userId}:${messageIds.sort().join(',')}`;
    const isInProgress = await this.redisService.exists(operationKey);
    
    if (isInProgress) {
      this.logger.log(`markMessagesAsRead: Operation already in progress for user ${userId}, skipping`);
      return {
        success: true,
        message: 'Messages already being processed',
        data: {
          markedCount: 0,
          messageIds: [],
        },
      };
    }

    // Set operation lock for 30 seconds
    await this.redisService.set(operationKey, true, 30);

    try {
      // Verify that all messages belong to conversations where the user is a participant
      const messages = await this.prisma.message.findMany({
        where: {
          id: { in: messageIds },
          isDeleted: false,
        },
        include: {
          conversation: {
            include: {
              participants: {
                where: { userId },
              },
            },
          },
        },
      });

      // Filter messages that the user has access to
      const accessibleMessages = messages.filter(message => 
        message.conversation.participants.length > 0
      );

      this.logger.log(`markMessagesAsRead: Found ${messages.length} messages, ${accessibleMessages.length} accessible`);

      if (accessibleMessages.length === 0) {
        this.logger.warn(`markMessagesAsRead: No accessible messages found for user ${userId}`);
        throw new ForbiddenException('No accessible messages found');
      }

      // Mark messages as read (only update if not already read)
      this.logger.log(`markMessagesAsRead: Updating ${accessibleMessages.length} messages to isRead=true`);
      const updateResult = await this.prisma.message.updateMany({
        where: {
          id: { in: accessibleMessages.map(m => m.id) },
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
      
      this.logger.log(`markMessagesAsRead: Updated ${updateResult.count} messages in database`);
      
      // Update lastReadAt for the user in each conversation
      const conversationIds = [...new Set(accessibleMessages.map(m => m.conversationId))];
      
      await Promise.all(
        conversationIds.map(conversationId =>
          this.prisma.conversationParticipant.updateMany({
            where: {
              userId,
              conversationId,
            },
            data: {
              lastReadAt: new Date(),
            },
          })
        )
      );

      // Invalidate conversation cache for affected conversations
      await Promise.all(
        conversationIds.map(conversationId =>
          this.redisService.del(`conversation:${conversationId}`)
        )
      );

      this.logger.log(`markMessagesAsRead: Successfully completed for user ${userId}`, {
        markedCount: updateResult.count,
        messageIds: accessibleMessages.map(m => m.id)
      });

      return {
        success: true,
        message: 'Messages marked as read successfully',
        data: {
          markedCount: updateResult.count,
          messageIds: accessibleMessages.map(m => m.id),
        },
      };
    } finally {
      // Remove operation lock
      await this.redisService.del(operationKey);
    }
  }

  async createConversation(
    userId: string,
    createConversationDto: CreateConversationDto,
  ): Promise<ConversationCreatedResponse> {
    const { participantIds } = createConversationDto;

    // Add current user to participants
    const allParticipantIds = [...new Set([userId, ...participantIds])];

    if (allParticipantIds.length < 2) {
      throw new BadRequestException('Conversation must have at least 2 participants');
    }

    // Check if all participants exist
    const existingUsers = await this.prisma.user.findMany({
      where: {
        id: { in: allParticipantIds },
      },
      select: { id: true },
    });

    if (existingUsers.length !== allParticipantIds.length) {
      throw new NotFoundException('One or more participants not found');
    }

    // Check if a conversation between these exact participants already exists
    const existingConversation = await this.findExistingConversation(allParticipantIds);
    if (existingConversation) {
      return {
        success: true,
        message: 'Conversation already exists',
        data: await this.getConversationById(userId, existingConversation.id),
      };
    }

    // Create conversation with participants
    const conversation = await this.prisma.conversation.create({
      data: {
        participants: {
          create: allParticipantIds.map(participantId => ({
            userId: participantId,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      message: 'Conversation created successfully',
      data: this.mapConversationToResponse(conversation, userId),
    };
  }

  async getConversations(
    userId: string,
    query: GetConversationsQueryDto,
  ): Promise<PaginatedConversationsResponse> {
    const { page = 1, limit = 10 } = query;

    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(Math.max(1, limit), 50);
    const skip = (validatedPage - 1) * validatedLimit;

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: {
          participants: {
            some: { userId },
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                  isOnline: true,
                  lastSeen: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: validatedLimit,
      }),
      this.prisma.conversation.count({
        where: {
          participants: {
            some: { userId },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / validatedLimit);

    return {
      success: true,
      message: 'Conversations retrieved successfully',
      data: conversations.map(conversation => this.mapConversationToPreview(conversation, userId)),
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        totalPages,
        hasNext: validatedPage < totalPages,
        hasPrevious: validatedPage > 1,
      },
    };
  }

  async getConversationById(userId: string, conversationId: string): Promise<ConversationResponse> {
    // Check cache first
    const cacheKey = `conversation:${conversationId}:${userId}`;
    const cachedConversation = await this.redisService.get<ConversationResponse>(cacheKey);
    
    if (cachedConversation) {
      this.logger.log(`getConversationById: Cache hit for conversation ${conversationId}`);
      return cachedConversation;
    }

    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const result = this.mapConversationToResponse(conversation, userId);
    
    // Cache the result for 5 minutes
    await this.redisService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  private async findExistingConversation(participantIds: string[]) {
    // Find conversations that have exactly these participants
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          every: {
            userId: { in: participantIds },
          },
        },
      },
      include: {
        participants: true,
      },
    });

    // Filter to find exact match
    return conversations.find(conversation => 
      conversation.participants.length === participantIds.length &&
      conversation.participants.every(p => participantIds.includes(p.userId))
    );
  }

  private mapMessageToResponse(message: any): MessageResponse {
    return {
      id: message.id,
      content: message.content,
      messageType: message.messageType,
      isRead: message.isRead,
      isEdited: message.isEdited,
      isDeleted: message.isDeleted,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      senderId: message.senderId, // Add senderId for frontend compatibility
      status: message.isRead ? 'read' : 'sent', // Add status field for frontend
      sender: {
        id: message.sender.id,
        username: message.sender.username,
        avatar: message.sender.avatar,
      },
      conversationId: message.conversationId,
    };
  }

  private mapConversationToResponse(conversation: any, userId: string): ConversationResponse {
    const otherParticipants = conversation.participants
      .filter((p: any) => p.userId !== userId)
      .map((p: any) => ({
        id: p.user.id,
        username: p.user.username,
        avatar: p.user.avatar,
        isOnline: p.user.isOnline,
        lastSeen: p.user.lastSeen,
        joinedAt: p.joinedAt,
        lastReadAt: p.lastReadAt,
      }));

    const lastMessage = conversation.messages[0] 
      ? this.mapMessageToResponse(conversation.messages[0])
      : undefined;

    // Calculate unread count for the current user
    const userParticipant = conversation.participants.find((p: any) => p.userId === userId);
    let unreadCount = 0;
    
    if (userParticipant && conversation.messages.length > 0) {
      // Count messages that are not read by the current user
      unreadCount = conversation.messages.filter((message: any) => {
        // Message is unread if:
        // 1. It's not from the current user AND
        // 2. It was created after the user's lastReadAt timestamp
        const isFromOtherUser = message.senderId !== userId;
        const isAfterLastRead = !userParticipant.lastReadAt || 
          new Date(message.createdAt) > new Date(userParticipant.lastReadAt);
        
        return isFromOtherUser && isAfterLastRead;
      }).length;
    }

    return {
      id: conversation.id,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      participants: otherParticipants,
      lastMessage,
      unreadCount,
    };
  }

  private mapConversationToPreview(conversation: any, userId: string): ConversationPreviewResponse {
    const otherParticipant = conversation.participants
      .find((p: any) => p.userId !== userId);

    if (!otherParticipant) {
      throw new Error('No other participant found in conversation');
    }

    const lastMessage = conversation.messages[0] ? {
      id: conversation.messages[0].id,
      content: conversation.messages[0].content,
      messageType: conversation.messages[0].messageType,
      createdAt: conversation.messages[0].createdAt,
      senderId: conversation.messages[0].senderId,
    } : undefined;

    // Calculate unread count
    const userParticipant = conversation.participants.find((p: any) => p.userId === userId);
    let unreadCount = 0;
    
    if (userParticipant && conversation.messages.length > 0) {
      // Count messages that are not read by the current user
      unreadCount = conversation.messages.filter((message: any) => {
        // Message is unread if:
        // 1. It's not from the current user AND
        // 2. It was created after the user's lastReadAt timestamp
        const isFromOtherUser = message.senderId !== userId;
        const isAfterLastRead = !userParticipant.lastReadAt || 
          new Date(message.createdAt) > new Date(userParticipant.lastReadAt);
        
        return isFromOtherUser && isAfterLastRead;
      }).length;
    }

    return {
      id: conversation.id,
      otherParticipant: {
        id: otherParticipant.user.id,
        username: otherParticipant.user.username,
        avatar: otherParticipant.user.avatar,
        isOnline: otherParticipant.user.isOnline,
        lastSeen: otherParticipant.user.lastSeen,
      },
      lastMessage,
      unreadCount,
      updatedAt: conversation.updatedAt,
    };
  }

  async isUserParticipant(userId: string, conversationId: string): Promise<boolean> {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: {
        userId,
        conversationId,
      },
    });

    return !!participant;
  }

  // Get all conversations for a user (for auto-joining rooms)
  async getUserConversations(userId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const conversations = await this.prisma.conversation.findMany({
        where: {
          participants: {
            some: {
              userId,
            },
          },
        },
        select: {
          id: true,
        },
      });

      return {
        success: true,
        data: conversations,
      };
    } catch (error) {
      this.logger.error('Error getting user conversations:', error);
      return {
        success: false,
        error: 'Failed to get user conversations',
      };
    }
  }

  async getConversationParticipants(conversationId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      // Check cache first
      const cacheKey = `participants:${conversationId}`;
      const cachedParticipants = await this.redisService.get<any[]>(cacheKey);
      
      if (cachedParticipants) {
        this.logger.log(`getConversationParticipants: Cache hit for conversation ${conversationId}`);
        return {
          success: true,
          data: cachedParticipants,
        };
      }

      const participants = await this.prisma.conversationParticipant.findMany({
        where: {
          conversationId,
        },
        select: {
          userId: true,
        },
      });

      // Cache the result
      await this.redisService.set(cacheKey, participants, this.PARTICIPANT_CACHE_TTL);

      return {
        success: true,
        data: participants,
      };
    } catch (error) {
      this.logger.error('Error getting conversation participants:', error);
      return {
        success: false,
        error: 'Failed to get conversation participants',
      };
    }
  }

  private async invalidateConversationCacheForParticipants(conversationId: string): Promise<void> {
    try {
      const participants = await this.prisma.conversationParticipant.findMany({
        where: { conversationId },
        select: { userId: true },
      });

      // Invalidate conversation cache for each participant
      await Promise.all(
        participants.map(participant =>
          this.redisService.delPattern(`conversation:${conversationId}:${participant.userId}*`)
        )
      );
    } catch (error) {
      this.logger.error('Error invalidating conversation cache for participants:', error);
    }
  }

  // Advanced caching methods for performance optimization
  async cacheUserConversations(userId: string, conversations: any[]): Promise<void> {
    const cacheKey = `user_conversations:${userId}`;
    await this.redisService.set(cacheKey, conversations, this.USER_CACHE_TTL);
  }

  async getCachedUserConversations(userId: string): Promise<any[] | null> {
    const cacheKey = `user_conversations:${userId}`;
    return await this.redisService.get<any[]>(cacheKey);
  }

  async cacheOnlineUsers(onlineUsers: string[]): Promise<void> {
    const cacheKey = 'online_users';
    await this.redisService.set(cacheKey, onlineUsers, this.ONLINE_USERS_CACHE_TTL);
  }

  async getCachedOnlineUsers(): Promise<string[] | null> {
    const cacheKey = 'online_users';
    return await this.redisService.get<string[]>(cacheKey);
  }

  async updateOnlineUsersCache(): Promise<void> {
    try {
      // Get online users from database
      const onlineUsers = await this.prisma.user.findMany({
        where: { isOnline: true },
        select: { id: true },
      });

      const userIds = onlineUsers.map(user => user.id);
      await this.cacheOnlineUsers(userIds);
    } catch (error) {
      this.logger.error('Error updating online users cache:', error);
    }
  }

  async cacheUserSession(userId: string, sessionData: any): Promise<void> {
    const cacheKey = `user_session:${userId}`;
    await this.redisService.hset('user_sessions', userId, sessionData);
  }

  async getCachedUserSession(userId: string): Promise<any | null> {
    return await this.redisService.hget('user_sessions', userId);
  }

  async removeUserSession(userId: string): Promise<void> {
    await this.redisService.hdel('user_sessions', [userId]);
  }

  async cacheMessage(message: any): Promise<void> {
    const cacheKey = `message:${message.id}`;
    await this.redisService.set(cacheKey, message, this.MESSAGE_CACHE_TTL);
  }

  async getCachedMessage(messageId: string): Promise<any | null> {
    const cacheKey = `message:${messageId}`;
    return await this.redisService.get(cacheKey);
  }

  async cacheConversationMessages(conversationId: string, messages: any[]): Promise<void> {
    const cacheKey = `conversation_messages:${conversationId}`;
    await this.redisService.set(cacheKey, messages, this.MESSAGE_CACHE_TTL);
  }

  async getCachedConversationMessages(conversationId: string): Promise<any[] | null> {
    const cacheKey = `conversation_messages:${conversationId}`;
    return await this.redisService.get<any[]>(cacheKey);
  }

  async cacheUserPresence(userId: string, presenceData: any): Promise<void> {
    const cacheKey = `user_presence:${userId}`;
    await this.redisService.set(cacheKey, presenceData, this.ONLINE_USERS_CACHE_TTL);
  }

  async getCachedUserPresence(userId: string): Promise<any | null> {
    const cacheKey = `user_presence:${userId}`;
    return await this.redisService.get(cacheKey);
  }

  async removeUserPresence(userId: string): Promise<void> {
    const cacheKey = `user_presence:${userId}`;
    await this.redisService.del(cacheKey);
  }

  // Batch operations for better performance
  async batchCacheMessages(messages: any[]): Promise<void> {
    if (messages.length === 0) return;

    const cachePairs: Record<string, any> = {};
    messages.forEach(message => {
      cachePairs[`message:${message.id}`] = message;
    });

    await this.redisService.mset(cachePairs, this.MESSAGE_CACHE_TTL);
  }

  async batchGetCachedMessages(messageIds: string[]): Promise<any[]> {
    if (messageIds.length === 0) return [];

    const cacheKeys = messageIds.map(id => `message:${id}`);
    const cachedMessages = await this.redisService.mget<any>(cacheKeys);
    
    return cachedMessages.filter(message => message !== null);
  }

  // Cache warming methods
  async warmupUserCache(userId: string): Promise<void> {
    try {
      // Warm up user conversations cache
      const conversations = await this.getConversations(userId, { page: 1, limit: 50 });
      if (conversations.success && conversations.data) {
        await this.cacheUserConversations(userId, conversations.data);
      }

      // Warm up user session cache
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          isOnline: true,
          lastSeen: true,
        },
      });

      if (user) {
        await this.cacheUserSession(userId, user);
      }
    } catch (error) {
      this.logger.error(`Error warming up user cache for ${userId}:`, error);
    }
  }

  async warmupConversationCache(conversationId: string): Promise<void> {
    try {
      // Get conversation participants
      const participants = await this.getConversationParticipants(conversationId);
      if (participants.success && participants.data) {
        // Cache participants for each user
        for (const participant of participants.data) {
          await this.redisService.set(
            `participants:${conversationId}:${participant.userId}`,
            participants.data,
            this.PARTICIPANT_CACHE_TTL
          );
        }
      }

      // Get recent messages
      const messages = await this.getMessages(participants.data?.[0]?.userId || '', conversationId, {
        page: 1,
        limit: 20,
      });

      if (messages.success && messages.data) {
        await this.cacheConversationMessages(conversationId, messages.data);
        await this.batchCacheMessages(messages.data);
      }
    } catch (error) {
      this.logger.error(`Error warming up conversation cache for ${conversationId}:`, error);
    }
  }

  // Cache statistics and monitoring
  async getCacheStats(): Promise<any> {
    try {
      const stats = {
        redisConnected: this.redisService.isConnected(),
        ping: await this.redisService.ping(),
        info: await this.redisService.info(),
      };
      return stats;
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return { error: 'Failed to get cache stats' };
    }
  }

  // Cache cleanup methods
  async cleanupExpiredCaches(): Promise<void> {
    try {
      // Redis automatically handles TTL expiration, but we can clean up specific patterns
      const patterns = [
        'user_session:*',
        'user_presence:*',
        'message:*',
        'conversation_messages:*',
      ];

      for (const pattern of patterns) {
        // Get keys matching pattern and check if they're expired
        const keys = await this.redisService.getRedisClient().keys(pattern);
        if (keys.length > 0) {
          // Redis will automatically expire keys based on TTL
          this.logger.log(`Found ${keys.length} keys matching pattern ${pattern}`);
        }
      }
    } catch (error) {
      this.logger.error('Error cleaning up expired caches:', error);
    }
  }
}
