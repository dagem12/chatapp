import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async searchUsers(currentUserId: string, query: string): Promise<{ success: boolean; data: any[] }> {
    this.logger.log(`Searching users with query: ${query} for user: ${currentUserId}`);

    if (!query || query.trim().length < 2) {
      this.logger.warn(`Search query too short: ${query}`);
      return {
        success: true,
        data: [],
      };
    }

    try {
      const searchTerm = query.trim().toLowerCase();
      
      // Search for users by username or email, excluding the current user
      const users = await this.prisma.user.findMany({
        where: {
          AND: [
            { id: { not: currentUserId } }, // Exclude current user
            {
              OR: [
                { username: { contains: searchTerm, mode: 'insensitive' } },
                { email: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
          ],
        },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          isOnline: true,
          lastSeen: true,
          createdAt: true,
          updatedAt: true,
        },
        take: 20, // Limit results to 20 users
        orderBy: [
          { isOnline: 'desc' }, // Online users first
          { username: 'asc' }, // Then alphabetically by username
        ],
      });

      this.logger.log(`Found ${users.length} users matching query: ${query}`);

      return {
        success: true,
        data: users,
      };
    } catch (error) {
      this.logger.error(`Error searching users with query: ${query}`, error.stack);
      throw error;
    }
  }
}
