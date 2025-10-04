import { Injectable, ConflictException, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, UpdateProfileDto, ChangePasswordDto } from './dto/auth.dto';
import { AuthResponse, JwtPayload, UserProfileResponse } from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, username, password, confirmPassword } = registerDto;

    this.logger.log(`Registration attempt for email: ${email}, username: ${username}`);

    if (password !== confirmPassword) {
      this.logger.warn(`Registration failed - password mismatch for email: ${email}`);
      throw new BadRequestException('Passwords do not match');
    }

    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUserByEmail) {
      this.logger.warn(`Registration failed - email already exists: ${email}`);
      throw new ConflictException('Email already exists');
    }

    const existingUserByUsername = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUserByUsername) {
      this.logger.warn(`Registration failed - username already exists: ${username}`);
      throw new ConflictException('Username already exists');
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username,
        password: hashedPassword,
        isOnline: true,
        lastSeen: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = await this.generateToken(user.id, user.email, user.username);

    this.logger.log(`User registered successfully: ${user.id} (${email})`);

    return {
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    this.logger.log(`Login attempt for email: ${email}`);

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      this.logger.warn(`Login failed - user not found: ${email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Login failed - invalid password for user: ${user.id} (${email})`);
      throw new UnauthorizedException('Invalid email or password');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isOnline: true,
        lastSeen: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = await this.generateToken(updatedUser.id, updatedUser.email, updatedUser.username);

    this.logger.log(`User logged in successfully: ${updatedUser.id} (${email})`);

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: updatedUser,
        token,
      },
    };
  }

  async getProfile(userId: string): Promise<UserProfileResponse> {
    this.logger.log(`Profile request for user: ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      this.logger.warn(`Profile request failed - user not found: ${userId}`);
      throw new UnauthorizedException('User not found');
    }

    this.logger.log(`Profile retrieved successfully for user: ${userId}`);

    return {
      success: true,
      message: 'Profile retrieved successfully',
      data: user,
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<UserProfileResponse> {
    const { username, email, avatar } = updateProfileDto;

    this.logger.log(`Profile update request for user: ${userId}`);

    if (email) {
      const existingUserByEmail = await this.prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          id: { not: userId },
        },
      });

      if (existingUserByEmail) {
        this.logger.warn(`Profile update failed - email already exists: ${email} for user: ${userId}`);
        throw new ConflictException('Email already exists');
      }
    }

    if (username) {
      const existingUserByUsername = await this.prisma.user.findFirst({
        where: {
          username,
          id: { not: userId },
        },
      });

      if (existingUserByUsername) {
        this.logger.warn(`Profile update failed - username already exists: ${username} for user: ${userId}`);
        throw new ConflictException('Username already exists');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username }),
        ...(email && { email: email.toLowerCase() }),
        ...(avatar && { avatar }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Profile updated successfully for user: ${userId}`);

    return {
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ success: boolean; message: string }> {
    const { currentPassword, newPassword, confirmNewPassword } = changePasswordDto;

    this.logger.log(`Password change request for user: ${userId}`);

    if (newPassword !== confirmNewPassword) {
      this.logger.warn(`Password change failed - new passwords do not match for user: ${userId}`);
      throw new BadRequestException('New passwords do not match');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`Password change failed - user not found: ${userId}`);
      throw new UnauthorizedException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      this.logger.warn(`Password change failed - invalid current password for user: ${userId}`);
      throw new UnauthorizedException('Current password is incorrect');
    }

    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`Password changed successfully for user: ${userId}`);

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    this.logger.log(`Online status update for user: ${userId}, status: ${isOnline}`);
    
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isOnline,
        lastSeen: new Date(),
      },
    });

    this.logger.log(`Online status updated successfully for user: ${userId}, status: ${isOnline}`);
  }

  private async generateToken(userId: string, email: string, username: string): Promise<string> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      username,
    };

    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d');
    return this.jwtService.sign(payload, { expiresIn });
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify(token);
      this.logger.debug(`Token validated successfully for user: ${payload.sub}`);
      return payload;
    } catch (error) {
      this.logger.warn(`Token validation failed: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
