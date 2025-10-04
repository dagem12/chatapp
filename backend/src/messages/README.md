# Messaging API Documentation

This module provides comprehensive messaging functionality for the chat application, including CRUD operations for messages and conversations, with proper pagination and validation.

## Features

- ✅ Create, read, update, and delete messages
- ✅ Create and manage conversations
- ✅ Pagination for message history (both offset and cursor-based)
- ✅ Mark messages as read functionality
- ✅ Proper validation and error handling
- ✅ JWT authentication required for all endpoints
- ✅ Soft delete for messages
- ✅ Message editing with time restrictions (15 minutes)
- ✅ Unread message counting
- ✅ Conversation participant management

## API Endpoints

### Messages

#### Create Message
```
POST /messages
```
**Body:**
```json
{
  "content": "Hello, how are you?",
  "conversationId": "clx1234567890abcdef",
  "messageType": "text" // optional, defaults to "text"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message created successfully",
  "data": {
    "id": "msg-123",
    "content": "Hello, how are you?",
    "messageType": "text",
    "isRead": false,
    "isEdited": false,
    "isDeleted": false,
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z",
    "sender": {
      "id": "user-123",
      "username": "john_doe",
      "avatar": "https://example.com/avatar.jpg"
    },
    "conversationId": "conv-123"
  }
}
```

#### Get Messages (Paginated)
```
GET /messages/conversation/{conversationId}?page=1&limit=20&cursor=msg-123
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Messages per page (default: 20, max: 100)
- `cursor` (optional): Message ID for cursor-based pagination

**Response:**
```json
{
  "success": true,
  "message": "Messages retrieved successfully",
  "data": [
    {
      "id": "msg-123",
      "content": "Hello, how are you?",
      "messageType": "text",
      "isRead": false,
      "isEdited": false,
      "isDeleted": false,
      "createdAt": "2024-01-01T12:00:00Z",
      "updatedAt": "2024-01-01T12:00:00Z",
      "sender": {
        "id": "user-123",
        "username": "john_doe",
        "avatar": "https://example.com/avatar.jpg"
      },
      "conversationId": "conv-123"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3,
    "hasNext": true,
    "hasPrevious": false,
    "cursor": "msg-456"
  }
}
```

#### Update Message
```
PUT /messages/{messageId}
```
**Body:**
```json
{
  "content": "Updated message content"
}
```

**Note:** Messages can only be edited within 15 minutes of creation.

#### Delete Message
```
DELETE /messages/{messageId}
```

**Response:**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

#### Mark Messages as Read
```
PUT /messages/mark-as-read
```
**Body:**
```json
{
  "messageIds": ["msg-123", "msg-456", "msg-789"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Messages marked as read successfully",
  "data": {
    "markedCount": 3,
    "messageIds": ["msg-123", "msg-456", "msg-789"]
  }
}
```

### Conversations

#### Create Conversation
```
POST /conversations
```
**Body:**
```json
{
  "participantIds": ["user-456", "user-789"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation created successfully",
  "data": {
    "id": "conv-123",
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z",
    "participants": [
      {
        "id": "user-456",
        "username": "jane_doe",
        "avatar": "https://example.com/avatar2.jpg",
        "isOnline": true,
        "lastSeen": "2024-01-01T12:00:00Z",
        "joinedAt": "2024-01-01T12:00:00Z",
        "lastReadAt": "2024-01-01T12:00:00Z"
      }
    ],
    "lastMessage": null,
    "unreadCount": 0
  }
}
```

#### Get Conversations (Paginated)
```
GET /conversations?page=1&limit=10
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Conversations per page (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "message": "Conversations retrieved successfully",
  "data": [
    {
      "id": "conv-123",
      "otherParticipant": {
        "id": "user-456",
        "username": "jane_doe",
        "avatar": "https://example.com/avatar2.jpg",
        "isOnline": true,
        "lastSeen": "2024-01-01T12:00:00Z"
      },
      "lastMessage": {
        "id": "msg-123",
        "content": "Hello!",
        "messageType": "text",
        "createdAt": "2024-01-01T12:00:00Z",
        "senderId": "user-456"
      },
      "unreadCount": 2,
      "updatedAt": "2024-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

#### Get Conversation Details
```
GET /conversations/{conversationId}
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation retrieved successfully",
  "data": {
    "id": "conv-123",
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z",
    "participants": [
      {
        "id": "user-456",
        "username": "jane_doe",
        "avatar": "https://example.com/avatar2.jpg",
        "isOnline": true,
        "lastSeen": "2024-01-01T12:00:00Z",
        "joinedAt": "2024-01-01T12:00:00Z",
        "lastReadAt": "2024-01-01T12:00:00Z"
      }
    ],
    "lastMessage": {
      "id": "msg-123",
      "content": "Hello!",
      "messageType": "text",
      "isRead": false,
      "isEdited": false,
      "isDeleted": false,
      "createdAt": "2024-01-01T12:00:00Z",
      "updatedAt": "2024-01-01T12:00:00Z",
      "sender": {
        "id": "user-456",
        "username": "jane_doe",
        "avatar": "https://example.com/avatar2.jpg"
      },
      "conversationId": "conv-123"
    },
    "unreadCount": 2
  }
}
```

## Message Types

The API supports different message types:
- `text` (default): Regular text messages
- `image`: Image messages
- `file`: File attachments
- `system`: System-generated messages

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400 Bad Request`: Validation errors or invalid input
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User doesn't have permission (e.g., not a conversation participant)
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists (e.g., duplicate conversation)

## Authentication

All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Validation Rules

### Message Content
- Minimum length: 1 character
- Maximum length: 2000 characters
- Cannot be empty

### Pagination
- Page: Minimum 1
- Limit: Minimum 1, Maximum 100 (messages) or 50 (conversations)

### Message Editing
- Only the sender can edit their messages
- Messages can only be edited within 15 minutes of creation
- Edited messages are marked with `isEdited: true`

### Message Deletion
- Only the sender can delete their messages
- Messages are soft-deleted (marked as deleted, content replaced)
- Deleted messages show "This message was deleted" as content

## Database Schema

The messaging system uses the following Prisma models:

- `Message`: Stores individual messages
- `Conversation`: Groups messages between participants
- `ConversationParticipant`: Manages user participation in conversations
- `User`: User information (from auth module)

## Frontend Integration

This API is designed to work seamlessly with the frontend chat application:

1. **Real-time Updates**: Use WebSocket connections for real-time message delivery
2. **Pagination**: Implement infinite scroll or load-more functionality
3. **Unread Counts**: Display unread message counts in conversation lists
4. **Message Status**: Show read/unread status and edit indicators
5. **Error Handling**: Display appropriate error messages to users

## Testing

The module includes comprehensive unit tests covering:
- Message CRUD operations
- Conversation management
- Pagination logic
- Error handling scenarios
- Permission checks

Run tests with:
```bash
npm run test messages.service.spec.ts
```
