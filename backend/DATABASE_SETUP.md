# Database Setup Guide

This guide will help you set up the PostgreSQL database for the chat application.

## Prerequisites

- PostgreSQL installed and running
- Node.js and npm installed

## Quick Setup

1. **Copy environment configuration:**
   ```bash
   cp config/database.env .env
   ```

2. **Update database connection:**
   Edit `.env` file and update the `DATABASE_URL` with your PostgreSQL credentials:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/chatapp_db?schema=public"
   ```

3. **Run database setup:**
   ```bash
   npm run db:generate  # Generate Prisma client
   npm run db:migrate   # Run migrations
   npm run db:seed      # Seed with sample data
   ```

   Or run the complete setup script:
   ```bash
   node scripts/setup-db.js
   ```

## Database Schema

The application uses the following main models for direct messaging:

### User
- `id`: Unique identifier
- `email`: User email (unique)
- `username`: Display name (unique)
- `password`: Hashed password
- `avatar`: Optional avatar URL
- `isOnline`: Online status
- `lastSeen`: Last activity timestamp

### Conversation
- `id`: Unique identifier
- `createdAt`: Conversation creation timestamp
- `updatedAt`: Last activity timestamp
- Represents a direct message conversation between 2 users

### ConversationParticipant
- `id`: Unique identifier
- `userId`: User reference
- `conversationId`: Conversation reference
- `joinedAt`: When user joined the conversation
- `lastReadAt`: Last time user read messages in this conversation

### Message
- `id`: Unique identifier
- `content`: Message text
- `messageType`: Type of message (text, image, file)
- `senderId`: Sender reference
- `conversationId`: Conversation reference
- `isRead`: Read status
- `isEdited`: Edit status
- `isDeleted`: Delete status

## Available Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:deploy` - Deploy migrations (production)
- `npm run db:seed` - Seed database with sample data
- `npm run db:reset` - Reset database (WARNING: deletes all data)
- `npm run db:studio` - Open Prisma Studio (database GUI)

## Sample Data

The seed script creates:
- 5 test users (john@example.com, jane@example.com, bob@example.com, sarah@example.com, mike@example.com)
- 3 direct message conversations between users
- Sample messages with realistic timestamps and read status

Default password for all test users: `password123`

### Test Users:
- **john_doe** (john@example.com) - Online
- **jane_smith** (jane@example.com) - Online  
- **bob_wilson** (bob@example.com) - Offline (30 min ago)
- **sarah_wilson** (sarah@example.com) - Online
- **mike_chen** (mike@example.com) - Offline (2 hours ago)

### Sample Conversations:
- John ↔ Jane: Project discussion
- John ↔ Bob: Meeting preparation
- Jane ↔ Sarah: Weekend lunch plans

## Troubleshooting

### Connection Issues
- Ensure PostgreSQL is running
- Check connection string in `.env`
- Verify database exists
- Check firewall settings

### Migration Issues
- Reset database: `npm run db:reset`
- Check for conflicting migrations
- Ensure Prisma client is generated: `npm run db:generate`

### Permission Issues
- Ensure database user has CREATE, ALTER, DROP permissions
- Check PostgreSQL user roles and privileges
