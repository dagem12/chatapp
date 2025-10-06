# Chat App

A modern, real-time chat application built with React, TypeScript, NestJS, PostgreSQL, and Redis. Features real-time messaging, user authentication, responsive design, and scalable architecture.

## Overview

This is a full-stack chat application that provides real-time messaging capabilities with a modern, responsive user interface. The application is built using industry-standard technologies and follows best practices for scalability and maintainability.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (NestJS)      │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Redis Cache   │
                       └─────────────────┘
```

## Features

- **Real-time messaging** with WebSocket support
- **User authentication** with JWT tokens
- **Responsive design** for desktop and mobile
- **Message history** with pagination
- **Online/offline status** indicators
- **Unread message counts** and notifications
- **User search** and conversation management
- **Typing indicators** for real-time feedback
- **Message status** tracking (sent, delivered, read)
- **Docker support** for easy deployment
- **PM2 cluster** configuration for production

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Material-UI (MUI)** for UI components
- **Socket.IO Client** for real-time communication
- **Axios** for HTTP requests
- **React Router** for navigation
- **Vite** for fast development and building

### Backend
- **NestJS** framework with TypeScript
- **PostgreSQL** database with Prisma ORM
- **Redis** for caching and session management
- **Socket.IO** for real-time WebSocket communication
- **JWT** for authentication
- **Winston** for logging
- **Docker** for containerization

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16+
- Redis 7+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Chatapp
   ```

2. **Start with Docker (Recommended)**
   ```bash
   # Start all services
   docker-compose up -d
   
   # View logs
   docker-compose logs -f
   ```

3. **Manual Setup**
   ```bash
   # Backend setup
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run db:migrate
   npm run start:dev
   
   # Frontend setup (in another terminal)
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

## Screenshots

### Authentication

#### Login Screen - Web
![Login Web](frontend/screenshots/Login_web.png)
*Clean and modern login interface with form validation*

#### Register Screen - Web
![Register Web](frontend/screenshots/Register_web.png)
*User registration with password confirmation and validation*

### Chat Interface

#### Chat Screen - Web
![Chat Web](frontend/screenshots/Chat_screen_web.png)
*Full desktop chat interface with sidebar and main chat window*

#### Chat Screen - Web (Alternative View)
![Chat Web 2](frontend/screenshots/Chat_screen2_web.png)
*Desktop chat interface showing conversation details*


### Conversation Management

#### Conversation Sidebar
![Conversation Sidebar](frontend/screenshots/Conversation_Sidebar.png)
*Conversation list with search, unread counts, and online status*

#### Search for Messages
![Search Messages](frontend/screenshots/search_for_message.png)
*Search functionality to find specific messages in conversations*

### New Conversation

#### Start New Conversation - Web
![New Chat Web](frontend/screenshots/Start_New_Conversation_web.png)
*Create new conversation interface on desktop*

#### User Search - Web
![User Search Web](frontend/screenshots/Start_New_Conversation_Search_web.png)
*Search for users to start conversations on desktop*

### User Profile

#### Profile Settings - Web
![Profile Web](frontend/screenshots/profile_setting_web.png)
*User profile and settings interface*

## Project Structure

```
Chatapp/
├── frontend/                 # React frontend application
│   ├── src/                 # Source code
│   ├── public/              # Static assets
│   ├── screenshots/         # Application screenshots
│   ├── package.json         # Frontend dependencies
│   └── README.md            # Frontend documentation
├── backend/                 # NestJS backend application
│   ├── src/                 # Source code
│   ├── prisma/              # Database schema and migrations
│   ├── scripts/             # Utility scripts
│   ├── docs/                # Documentation
│   ├── package.json         # Backend dependencies
│   └── README.md            # Backend documentation
├── docker-compose.yml       # Docker orchestration
└── README.md               # This file
```

## Documentation

### Frontend Documentation
For detailed frontend setup, development, and deployment instructions, see:
**[Frontend README](frontend/README.md)**

### Backend Documentation
For detailed backend setup, API documentation, and deployment instructions, see:
**[Backend README](backend/README.md)**

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Conversations
- `GET /api/conversations` - Get user conversations
- `GET /api/conversations/:id` - Get specific conversation
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/:id/messages` - Get conversation messages
- `POST /api/conversations/:id/messages` - Send message

### Users
- `GET /api/users/search` - Search users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Health
- `GET /api/health` - Application health check
- `GET /api/health/db` - Database health check

## WebSocket Events

### Client to Server
- `join-conversation` - Join a conversation room
- `leave-conversation` - Leave a conversation room
- `send-message` - Send a new message
- `typing` - Send typing indicator
- `mark-as-read` - Mark messages as read

### Server to Client
- `new-message` - Receive new message
- `message-sent` - Message sent confirmation
- `message-read` - Message read confirmation
- `user-typing` - User typing indicator
- `user-online` - User came online
- `user-offline` - User went offline
- `conversation-updated` - Conversation was updated

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3002
DATABASE_URL=postgresql://user:password@localhost:5433/chat_app
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=redis123
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3002/api
VITE_SOCKET_URL=http://localhost:3002
VITE_APP_NAME=Chat App
VITE_APP_VERSION=1.0.0
```

## Deployment

### Docker Deployment
```bash
# Start all services
docker-compose up -d

# Scale backend instances
docker-compose up --scale backend=3 -d

# View logs
docker-compose logs -f
```

### Production Deployment
For production deployment with PM2 cluster configuration, see the [Backend README](backend/README.md) for detailed instructions.

## Development

### Available Scripts

#### Backend
```bash
npm run start:dev    # Start development server
npm run build        # Build for production
npm run start:prod   # Start production server
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database
```

#### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Check the documentation in the `frontend/README.md` and `backend/README.md` files
- Open an issue on GitHub
- Review the API documentation in the backend README

---

**Built with ❤️ using React, NestJS, PostgreSQL, and Redis**
