import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('MessagesService', () => {
  let service: MessagesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    conversationParticipant: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    conversation: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMessage', () => {
    const userId = 'user-1';
    const conversationId = 'conv-1';
    const createMessageDto = {
      content: 'Hello world',
      conversationId,
      messageType: 'text' as const,
    };

    it('should create a message successfully', async () => {
      const mockParticipant = { userId, conversationId };
      const mockMessage = {
        id: 'msg-1',
        content: 'Hello world',
        messageType: 'text',
        senderId: userId,
        conversationId,
        isRead: false,
        isEdited: false,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        sender: {
          id: userId,
          username: 'testuser',
          avatar: null,
        },
      };

      mockPrismaService.conversationParticipant.findFirst.mockResolvedValue(mockParticipant);
      mockPrismaService.message.create.mockResolvedValue(mockMessage);
      mockPrismaService.conversation.update.mockResolvedValue({});

      const result = await service.createMessage(userId, createMessageDto);

      expect(result.success).toBe(true);
      expect(result.data.content).toBe('Hello world');
      expect(mockPrismaService.conversationParticipant.findFirst).toHaveBeenCalledWith({
        where: { userId, conversationId },
      });
      expect(mockPrismaService.message.create).toHaveBeenCalledWith({
        data: {
          content: 'Hello world',
          messageType: 'text',
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
    });

    it('should throw ForbiddenException if user is not a participant', async () => {
      mockPrismaService.conversationParticipant.findFirst.mockResolvedValue(null);

      await expect(service.createMessage(userId, createMessageDto))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMessages', () => {
    const userId = 'user-1';
    const conversationId = 'conv-1';
    const query = { page: 1, limit: 20 };

    it('should return paginated messages', async () => {
      const mockParticipant = { userId, conversationId };
      const mockMessages = [
        {
          id: 'msg-1',
          content: 'Hello',
          messageType: 'text',
          senderId: userId,
          conversationId,
          isRead: false,
          isEdited: false,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          sender: {
            id: userId,
            username: 'testuser',
            avatar: null,
          },
        },
      ];

      mockPrismaService.conversationParticipant.findFirst.mockResolvedValue(mockParticipant);
      mockPrismaService.message.findMany.mockResolvedValue(mockMessages);
      mockPrismaService.message.count.mockResolvedValue(1);

      const result = await service.getMessages(userId, conversationId, query);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBe(1);
    });

    it('should throw ForbiddenException if user is not a participant', async () => {
      mockPrismaService.conversationParticipant.findFirst.mockResolvedValue(null);

      await expect(service.getMessages(userId, conversationId, query))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateMessage', () => {
    const userId = 'user-1';
    const messageId = 'msg-1';
    const updateMessageDto = { content: 'Updated message' };

    it('should update a message successfully', async () => {
      const mockMessage = {
        id: messageId,
        content: 'Original message',
        senderId: userId,
        isDeleted: false,
        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      };

      const mockUpdatedMessage = {
        ...mockMessage,
        content: 'Updated message',
        isEdited: true,
        updatedAt: new Date(),
        sender: {
          id: userId,
          username: 'testuser',
          avatar: null,
        },
      };

      mockPrismaService.message.findFirst.mockResolvedValue(mockMessage);
      mockPrismaService.message.update.mockResolvedValue(mockUpdatedMessage);

      const result = await service.updateMessage(userId, messageId, updateMessageDto);

      expect(result.success).toBe(true);
      expect(result.data.content).toBe('Updated message');
      expect(result.data.isEdited).toBe(true);
    });

    it('should throw NotFoundException if message not found', async () => {
      mockPrismaService.message.findFirst.mockResolvedValue(null);

      await expect(service.updateMessage(userId, messageId, updateMessageDto))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if message is too old', async () => {
      const mockMessage = {
        id: messageId,
        content: 'Original message',
        senderId: userId,
        isDeleted: false,
        createdAt: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
      };

      mockPrismaService.message.findFirst.mockResolvedValue(mockMessage);

      await expect(service.updateMessage(userId, messageId, updateMessageDto))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteMessage', () => {
    const userId = 'user-1';
    const messageId = 'msg-1';

    it('should delete a message successfully', async () => {
      const mockMessage = {
        id: messageId,
        content: 'Message to delete',
        senderId: userId,
        isDeleted: false,
      };

      mockPrismaService.message.findFirst.mockResolvedValue(mockMessage);
      mockPrismaService.message.update.mockResolvedValue({});

      const result = await service.deleteMessage(userId, messageId);

      expect(result.success).toBe(true);
      expect(mockPrismaService.message.update).toHaveBeenCalledWith({
        where: { id: messageId },
        data: {
          isDeleted: true,
          content: 'This message was deleted',
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException if message not found', async () => {
      mockPrismaService.message.findFirst.mockResolvedValue(null);

      await expect(service.deleteMessage(userId, messageId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('createConversation', () => {
    const userId = 'user-1';
    const createConversationDto = {
      participantIds: ['user-2', 'user-3'],
    };

    it('should create a conversation successfully', async () => {
      const mockUsers = [
        { id: 'user-1' },
        { id: 'user-2' },
        { id: 'user-3' },
      ];

      const mockConversation = {
        id: 'conv-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [
          {
            userId: 'user-1',
            joinedAt: new Date(),
            lastReadAt: new Date(),
            user: {
              id: 'user-1',
              username: 'user1',
              avatar: null,
              isOnline: true,
              lastSeen: new Date(),
            },
          },
          {
            userId: 'user-2',
            joinedAt: new Date(),
            lastReadAt: new Date(),
            user: {
              id: 'user-2',
              username: 'user2',
              avatar: null,
              isOnline: false,
              lastSeen: new Date(),
            },
          },
        ],
        messages: [],
      };

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.conversation.findMany.mockResolvedValue([]);
      mockPrismaService.conversation.create.mockResolvedValue(mockConversation);

      const result = await service.createConversation(userId, createConversationDto);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('conv-1');
    });

    it('should throw BadRequestException if less than 2 participants', async () => {
      const invalidDto = { participantIds: [] };

      await expect(service.createConversation(userId, invalidDto))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if participants not found', async () => {
      const mockUsers = [{ id: 'user-1' }]; // Missing user-2 and user-3

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      await expect(service.createConversation(userId, createConversationDto))
        .rejects.toThrow(NotFoundException);
    });
  });
});
