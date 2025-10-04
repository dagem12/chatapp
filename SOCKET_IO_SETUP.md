# Socket.IO Real-time Implementation

This document describes the real-time Socket.IO implementation for the chat application.

## Backend Implementation

### Messages Gateway (`backend/src/messages/messages.gateway.ts`)

The `MessagesGateway` class handles all real-time communication:

#### Features:
- **Authentication**: JWT token validation for socket connections
- **User Presence**: Tracks online/offline users
- **Room Management**: Users can join/leave conversation rooms
- **Real-time Messaging**: Instant message delivery
- **Typing Indicators**: Shows when users are typing
- **Message Read Status**: Tracks when messages are read

#### Events Handled:
- `joinConversation`: Join a conversation room
- `leaveConversation`: Leave a conversation room
- `sendMessage`: Send a new message
- `markAsRead`: Mark messages as read
- `typing`: Send typing status

#### Events Emitted:
- `newMessage`: New message received
- `messagesRead`: Messages marked as read
- `userOnline`: User came online
- `userOffline`: User went offline
- `userTyping`: User typing status
- `userJoinedConversation`: User joined conversation
- `userLeftConversation`: User left conversation

### Configuration

The gateway is configured with:
- **Namespace**: `/chat`
- **CORS**: Configured for frontend URL
- **Authentication**: JWT token validation
- **Room Management**: Conversation-based rooms

## Frontend Implementation

### Socket Service (`frontend/src/services/socket.ts`)

The `SocketService` class provides a clean interface for Socket.IO communication:

#### Features:
- **Auto-reconnection**: Exponential backoff retry logic
- **Connection Management**: Handles connect/disconnect events
- **Event Listeners**: Comprehensive event handling
- **Error Handling**: Graceful error management

#### Methods:
- `connect(token)`: Connect to socket server
- `disconnect()`: Disconnect from server
- `joinConversation(id)`: Join conversation room
- `leaveConversation(id)`: Leave conversation room
- `sendMessage(message)`: Send message
- `markAsRead(ids, conversationId)`: Mark messages as read
- `sendTyping(conversationId, isTyping)`: Send typing status

### Integration with React Hooks

#### useAuth Hook
- Automatically connects to socket on login
- Disconnects on logout
- Handles token-based authentication

#### useChat Hook
- Manages real-time message updates
- Handles user presence changes
- Updates conversation states
- Manages typing indicators

### UI Components

#### TypingIndicator (`frontend/src/components/chat/TypingIndicator.tsx`)
- Shows animated typing indicators
- Handles multiple users typing
- Auto-hides after timeout

#### OnlineStatus (`frontend/src/components/common/OnlineStatus.tsx`)
- Visual indicator for user online status
- Animated pulse effect for online users
- Tooltip with status information

## Real-time Features

### 1. Instant Messaging
- Messages are sent and received in real-time
- No page refresh required
- Automatic message delivery confirmation

### 2. User Presence
- Real-time online/offline status
- Visual indicators in conversation list
- Status updates in chat headers

### 3. Typing Indicators
- Shows when other users are typing
- Multiple user support
- Auto-timeout after inactivity

### 4. Message Read Status
- Tracks when messages are read
- Real-time read receipt updates
- Visual indicators for read status

### 5. Connection Management
- Automatic reconnection on network issues
- Connection status monitoring
- Graceful error handling

## Security

### Authentication
- JWT token validation on connection
- Token extraction from multiple sources:
  - Authorization header
  - Query parameters
  - Auth object
- Automatic disconnection on invalid tokens

### Authorization
- Conversation participation verification
- Room-based access control
- User permission validation

## Performance

### Optimization Features
- Room-based message broadcasting
- Efficient user presence tracking
- Minimal data transfer
- Connection pooling

### Scalability
- Namespace isolation
- Room-based message distribution
- Efficient user tracking
- Memory-conscious implementation

## Usage

### Backend
The gateway is automatically initialized when the MessagesModule is loaded. No additional configuration is required.

### Frontend
The socket service is automatically connected when users log in and disconnected when they log out. All real-time features work automatically once the user is authenticated.

## Environment Variables

### Backend
- `FRONTEND_URL`: Frontend URL for CORS configuration
- `JWT_SECRET`: JWT secret for token validation

### Frontend
- `VITE_API_BASE_URL`: Backend API URL for socket connection

## Testing

To test the real-time features:

1. Open the application in multiple browser tabs/windows
2. Log in with different users
3. Create a conversation between users
4. Send messages and observe real-time delivery
5. Test typing indicators
6. Test user presence (online/offline status)
7. Test message read receipts

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check CORS configuration and backend URL
2. **Authentication Errors**: Verify JWT token validity
3. **Messages Not Received**: Check room joining logic
4. **Typing Indicators Not Working**: Verify event listener setup

### Debug Mode
Enable debug logging by setting the appropriate log level in the backend configuration.
