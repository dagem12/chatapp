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
   VITE_API_URL=http://localhost:3000
   VITE_SOCKET_URL=http://localhost:3000
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

The frontend includes Docker deployment with multi-stage build and automatic Nginx configuration.

### Quick Start

**Automated Setup:**
```bash
# Linux/macOS
chmod +x setup-docker.sh
./setup-docker.sh


**Manual Setup:**
```bash
# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Build and start containers
docker-compose up -d --build
```

**Direct Docker Build:**
```bash
# Build the Docker image
docker build -t chat-app-frontend .

# Run the container
docker run -p 3000:80 \
  -e VITE_API_URL=http://localhost:3000 \
  -e VITE_SOCKET_URL=http://localhost:3000 \
  chat-app-frontend
```

### Docker Build Process

The Dockerfile uses a multi-stage build:

1. **Builder Stage**: 
   - Uses Node.js 20 Alpine
   - Installs dependencies and builds the React app
   - Creates optimized production build in `/app/dist`

2. **Production Stage**:
   - Uses Nginx Alpine (lightweight)
   - Copies built files to `/usr/share/nginx/html`
   - Copies nginx configuration and .env file
   - Serves static files and proxies API calls

### Nginx Configuration

The Docker container automatically detects if Nginx is installed on the host:

**When Nginx is detected (Proxy Mode):**
- Container runs on port 3000 (configurable via `FRONTEND_PORT`)
- Configure host Nginx to proxy to `http://localhost:3000`

**When no Nginx is detected (Standalone Mode):**
- Container runs on port 80 with built-in Nginx
- Access directly at `http://localhost:80`
- Built-in Nginx handles both frontend and backend proxying

### Environment Configuration

Create `.env` file:
```env
# Port Configuration
FRONTEND_PORT=3000                    # Port where frontend container runs
NGINX_PORT=80                         # Port for nginx-proxy service
NGINX_SSL_PORT=443                    # Port for SSL/HTTPS (optional)

# Backend Configuration
BACKEND_HOST=host.docker.internal     # Backend server host (host.docker.internal for Docker)
BACKEND_PORT=3000                     # Backend server port

# Application Configuration (Vite Environment Variables)
VITE_API_URL=http://localhost:3000    # Backend API base URL (used by frontend)
VITE_SOCKET_URL=http://localhost:3000 # Socket.IO server URL (used by frontend)
VITE_APP_NAME=Chat App                # Application name displayed in UI
VITE_APP_VERSION=1.0.0                # Application version
```

**For production, update server configuration:**
```env
# Single server production example
BACKEND_HOST=192.168.1.100
BACKEND_PORT=3000
VITE_API_URL=http://yourdomain.com:3000
VITE_SOCKET_URL=http://yourdomain.com:3000
```

**For multiple backend servers (load balancing):**
```env
# Multi-server production example (backend load balancing only)
BACKEND_HOST=192.168.1.100  # Primary backend
BACKEND_PORT=3000
VITE_API_URL=http://yourdomain.com:3000
VITE_SOCKET_URL=http://yourdomain.com:3000
```

**Note:** 
- All configuration is now unified in `.env` file for both development and production
- The nginx.conf uses `${BACKEND_HOST}:${BACKEND_PORT}` from environment variables
- To enable backend load balancing, edit `nginx.conf` and uncomment the multiple server lines
- Update server IPs in nginx.conf to match your actual backend servers

### Docker Commands

```bash
# Build and start services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild without cache
docker-compose build --no-cache

# Use nginx-proxy service (optional)
docker-compose --profile proxy up -d

# Check container health
docker-compose ps

# Access container shell
docker-compose exec frontend sh

# View nginx configuration
docker-compose exec frontend cat /etc/nginx/nginx.conf
```

### Production Deployment

1. **Update environment variables** for production URLs in `.env` file
2. **Build the Docker image** with production configuration
3. **Configure SSL** (optional) by adding certificates to `ssl/` directory
4. **Deploy with docker-compose** or direct Docker commands
5. **Monitor health** using built-in health checks

**Production Build Example:**
```bash
# Build for production
docker build -t chat-app-frontend:latest .

# Run with production environment
docker run -d \
  --name chat-frontend \
  -p 80:80 \
  -e VITE_API_URL=https://api.yourdomain.com \
  -e VITE_SOCKET_URL=https://api.yourdomain.com \
  chat-app-frontend:latest
```

**Health Monitoring:**
- Health check endpoint: `http://yourdomain.com/health`
- Backend health check: `http://yourdomain.com/health/backend`
- Container health: `docker-compose ps`

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
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000` |
| `VITE_SOCKET_URL` | Socket.IO server URL | `http://localhost:3000` |
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
