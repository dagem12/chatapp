# Chat App Frontend

A modern, real-time chat application built with React, TypeScript, Material-UI, and Socket.IO.

## 🚀 Features

- **Real-time messaging** with Socket.IO
- **User authentication** (Login/Register) with JWT
- **Responsive design** that works on desktop and mobile
- **Material-UI components** for a polished interface
- **Conversation management** with search functionality
- **Online/offline status** indicators
- **Unread message counts** and notifications
- **Message history** with pagination
- **User search** to start new conversations

## 🛠️ Tech Stack

- **React 19** with TypeScript
- **Material-UI (MUI)** for UI components
- **Socket.IO Client** for real-time communication
- **Axios** for HTTP requests
- **React Router** for navigation
- **Vite** for fast development and building

## 📦 Installation

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

## 🏗️ Build for Production

```bash
# Build the app
npm run build

# Preview the production build
npm run preview
```

## 🐳 Docker Deployment

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

## 📱 Screenshots

### Login Screen
![Login Screen](screenshots/login.png)
*Clean and modern login interface with form validation*

### Register Screen
![Register Screen](screenshots/register.png)
*User registration with password confirmation and validation*

### Chat Interface - Desktop
![Chat Desktop](screenshots/chat-desktop.png)
*Full desktop chat interface with sidebar and main chat window*

### Chat Interface - Mobile
![Chat Mobile](screenshots/chat-mobile.png)
*Responsive mobile interface with collapsible sidebar*

### Conversation Sidebar
![Sidebar](screenshots/sidebar.png)
*Conversation list with search, unread counts, and online status*

## 🏗️ Project Structure

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

## 🔧 Configuration

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

## 🎨 Customization

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

## 🧪 Development

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

### Adding New Features

1. Create components in appropriate folders
2. Add TypeScript interfaces in `src/types/`
3. Update services if new API calls are needed
4. Add routes in `src/App.tsx` if needed
5. Update this README with new features

## 🚨 Troubleshooting

### Common Issues

1. **Connection refused errors**
   - Ensure the backend server is running
   - Check the `VITE_API_URL` and `VITE_SOCKET_URL` environment variables

2. **Authentication not working**
   - Check if JWT tokens are being stored in localStorage
   - Verify API endpoints are correct
   - Check browser console for errors

3. **Real-time messages not working**
   - Ensure Socket.IO connection is established
   - Check browser network tab for WebSocket connections
   - Verify backend Socket.IO server is running

4. **Build issues**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check for TypeScript errors: `npm run build`

### Debug Mode

Enable debug mode by setting localStorage:
```javascript
localStorage.setItem('debug', 'socket.io-client:*');
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section above
- Review the backend documentation for API-related issues