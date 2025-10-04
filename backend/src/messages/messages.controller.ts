import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateMessageDto,
  UpdateMessageDto,
  MarkMessagesAsReadDto,
  GetMessagesQueryDto,
  CreateConversationDto,
  GetConversationsQueryDto,
  MessageCreatedResponseDto,
  ConversationCreatedResponseDto,
  PaginatedMessagesResponseDto,
  PaginatedConversationsResponseDto,
  ConversationResponseDto,
  MessagesMarkedAsReadResponseDto,
} from './dto/message.dto';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new message', 
    description: 'Send a new message to a conversation' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Message created successfully',
    type: MessageCreatedResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - not a participant in conversation' })
  async createMessage(
    @Request() req: any,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<MessageCreatedResponseDto> {
    return this.messagesService.createMessage(req.user.id, createMessageDto);
  }

  @Get('conversation/:conversationId')
  @ApiOperation({ 
    summary: 'Get messages from a conversation', 
    description: 'Retrieve paginated messages from a specific conversation' 
  })
  @ApiParam({ 
    name: 'conversationId', 
    description: 'Conversation ID', 
    example: 'clx1234567890abcdef' 
  })
  @ApiQuery({ 
    name: 'page', 
    description: 'Page number', 
    required: false, 
    example: 1 
  })
  @ApiQuery({ 
    name: 'limit', 
    description: 'Messages per page', 
    required: false, 
    example: 20 
  })
  @ApiQuery({ 
    name: 'cursor', 
    description: 'Message ID for cursor-based pagination', 
    required: false, 
    example: 'clx1234567890abcdef' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Messages retrieved successfully',
    type: PaginatedMessagesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - not a participant in conversation' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getMessages(
    @Request() req: any,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query() query: GetMessagesQueryDto,
  ): Promise<PaginatedMessagesResponseDto> {
    return this.messagesService.getMessages(req.user.id, conversationId, query);
  }

  @Put(':messageId')
  @ApiOperation({ 
    summary: 'Update a message', 
    description: 'Edit a message (only within 15 minutes of creation)' 
  })
  @ApiParam({ 
    name: 'messageId', 
    description: 'Message ID', 
    example: 'clx1234567890abcdef' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Message updated successfully',
    type: MessageCreatedResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors or message too old' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 404, description: 'Message not found or no permission to edit' })
  async updateMessage(
    @Request() req: any,
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ): Promise<MessageCreatedResponseDto> {
    return this.messagesService.updateMessage(req.user.id, messageId, updateMessageDto);
  }

  @Delete(':messageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Delete a message', 
    description: 'Soft delete a message (only sender can delete)' 
  })
  @ApiParam({ 
    name: 'messageId', 
    description: 'Message ID', 
    example: 'clx1234567890abcdef' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Message deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Message deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 404, description: 'Message not found or no permission to delete' })
  async deleteMessage(
    @Request() req: any,
    @Param('messageId', ParseUUIDPipe) messageId: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.messagesService.deleteMessage(req.user.id, messageId);
  }

  @Put('mark-as-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Mark messages as read', 
    description: 'Mark multiple messages as read and update lastReadAt timestamp' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Messages marked as read successfully',
    type: MessagesMarkedAsReadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - no accessible messages found' })
  async markMessagesAsRead(
    @Request() req: any,
    @Body() markAsReadDto: MarkMessagesAsReadDto,
  ): Promise<MessagesMarkedAsReadResponseDto> {
    return this.messagesService.markMessagesAsRead(req.user.id, markAsReadDto);
  }
}

@ApiTags('Conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConversationsController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new conversation', 
    description: 'Create a new conversation with specified participants' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Conversation created successfully',
    type: ConversationCreatedResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 404, description: 'One or more participants not found' })
  async createConversation(
    @Request() req: any,
    @Body() createConversationDto: CreateConversationDto,
  ): Promise<ConversationCreatedResponseDto> {
    return this.messagesService.createConversation(req.user.id, createConversationDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get user conversations', 
    description: 'Retrieve paginated list of user conversations' 
  })
  @ApiQuery({ 
    name: 'page', 
    description: 'Page number', 
    required: false, 
    example: 1 
  })
  @ApiQuery({ 
    name: 'limit', 
    description: 'Conversations per page', 
    required: false, 
    example: 10 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Conversations retrieved successfully',
    type: PaginatedConversationsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  async getConversations(
    @Request() req: any,
    @Query() query: GetConversationsQueryDto,
  ): Promise<PaginatedConversationsResponseDto> {
    return this.messagesService.getConversations(req.user.id, query);
  }

  @Get(':conversationId')
  @ApiOperation({ 
    summary: 'Get conversation details', 
    description: 'Get detailed information about a specific conversation' 
  })
  @ApiParam({ 
    name: 'conversationId', 
    description: 'Conversation ID', 
    example: 'clx1234567890abcdef' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Conversation retrieved successfully',
    type: ConversationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversation(
    @Request() req: any,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ): Promise<ConversationResponseDto> {
    return this.messagesService.getConversationById(req.user.id, conversationId);
  }
}
