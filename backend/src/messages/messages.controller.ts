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
  Logger,
} from '@nestjs/common';
import { CuidValidationPipe } from '../common/pipes/cuid-validation.pipe';
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
  private readonly logger = new Logger(MessagesController.name);

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
    this.logger.log(`Message creation request from user: ${req.user.id} to conversation: ${createMessageDto.conversationId}`);
    try {
      const result = await this.messagesService.createMessage(req.user.id, createMessageDto);
      this.logger.log(`Message created successfully: ${result.data.id} by user: ${req.user.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Message creation failed for user: ${req.user.id}`, error.stack);
      throw error;
    }
  }

  @Get('conversation/:conversationId')
  @ApiOperation({ 
    summary: 'Get messages from a conversation', 
    description: 'Retrieve paginated messages from a specific conversation' 
  })
  @ApiParam({ 
    name: 'conversationId', 
    description: 'Conversation ID', 
    example: 'cmgb1tyby0009u89ogjjmlkoo' 
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
    example: 'cmgb1tyby0009u89ogjjmlkoo' 
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
    @Param('conversationId', CuidValidationPipe) conversationId: string,
    @Query() query: GetMessagesQueryDto,
  ): Promise<PaginatedMessagesResponseDto> {
    this.logger.log(`Messages request from user: ${req.user.id} for conversation: ${conversationId}`);
    try {
      const result = await this.messagesService.getMessages(req.user.id, conversationId, query);
      this.logger.log(`Messages retrieved successfully for user: ${req.user.id}, conversation: ${conversationId}, count: ${result.data.length}`);
      return result;
    } catch (error) {
      this.logger.error(`Messages retrieval failed for user: ${req.user.id}, conversation: ${conversationId}`, error.stack);
      throw error;
    }
  }

  @Put(':messageId')
  @ApiOperation({ 
    summary: 'Update a message', 
    description: 'Edit a message (only within 15 minutes of creation)' 
  })
  @ApiParam({ 
    name: 'messageId', 
    description: 'Message ID', 
    example: 'cmgb1tyby0009u89ogjjmlkoo' 
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
    @Param('messageId', CuidValidationPipe) messageId: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ): Promise<MessageCreatedResponseDto> {
    this.logger.log(`Message update request from user: ${req.user.id} for message: ${messageId}`);
    try {
      const result = await this.messagesService.updateMessage(req.user.id, messageId, updateMessageDto);
      this.logger.log(`Message updated successfully: ${messageId} by user: ${req.user.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Message update failed for user: ${req.user.id}, message: ${messageId}`, error.stack);
      throw error;
    }
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
    example: 'cmgb1tyby0009u89ogjjmlkoo' 
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
    @Param('messageId', CuidValidationPipe) messageId: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Message deletion request from user: ${req.user.id} for message: ${messageId}`);
    try {
      const result = await this.messagesService.deleteMessage(req.user.id, messageId);
      this.logger.log(`Message deleted successfully: ${messageId} by user: ${req.user.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Message deletion failed for user: ${req.user.id}, message: ${messageId}`, error.stack);
      throw error;
    }
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
    this.logger.log(`Mark messages as read request from user: ${req.user.id} for ${markAsReadDto.messageIds.length} messages`);
    try {
      const result = await this.messagesService.markMessagesAsRead(req.user.id, markAsReadDto);
      this.logger.log(`Messages marked as read successfully by user: ${req.user.id}, count: ${result.data.markedCount}`);
      return result;
    } catch (error) {
      this.logger.error(`Mark messages as read failed for user: ${req.user.id}`, error.stack);
      throw error;
    }
  }
}

@ApiTags('Conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConversationsController {
  private readonly logger = new Logger(ConversationsController.name);

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
    this.logger.log(`Conversation creation request from user: ${req.user.id} with ${createConversationDto.participantIds.length} participants`);
    try {
      const result = await this.messagesService.createConversation(req.user.id, createConversationDto);
      this.logger.log(`Conversation created successfully: ${result.data.id} by user: ${req.user.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Conversation creation failed for user: ${req.user.id}`, error.stack);
      throw error;
    }
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
    this.logger.log(`Conversations request from user: ${req.user.id}`);
    try {
      const result = await this.messagesService.getConversations(req.user.id, query);
      this.logger.log(`Conversations retrieved successfully for user: ${req.user.id}, count: ${result.data.length}`);
      return result;
    } catch (error) {
      this.logger.error(`Conversations retrieval failed for user: ${req.user.id}`, error.stack);
      throw error;
    }
  }

  @Get(':conversationId')
  @ApiOperation({ 
    summary: 'Get conversation details', 
    description: 'Get detailed information about a specific conversation' 
  })
  @ApiParam({ 
    name: 'conversationId', 
    description: 'Conversation ID', 
    example: 'cmgb1tyby0009u89ogjjmlkoo' 
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
    @Param('conversationId', CuidValidationPipe) conversationId: string,
  ): Promise<{ success: boolean; data: ConversationResponseDto }> {
    this.logger.log(`Conversation details request from user: ${req.user.id} for conversation: ${conversationId}`);
    try {
      const result = await this.messagesService.getConversationById(req.user.id, conversationId);
      this.logger.log(`Conversation details retrieved successfully for user: ${req.user.id}, conversation: ${conversationId}`);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Conversation details retrieval failed for user: ${req.user.id}, conversation: ${conversationId}`, error.stack);
      throw error;
    }
  }
}
