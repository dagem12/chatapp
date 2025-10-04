import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'Username' })
  username: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiProperty({ description: 'Avatar URL', nullable: true })
  avatar?: string | null;

  @ApiProperty({ description: 'Online status' })
  isOnline: boolean;

  @ApiProperty({ description: 'Last seen timestamp' })
  lastSeen: Date;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
