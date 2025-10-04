import { 
  Injectable, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException,
  ConflictException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
  constructor(private prisma: PrismaService) {}

  async createMessage(userId: string, createMessageDto: CreateMessageDto): Promise<MessageCreatedResponse> {
    const { content, conversationId, messageType } = createMessageDto;

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

    return {
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

    if (accessibleMessages.length === 0) {
      throw new ForbiddenException('No accessible messages found');
    }

    // Mark messages as read
    const updateResult = await this.prisma.message.updateMany({
      where: {
        id: { in: accessibleMessages.map(m => m.id) },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

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

    return {
      success: true,
      message: 'Messages marked as read successfully',
      data: {
        markedCount: updateResult.count,
        messageIds: accessibleMessages.map(m => m.id),
      },
    };
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

    return this.mapConversationToResponse(conversation, userId);
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
    const unreadCount = userParticipant ? 
      Math.max(0, conversation.messages.length - (userParticipant.lastReadAt ? 1 : 0)) : 0;

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
    const unreadCount = userParticipant ? 
      Math.max(0, conversation.messages.length - (userParticipant.lastReadAt ? 1 : 0)) : 0;

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
}
