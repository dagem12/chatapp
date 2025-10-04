import { IsString, IsOptional, IsBoolean, IsEnum, MinLength, MaxLength, IsArray, IsUUID, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
}

export class CreateMessageDto {
  @ApiProperty({ 
    description: 'Message content', 
    example: 'Hello, how are you?',
    minLength: 1,
    maxLength: 2000,
  })
  @IsString({ message: 'Content must be a string' })
  @MinLength(1, { message: 'Content cannot be empty' })
  @MaxLength(2000, { message: 'Content cannot exceed 2000 characters' })
  content: string;

  @ApiProperty({ 
    description: 'Conversation ID where the message will be sent', 
    example: 'cmgb1tyby0009u89ogjjmlkoo',
  })
  @IsString({ message: 'Conversation ID must be a string' })
  conversationId: string;

  @ApiProperty({ 
    description: 'Type of message', 
    enum: MessageType,
    example: MessageType.TEXT,
    required: false,
  })
  @IsOptional()
  @IsEnum(MessageType, { message: 'Message type must be one of: text, image, file, system' })
  messageType?: MessageType = MessageType.TEXT;
}

export class UpdateMessageDto {
  @ApiProperty({ 
    description: 'Updated message content', 
    example: 'Hello, how are you doing?',
    minLength: 1,
    maxLength: 2000,
  })
  @IsString({ message: 'Content must be a string' })
  @MinLength(1, { message: 'Content cannot be empty' })
  @MaxLength(2000, { message: 'Content cannot exceed 2000 characters' })
  content: string;
}

export class MarkMessagesAsReadDto {
  @ApiProperty({ 
    description: 'Array of message IDs to mark as read', 
    example: ['cmgb1tyby0009u89ogjjmlkoo', 'cmgb1tyby0009u89ogjjmlko1'],
    type: [String],
  })
  @IsArray({ message: 'Message IDs must be an array' })
  @IsString({ each: true, message: 'Each message ID must be a string' })
  messageIds: string[];
}

