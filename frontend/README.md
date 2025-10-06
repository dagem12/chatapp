# Chat App Frontend

A modern, real-time chat application built with React, TypeScript, Material-UI, and Socket.IO.

## Features

- **Real-time messaging** with Socket.IO
- **User authentication** (Login/Register) with JWT
- **Responsive design** that works on desktop and mobile
- **Material-UI components** for a polished interface
- **Conversation management** with search functionality
- **Online/offline status** indicators
- **Unread message counts** and notifications
- **Message history** with pagination
- **User search** to start new conversations

## Tech Stack

- **React 19** with TypeScript
- **Material-UI (MUI)** for UI components
- **Socket.IO Client** for real-time communication
- **Axios** for HTTP requests
- **React Router** for navigation
- **Vite** for fast development and building

## Installation

### Prerequisites

- Node.js 20+ 
- npm or yarn
- Backend API server running (see backend documentation)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:3001/api
   VITE_SOCKET_URL=http://localhost:3001
   VITE_APP_NAME=Chat App
   VITE_APP_VERSION=1.0.0
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## Build for Production

```bash
# Build the app
npm run build

# Preview the production build
npm run preview
```

## Docker Deployment

### Using Docker

1. **Build the Docker image**
   ```bash
   docker build -t chat-app-frontend .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:80 \
     -e VITE_API_URL=http://your-api-url/api \
     -e VITE_SOCKET_URL=http://your-socket-url \
     chat-app-frontend
   ```

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Screenshots

### Authentication

#### Login Screen - Web
![Login Web](screenshots/Login_web.png)
*Clean and modern login interface with form validation*

#### Login Screen - Mobile
![Login Mobile](screenshots/Login_Mobile.png)
*Responsive mobile login interface*

#### Register Screen - Web
![Register Web](screenshots/Register_web.png)
*User registration with password confirmation and validation*

#### Register Screen - Mobile
![Register Mobile](screenshots/Register_Mobile.png)
*Mobile registration interface*

### Chat Interface

#### Chat Screen - Web
![Chat Web](screenshots/Chat_screen_web.png)
*Full desktop chat interface with sidebar and main chat window*

#### Chat Screen - Web (Alternative View)
![Chat Web 2](screenshots/Chat_screen2_web.png)
*Desktop chat interface showing conversation details*

#### Chat Screen - Mobile
![Chat Mobile](screenshots/Chat_Screen_Mobile.png)
*Responsive mobile interface with collapsible sidebar*

### Conversation Management

#### Conversation Sidebar
![Conversation Sidebar](screenshots/Conversation_Sidebar.png)
*Conversation list with search, unread counts, and online status*

#### Search for Messages
![Search Messages](screenshots/search_for_message.png)
*Search functionality to find specific messages in conversations*

### New Conversation

#### Start New Conversation - Web
![New Chat Web](screenshots/Start_New_Conversation_web.png)
*Create new conversation interface on desktop*

#### Start New Conversation - Mobile
![New Chat Mobile](screenshots/Start_New_Conversation_Mobile.png)
*Mobile interface for starting new conversations*

#### User Search - Web
![User Search Web](screenshots/Start_New_Conversation_Search_web.png)
*Search for users to start conversations on desktop*

#### User Search - Mobile
![User Search Mobile](screenshots/Start_New_Conversation_Search_Mobile.png)
*Mobile user search interface*

###  & User Menu


### Navigation & User Profile

#### Header Navigation - Web
![Header Navigation](screenshots/Header_Navigation_web.png)
*Top navigation bar showing profile button and user menu access*


#### Profile Settings - Web
![Profile Web](screenshots/profile_setting_web.png)
*User profile and settings interface*


## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── auth/            # Authentication components
│   ├── chat/            # Chat-related components
│   ├── common/          # Common/shared components
│   └── layout/          # Layout components
├── hooks/               # Custom React hooks
│   ├── useAuth.tsx      # Authentication context & hooks
│   └── useChat.tsx      # Chat context & hooks
├── pages/               # Page components
│   ├── Login.tsx        # Login page
│   ├── Register.tsx     # Register page
│   └── Chat.tsx         # Main chat page
├── services/            # API and external services
│   ├── api.ts           # HTTP client configuration
│   ├── auth.ts          # Authentication service
│   ├── chat.ts          # Chat API service
│   └── socket.ts        # Socket.IO service
├── types/               # TypeScript type definitions
│   └── index.ts         # All type definitions
├── config/              # Configuration files
│   └── env.ts           # Environment configuration
└── utils/               # Utility functions
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3001/api` |
| `VITE_SOCKET_URL` | Socket.IO server URL | `http://localhost:3001` |
| `VITE_APP_NAME` | Application name | `Chat App` |
| `VITE_APP_VERSION` | Application version | `1.0.0` |

### API Endpoints

The frontend expects the following API endpoints:

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `GET /api/conversations` - Get user conversations
- `GET /api/conversations/:id` - Get specific conversation
- `GET /api/conversations/:id/messages` - Get conversation messages
- `POST /api/conversations` - Create new conversation
- `POST /api/conversations/:id/messages` - Send message
- `PUT /api/messages/mark-read` - Mark messages as read
- `GET /api/users/search` - Search users

### Socket.IO Events

**Client to Server:**
- `join-conversation` - Join a conversation room
- `leave-conversation` - Leave a conversation room
- `send-message` - Send a new message
- `mark-as-read` - Mark messages as read

**Server to Client:**
- `new-message` - Receive new message
- `message-read` - Message read confirmation
- `user-online` - User came online
- `user-offline` - User went offline
- `conversation-updated` - Conversation was updated

## Customization

### Theming

The app uses Material-UI's theming system. You can customize the theme in `src/App.tsx`:

```typescript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Change primary color
    },
    secondary: {
      main: '#dc004e', // Change secondary color
    },
  },
  // Add more customizations
});
```

### Responsive Breakpoints

The app is responsive and uses Material-UI's breakpoint system:
- `xs`: 0px and up (mobile)
- `sm`: 600px and up (tablet)
- `md`: 900px and up (desktop)
- `lg`: 1200px and up (large desktop)
- `xl`: 1536px and up (extra large)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

The project uses:
- **ESLint** for code linting
- **TypeScript** for type safety
- **Prettier** for code formatting (recommended)
`

### Debug Mode

Enable debug mode by setting localStorage:
```javascript
localStorage.setItem('debug', 'socket.io-client:*');
```
