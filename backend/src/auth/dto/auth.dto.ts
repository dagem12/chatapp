import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'User email address', example: 'john@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ 
    description: 'Username (2-30 characters, alphanumeric and underscores only)', 
    example: 'john_doe',
    minLength: 2,
    maxLength: 30,
  })
  @IsString({ message: 'Username must be a string' })
  @MinLength(2, { message: 'Username must be at least 2 characters long' })
  @MaxLength(30, { message: 'Username must be less than 30 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username: string;

  @ApiProperty({ description: 'Password (minimum 8 characters)', example: 'password123', minLength: 8 })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({ description: 'Password confirmation (must match password)', example: 'password123' })
  @IsString({ message: 'Confirm password must be a string' })
  confirmPassword: string;
}

export class LoginDto {
  @ApiProperty({ description: 'User email address', example: 'john@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ description: 'User password', example: 'password123' })
  @IsString({ message: 'Password must be a string' })
  password: string;
}

export class UpdateProfileDto {
  @ApiProperty({ 
    description: 'Username (2-30 characters, alphanumeric and underscores only)', 
    example: 'john_doe_updated',
    required: false,
  })
  @IsString({ message: 'Username must be a string' })
  @MinLength(2, { message: 'Username must be at least 2 characters long' })
  @MaxLength(30, { message: 'Username must be less than 30 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username?: string;

  @ApiProperty({ description: 'User email address', example: 'john.updated@example.com', required: false })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiProperty({ description: 'Avatar URL', example: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', required: false })
  @IsString({ message: 'Avatar must be a string' })
  avatar?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password', example: 'oldpassword123' })
  @IsString({ message: 'Current password must be a string' })
  currentPassword: string;

  @ApiProperty({ description: 'New password (minimum 8 characters)', example: 'newpassword123', minLength: 8 })
  @IsString({ message: 'New password must be a string' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword: string;

  @ApiProperty({ description: 'New password confirmation (must match new password)', example: 'newpassword123' })
  @IsString({ message: 'Confirm new password must be a string' })
  confirmNewPassword: string;
}