export class GetMessagesQueryDto {
  @ApiProperty({ 
    description: 'Page number for pagination', 
    example: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ 
    description: 'Number of messages per page', 
    example: 20,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @ApiProperty({ 
    description: 'Message ID to start pagination from (for cursor-based pagination)', 
    example: 'cmgb1tyby0009u89ogjjmlkoo',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Cursor must be a string' })
  cursor?: string;
}

export class CreateConversationDto {
  @ApiProperty({ 
    description: 'Array of user IDs to include in the conversation', 
    example: ['cmgb1tyby0009u89ogjjmlkoo', 'cmgb1tyby0009u89ogjjmlko1'],
    type: [String],
  })
  @IsArray({ message: 'User IDs must be an array' })
  @IsString({ each: true, message: 'Each user ID must be a string' })
  participantIds: string[];
}

export class GetConversationsQueryDto {
  @ApiProperty({ 
    description: 'Page number for pagination', 
    example: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ 
    description: 'Number of conversations per page', 
    example: 10,
    minimum: 1,
    maximum: 50,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}

// Response DTOs for Swagger documentation
export class SenderResponseDto {
  @ApiProperty({ description: 'Sender ID', example: 'cmgb1tyby0009u89ogjjmlkoo' })
  id: string;

  @ApiProperty({ description: 'Sender username', example: 'john_doe' })
  username: string;

  @ApiProperty({ description: 'Sender avatar URL', example: 'https://example.com/avatar.jpg', required: false })
  avatar?: string;
}

export class MessageResponseDto {
  @ApiProperty({ description: 'Message ID', example: 'cmgb1tyby0009u89ogjjmlkoo' })
  id: string;

  @ApiProperty({ description: 'Message content', example: 'Hello, how are you?' })
  content: string;

  @ApiProperty({ description: 'Message type', enum: MessageType, example: MessageType.TEXT })
  messageType: MessageType;

  @ApiProperty({ description: 'Whether message is read', example: false })
  isRead: boolean;

  @ApiProperty({ description: 'Whether message was edited', example: false })
  isEdited: boolean;

  @ApiProperty({ description: 'Whether message was deleted', example: false })
  isDeleted: boolean;

  @ApiProperty({ description: 'Message creation timestamp', example: '2024-01-01T12:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Message last update timestamp', example: '2024-01-01T12:00:00Z' })
  updatedAt: Date;

  @ApiProperty({ description: 'Message sender information', type: SenderResponseDto })
  sender: SenderResponseDto;

  @ApiProperty({ description: 'Conversation ID', example: 'cmgb1tyby0009u89ogjjmlkoo' })
  conversationId: string;
}

export class ParticipantResponseDto {
  @ApiProperty({ description: 'Participant ID', example: 'cmgb1tyby0009u89ogjjmlkoo' })
  id: string;

  @ApiProperty({ description: 'Participant username', example: 'john_doe' })
  username: string;

  @ApiProperty({ description: 'Participant avatar URL', example: 'https://example.com/avatar.jpg', required: false })
  avatar?: string;

  @ApiProperty({ description: 'Whether participant is online', example: true })
  isOnline: boolean;

  @ApiProperty({ description: 'Last seen timestamp', example: '2024-01-01T12:00:00Z' })
  lastSeen: Date;

  @ApiProperty({ description: 'When participant joined conversation', example: '2024-01-01T12:00:00Z' })
  joinedAt: Date;

  @ApiProperty({ description: 'Last read timestamp', example: '2024-01-01T12:00:00Z' })
  lastReadAt: Date;
}

export class ConversationResponseDto {
  @ApiProperty({ description: 'Conversation ID', example: 'cmgb1tyby0009u89ogjjmlkoo' })
  id: string;

  @ApiProperty({ description: 'Conversation creation timestamp', example: '2024-01-01T12:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Conversation last update timestamp', example: '2024-01-01T12:00:00Z' })
  updatedAt: Date;

  @ApiProperty({ description: 'Conversation participants', type: [ParticipantResponseDto] })
  participants: ParticipantResponseDto[];

  @ApiProperty({ description: 'Last message in conversation', type: MessageResponseDto, required: false })
  lastMessage?: MessageResponseDto;

  @ApiProperty({ description: 'Number of unread messages', example: 5 })
  unreadCount: number;
}

export class OtherParticipantResponseDto {
  @ApiProperty({ description: 'Participant ID', example: 'cmgb1tyby0009u89ogjjmlkoo' })
  id: string;

  @ApiProperty({ description: 'Participant username', example: 'john_doe' })
  username: string;

  @ApiProperty({ description: 'Participant avatar URL', example: 'https://example.com/avatar.jpg', required: false })
  avatar?: string;

  @ApiProperty({ description: 'Whether participant is online', example: true })
  isOnline: boolean;

  @ApiProperty({ description: 'Last seen timestamp', example: '2024-01-01T12:00:00Z' })
  lastSeen: Date;
}

export class LastMessageResponseDto {
  @ApiProperty({ description: 'Message ID', example: 'cmgb1tyby0009u89ogjjmlkoo' })
  id: string;

  @ApiProperty({ description: 'Message content', example: 'Hello, how are you?' })
  content: string;

  @ApiProperty({ description: 'Message type', enum: MessageType, example: MessageType.TEXT })
  messageType: MessageType;

  @ApiProperty({ description: 'Message creation timestamp', example: '2024-01-01T12:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Sender ID', example: 'cmgb1tyby0009u89ogjjmlkoo' })
  senderId: string;
}

export class ConversationPreviewResponseDto {
  @ApiProperty({ description: 'Conversation ID', example: 'cmgb1tyby0009u89ogjjmlkoo' })
  id: string;

  @ApiProperty({ description: 'Other participant information', type: OtherParticipantResponseDto })
  otherParticipant: OtherParticipantResponseDto;

  @ApiProperty({ description: 'Last message in conversation', type: LastMessageResponseDto, required: false })
  lastMessage?: LastMessageResponseDto;

  @ApiProperty({ description: 'Number of unread messages', example: 5 })
  unreadCount: number;

  @ApiProperty({ description: 'Conversation last update timestamp', example: '2024-01-01T12:00:00Z' })
  updatedAt: Date;
}

export class PaginationResponseDto {
  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Number of items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total number of items', example: 100 })
  total: number;

  @ApiProperty({ description: 'Total number of pages', example: 5 })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page', example: true })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page', example: false })
  hasPrevious: boolean;

  @ApiProperty({ description: 'Cursor for next page (cursor-based pagination)', example: 'cmgb1tyby0009u89ogjjmlkoo', required: false })
  cursor?: string;
}

export class PaginatedMessagesResponseDto {
  @ApiProperty({ description: 'Request success status', example: true })
  success: boolean;

  @ApiProperty({ description: 'Response message', example: 'Messages retrieved successfully' })
  message: string;

  @ApiProperty({ description: 'Array of messages', type: [MessageResponseDto] })
  data: MessageResponseDto[];

  @ApiProperty({ description: 'Pagination information', type: PaginationResponseDto })
  pagination: PaginationResponseDto;
}

export class PaginatedConversationsResponseDto {
  @ApiProperty({ description: 'Request success status', example: true })
  success: boolean;

  @ApiProperty({ description: 'Response message', example: 'Conversations retrieved successfully' })
  message: string;

  @ApiProperty({ description: 'Array of conversation previews', type: [ConversationPreviewResponseDto] })
  data: ConversationPreviewResponseDto[];

  @ApiProperty({ description: 'Pagination information', type: PaginationResponseDto })
  pagination: PaginationResponseDto;
}

export class MessageCreatedResponseDto {
  @ApiProperty({ description: 'Request success status', example: true })
  success: boolean;

  @ApiProperty({ description: 'Response message', example: 'Message created successfully' })
  message: string;

  @ApiProperty({ description: 'Created message data', type: MessageResponseDto })
  data: MessageResponseDto;
}

export class ConversationCreatedResponseDto {
  @ApiProperty({ description: 'Request success status', example: true })
  success: boolean;

  @ApiProperty({ description: 'Response message', example: 'Conversation created successfully' })
  message: string;

  @ApiProperty({ description: 'Created conversation data', type: ConversationResponseDto })
  data: ConversationResponseDto;
}

export class MessagesMarkedAsReadResponseDto {
  @ApiProperty({ description: 'Request success status', example: true })
  success: boolean;

  @ApiProperty({ description: 'Response message', example: 'Messages marked as read successfully' })
  message: string;

  @ApiProperty({ 
    description: 'Mark as read result data', 
    example: { markedCount: 5, messageIds: ['cmgb1tyby0009u89ogjjmlkoo', 'cmgb1tyby0009u89ogjjmlko1'] }
  })
  data: {
    markedCount: number;
    messageIds: string[];
  };
}
