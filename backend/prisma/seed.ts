import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      username: 'john_doe',
      password: hashedPassword,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      isOnline: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      username: 'jane_smith',
      password: hashedPassword,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
      isOnline: true,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      username: 'bob_wilson',
      password: hashedPassword,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
      isOnline: false,
      lastSeen: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
  });

  const user4 = await prisma.user.upsert({
    where: { email: 'sarah@example.com' },
    update: {},
    create: {
      email: 'sarah@example.com',
      username: 'sarah_wilson',
      password: hashedPassword,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      isOnline: true,
    },
  });

  const user5 = await prisma.user.upsert({
    where: { email: 'mike@example.com' },
    update: {},
    create: {
      email: 'mike@example.com',
      username: 'mike_chen',
      password: hashedPassword,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
      isOnline: false,
      lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
  });

  // Create conversations (direct messages between users)
  const conversation1 = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { userId: user1.id },
          { userId: user2.id },
        ],
      },
    },
  });

  const conversation2 = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { userId: user1.id },
          { userId: user3.id },
        ],
      },
    },
  });

  const conversation3 = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { userId: user2.id },
          { userId: user4.id },
        ],
      },
    },
  });

  // Create sample messages
  await prisma.message.createMany({
    data: [
      // Conversation 1: John <-> Jane
      {
        content: 'Hey Jane! How are you doing today?',
        senderId: user1.id,
        conversationId: conversation1.id,
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      },
      {
        content: 'I\'m doing great! Just finished working on a new project. How about you?',
        senderId: user2.id,
        conversationId: conversation1.id,
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.5), // 1.5 hours ago
      },
      {
        content: 'That sounds awesome! What kind of project are you working on?',
        senderId: user1.id,
        conversationId: conversation1.id,
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      },
      {
        content: 'It\'s a chat application with React and TypeScript. Really enjoying the development process!',
        senderId: user2.id,
        conversationId: conversation1.id,
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
      },
      
      // Conversation 2: John <-> Bob
      {
        content: 'Hi Bob! Ready for the meeting tomorrow?',
        senderId: user1.id,
        conversationId: conversation2.id,
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
      },
      {
        content: 'Yes, I\'ve prepared all the materials. Should be a good discussion!',
        senderId: user3.id,
        conversationId: conversation2.id,
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2.5), // 2.5 hours ago
      },
      {
        content: 'Perfect! I\'ll send you the agenda in a few minutes.',
        senderId: user1.id,
        conversationId: conversation2.id,
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      },

      // Conversation 3: Jane <-> Sarah
      {
        content: 'Hey! Want to grab lunch this weekend?',
        senderId: user2.id,
        conversationId: conversation3.id,
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      },
      {
        content: 'That sounds great! How about Saturday around 1 PM?',
        senderId: user4.id,
        conversationId: conversation3.id,
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3.5), // 3.5 hours ago
      },
      {
        content: 'Perfect! I know a great new restaurant downtown.',
        senderId: user2.id,
        conversationId: conversation3.id,
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
      },
      {
        content: 'Awesome! Send me the address when you get a chance.',
        senderId: user4.id,
        conversationId: conversation3.id,
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2.8), // 2.8 hours ago
      },
      {
        content: 'Will do! Looking forward to it 😊',
        senderId: user2.id,
        conversationId: conversation3.id,
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
      },
    ],
  });

  console.log(' Database seeded successfully!');
  console.log(' Created users:', { 
    user1: user1.username, 
    user2: user2.username, 
    user3: user3.username,
    user4: user4.username,
    user5: user5.username
  });
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
