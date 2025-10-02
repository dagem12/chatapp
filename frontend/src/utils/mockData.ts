import type { User, ConversationPreview, Message, Conversation } from '../types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    username: 'john_doe',
    email: 'john@example.com',
    isOnline: true,
  },
  {
    id: 'user-2',
    username: 'sarah_wilson',
    email: 'sarah@example.com',
    isOnline: true,
  },
  {
    id: 'user-3',
    username: 'mike_chen',
    email: 'mike@example.com',
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
  },
  {
    id: 'user-4',
    username: 'emma_taylor',
    email: 'emma@example.com',
    isOnline: true,
  },
  {
    id: 'user-5',
    username: 'alex_brown',
    email: 'alex@example.com',
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: 'user-6',
    username: 'lisa_garcia',
    email: 'lisa@example.com',
    isOnline: true,
  },
];

// Current user (you)
export const currentUser: User = {
  id: 'current-user',
  username: 'testuser',
  email: 'test@example.com',
  isOnline: true,
};

// Mock Messages
export const mockMessages: { [conversationId: string]: Message[] } = {
  'conv-1': [
    {
      id: 'msg-1',
      content: 'Hey! How are you doing today?',
      senderId: 'user-1',
      conversationId: 'conv-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      isRead: true,
    },
    {
      id: 'msg-2',
      content: 'I\'m doing great! Just finished working on a new project. How about you?',
      senderId: 'current-user',
      conversationId: 'conv-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5), // 1.5 hours ago
      isRead: true,
    },
    {
      id: 'msg-3',
      content: 'That sounds awesome! What kind of project are you working on?',
      senderId: 'user-1',
      conversationId: 'conv-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      isRead: true,
    },
    {
      id: 'msg-4',
      content: 'It\'s a chat application with React and TypeScript. Really enjoying the development process!',
      senderId: 'current-user',
      conversationId: 'conv-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
      isRead: true,
    },
    {
      id: 'msg-5',
      content: 'Nice! I love working with React. Are you using any specific UI library?',
      senderId: 'user-1',
      conversationId: 'conv-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      isRead: false,
    },
  ],
  'conv-2': [
    {
      id: 'msg-6',
      content: 'Hi there! Ready for the meeting tomorrow?',
      senderId: 'user-2',
      conversationId: 'conv-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
      isRead: true,
    },
    {
      id: 'msg-7',
      content: 'Yes, I\'ve prepared all the materials. Should be a good discussion!',
      senderId: 'current-user',
      conversationId: 'conv-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.5), // 2.5 hours ago
      isRead: true,
    },
    {
      id: 'msg-8',
      content: 'Perfect! I\'ll send you the agenda in a few minutes.',
      senderId: 'user-2',
      conversationId: 'conv-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      isRead: false,
    },
  ],
  'conv-3': [
    {
      id: 'msg-9',
      content: 'Hey! Want to grab lunch this weekend?',
      senderId: 'user-4',
      conversationId: 'conv-3',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      isRead: true,
    },
    {
      id: 'msg-10',
      content: 'That sounds great! How about Saturday around 1 PM?',
      senderId: 'current-user',
      conversationId: 'conv-3',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3.5), // 3.5 hours ago
      isRead: true,
    },
    {
      id: 'msg-11',
      content: 'Perfect! I know a great new restaurant downtown.',
      senderId: 'user-4',
      conversationId: 'conv-3',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
      isRead: true,
    },
    {
      id: 'msg-12',
      content: 'Awesome! Send me the address when you get a chance.',
      senderId: 'current-user',
      conversationId: 'conv-3',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2.8), // 2.8 hours ago
      isRead: true,
    },
    {
      id: 'msg-13',
      content: 'Will do! Looking forward to it 😊',
      senderId: 'user-4',
      conversationId: 'conv-3',
      timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
      isRead: false,
    },
  ],
  'conv-4': [
    {
      id: 'msg-14',
      content: 'Quick question about the design mockups',
      senderId: 'user-6',
      conversationId: 'conv-4',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      isRead: false,
    },
  ],
};

// Mock Conversations
export const mockConversations: ConversationPreview[] = [
  {
    id: 'conv-1',
    otherParticipant: mockUsers[0], // john_doe
    lastMessage: {
      content: 'Nice! I love working with React. Are you using any specific UI library?',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      senderId: 'user-1',
    },
    unreadCount: 1,
  },
  {
    id: 'conv-2',
    otherParticipant: mockUsers[1], // sarah_wilson
    lastMessage: {
      content: 'Perfect! I\'ll send you the agenda in a few minutes.',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      senderId: 'user-2',
    },
    unreadCount: 1,
  },
  {
    id: 'conv-3',
    otherParticipant: mockUsers[3], // emma_taylor
    lastMessage: {
      content: 'Will do! Looking forward to it 😊',
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      senderId: 'user-4',
    },
    unreadCount: 1,
  },
  {
    id: 'conv-4',
    otherParticipant: mockUsers[5], // lisa_garcia
    lastMessage: {
      content: 'Quick question about the design mockups',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      senderId: 'user-6',
    },
    unreadCount: 1,
  },
];

// Mock Full Conversations (for when selecting a conversation)
export const mockFullConversations: { [id: string]: Conversation } = {
  'conv-1': {
    id: 'conv-1',
    participants: [currentUser, mockUsers[0]],
    lastMessage: mockMessages['conv-1'][mockMessages['conv-1'].length - 1],
    unreadCount: 1,
    updatedAt: new Date(Date.now() - 1000 * 60 * 30),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
  },
  'conv-2': {
    id: 'conv-2',
    participants: [currentUser, mockUsers[1]],
    lastMessage: mockMessages['conv-2'][mockMessages['conv-2'].length - 1],
    unreadCount: 1,
    updatedAt: new Date(Date.now() - 1000 * 60 * 15),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
  },
  'conv-3': {
    id: 'conv-3',
    participants: [currentUser, mockUsers[3]],
    lastMessage: mockMessages['conv-3'][mockMessages['conv-3'].length - 1],
    unreadCount: 1,
    updatedAt: new Date(Date.now() - 1000 * 60 * 10),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
  },
  'conv-4': {
    id: 'conv-4',
    participants: [currentUser, mockUsers[5]],
    lastMessage: mockMessages['conv-4'][mockMessages['conv-4'].length - 1],
    unreadCount: 1,
    updatedAt: new Date(Date.now() - 1000 * 60 * 5),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
};

// Auto-reply messages for testing
export const autoReplyMessages = [
  "That's interesting! Tell me more.",
  "I totally agree with you on that.",
  "Sounds like a great plan!",
  "Thanks for sharing that with me.",
  "I'll think about it and get back to you.",
  "That makes perfect sense.",
  "I'm excited to see how it turns out!",
  "Good point! I hadn't considered that.",
  "Let me know if you need any help with that.",
  "That's awesome! Congratulations!",
];

// Function to get a random auto-reply
export const getRandomAutoReply = (): string => {
  return autoReplyMessages[Math.floor(Math.random() * autoReplyMessages.length)];
};

// Function to generate a new message ID
export const generateMessageId = (): string => {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Function to generate a new conversation ID
export const generateConversationId = (): string => {
  return `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
