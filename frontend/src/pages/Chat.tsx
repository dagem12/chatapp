import React from 'react';
import { ChatProvider } from '../hooks/useChat';
import ChatLayout from '../components/layout/ChatLayout';

const Chat: React.FC = () => {
  return (
    <ChatProvider>
      <ChatLayout />
    </ChatProvider>
  );
};

export default Chat;
