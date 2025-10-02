export const config = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Chat App',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
};
