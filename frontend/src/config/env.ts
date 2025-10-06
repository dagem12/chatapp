export const config = {
  API_URL: import.meta.env.VITE_API_URL || 'http://196.189.149.214:3000',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://196.189.149.214:3000',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Chat App',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
};
