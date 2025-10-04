import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  @ApiOperation({ 
    summary: 'Search users', 
    description: 'Search for users by username or email' 
  })
  @ApiQuery({ 
    name: 'q', 
    description: 'Search query (username or email)', 
    required: true, 
    example: 'john' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Users found successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              username: { type: 'string' },
              email: { type: 'string' },
              avatar: { type: 'string', nullable: true },
              isOnline: { type: 'boolean' },
              lastSeen: { type: 'string', format: 'date-time' },
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  async searchUsers(
    @Request() req: any,
    @Query('q') query: string,
  ): Promise<{ success: boolean; data: any[] }> {
    this.logger.log(`User search request from user: ${req.user.id}, query: ${query}`);
    try {
      const result = await this.usersService.searchUsers(req.user.id, query);
      this.logger.log(`User search completed for user: ${req.user.id}, found: ${result.data.length} users`);
      return result;
    } catch (error) {
      this.logger.error(`User search failed for user: ${req.user.id}`, error.stack);
      throw error;
    }
  }
}
