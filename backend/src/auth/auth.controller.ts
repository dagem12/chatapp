import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard, Public } from './guards/jwt-auth.guard';
import { RegisterDto, LoginDto, UpdateProfileDto, ChangePasswordDto } from './dto/auth.dto';
import { AuthResponse, UserProfileResponse } from './interfaces/auth.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user', description: 'Create a new user account with email, username, and password' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  @ApiResponse({ status: 409, description: 'Conflict - email or username already exists' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    this.logger.log(`User registration attempt: ${registerDto.email}`);
    try {
      const result = await this.authService.register(registerDto);
      this.logger.log(`User registered successfully: ${registerDto.email}`);
      return result;
    } catch (error) {
      this.logger.error(`User registration failed: ${registerDto.email}`, error.stack);
      throw error;
    }
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user', description: 'Authenticate user with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    this.logger.log(`User login attempt: ${loginDto.email}`);
    try {
      const result = await this.authService.login(loginDto);
      this.logger.log(`User logged in successfully: ${loginDto.email}`);
      return result;
    } catch (error) {
      this.logger.warn(`User login failed: ${loginDto.email}`, error.stack);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile', description: 'Get the profile of the currently authenticated user' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  async getProfile(@Request() req: any): Promise<UserProfileResponse> {
    this.logger.log(`Profile request for user: ${req.user.id}`);
    try {
      const result = await this.authService.getProfile(req.user.id);
      this.logger.log(`Profile retrieved successfully for user: ${req.user.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Profile retrieval failed for user: ${req.user.id}`, error.stack);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile', description: 'Update the profile of the currently authenticated user' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 409, description: 'Conflict - email or username already exists' })
  async updateProfile(
    @Request() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfileResponse> {
    this.logger.log(`Profile update request for user: ${req.user.id}`);
    try {
      const result = await this.authService.updateProfile(req.user.id, updateProfileDto);
      this.logger.log(`Profile updated successfully for user: ${req.user.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Profile update failed for user: ${req.user.id}`, error.stack);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password', description: 'Change the password of the currently authenticated user' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid current password or token' })
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Password change request for user: ${req.user.id}`);
    try {
      const result = await this.authService.changePassword(req.user.id, changePasswordDto);
      this.logger.log(`Password changed successfully for user: ${req.user.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Password change failed for user: ${req.user.id}`, error.stack);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('online-status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user online status', description: 'Update the online status of the currently authenticated user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isOnline: { type: 'boolean', description: 'Online status', example: true },
      },
      required: ['isOnline'],
    },
  })
  @ApiResponse({ status: 200, description: 'Online status updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  async updateOnlineStatus(
    @Request() req: any,
    @Body() body: { isOnline: boolean },
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Online status update request for user: ${req.user.id}, status: ${body.isOnline}`);
    try {
      await this.authService.updateOnlineStatus(req.user.id, body.isOnline);
      this.logger.log(`Online status updated successfully for user: ${req.user.id}, status: ${body.isOnline}`);
      return {
        success: true,
        message: 'Online status updated successfully',
      };
    } catch (error) {
      this.logger.error(`Online status update failed for user: ${req.user.id}`, error.stack);
      throw error;
    }
  }
}
