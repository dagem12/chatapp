import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Avatar,
  Badge,
  InputAdornment,
} from '@mui/material';
import {
  Send,
  AttachFile,
  MoreVert,
} from '@mui/icons-material';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import MessageList from './MessageList';

const ChatWindow: React.FC = () => {
  const { user } = useAuth();
  const { currentConversation, messages, sendMessage } = useChat();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || !currentConversation) {
      return;
    }

    sendMessage(messageText.trim());
    setMessageText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const getOtherParticipant = () => {
    if (!currentConversation || !user) return null;
    return currentConversation.participants.find(p => p.id !== user.id);
  };

  const otherParticipant = getOtherParticipant();

  if (!currentConversation) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          p: 3,
        }}
      >
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Welcome to Chat App
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          Select a conversation from the sidebar to start chatting, or create a new conversation.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Chat Header */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          borderRadius: 0,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
              color={otherParticipant?.isOnline ? 'success' : 'default'}
            >
              <Avatar>
                {otherParticipant?.username.charAt(0).toUpperCase()}
              </Avatar>
            </Badge>
            
            <Box>
              <Typography variant="h6">
                {otherParticipant?.username}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {otherParticipant?.isOnline ? 'Online' : 'Offline'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton>
              <AttachFile />
            </IconButton>
            <IconButton>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: 'grey.50',
        }}
      >
        <MessageList messages={messages} currentUserId={user?.id || ''} />
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          borderRadius: 0,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Box
          component="form"
          onSubmit={handleSendMessage}
          sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type="submit"
                    disabled={!messageText.trim()}
                    color="primary"
                    sx={{
                      '&:disabled': {
                        color: 'text.disabled',
                      },
                    }}
                  >
                    <Send />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatWindow;
