import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
} from '@mui/material';
import type { Message } from '../../types';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
  const formatTimestamp = (timestamp: Date) => {
    if (!timestamp) return 'Invalid Date';
    const messageDate = new Date(timestamp);
    if (isNaN(messageDate.getTime())) return 'Invalid Date';
    return messageDate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDateSeparator = (timestamp: Date) => {
    if (!timestamp) return 'Invalid Date';
    const messageDate = new Date(timestamp);
    if (isNaN(messageDate.getTime())) return 'Invalid Date';
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString([], { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;
    if (!currentMessage.timestamp || !previousMessage.timestamp) return true;
    
    const currentDate = new Date(currentMessage.timestamp);
    const previousDate = new Date(previousMessage.timestamp);
    
    if (isNaN(currentDate.getTime()) || isNaN(previousDate.getTime())) return true;
    
    return currentDate.toDateString() !== previousDate.toDateString();
  };

  const shouldShowAvatar = (currentMessage: Message, nextMessage?: Message) => {
    if (!nextMessage) return true;
    
    return currentMessage.senderId !== nextMessage.senderId;
  };

  const shouldShowSenderName = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;
    if (currentMessage.senderId === currentUserId) return false;
    
    return currentMessage.senderId !== previousMessage.senderId;
  };

  if (messages.length === 0) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Typography variant="body1" color="text.secondary" textAlign="center">
          No messages yet. Start the conversation by sending a message!
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {messages.map((message, index) => {
        const isOwnMessage = message.senderId === currentUserId;
        const previousMessage = index > 0 ? messages[index - 1] : undefined;
        const nextMessage = index < messages.length - 1 ? messages[index + 1] : undefined;
        
        const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
        const showAvatar = shouldShowAvatar(message, nextMessage);
        const showSenderName = shouldShowSenderName(message, previousMessage);

        return (
          <React.Fragment key={message.id}>
            {/* Date Separator */}
            {showDateSeparator && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <Chip
                  label={formatDateSeparator(message.timestamp)}
                  size="small"
                  variant="outlined"
                  sx={{ backgroundColor: 'background.paper' }}
                />
              </Box>
            )}

            {/* Message */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                mb: showAvatar ? 2 : 0.5,
                alignItems: 'flex-end',
              }}
            >
              {/* Avatar for other users */}
              {!isOwnMessage && (
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    mr: 1,
                    visibility: showAvatar ? 'visible' : 'hidden',
                  }}
                >
                  {/* This would typically show the sender's avatar */}
                  {message.senderId.charAt(0).toUpperCase()}
                </Avatar>
              )}

              <Box
                sx={{
                  maxWidth: '70%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                }}
              >
                {/* Sender Name */}
                {showSenderName && !isOwnMessage && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, ml: 1 }}
                  >
                    {/* This would typically show the sender's name */}
                    User {message.senderId.substring(0, 8)}
                  </Typography>
                )}

                {/* Message Bubble */}
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    backgroundColor: isOwnMessage ? 'primary.main' : 'background.paper',
                    color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
                    borderRadius: 2,
                    borderTopLeftRadius: !isOwnMessage && !showAvatar ? 1 : 2,
                    borderTopRightRadius: isOwnMessage && !showAvatar ? 1 : 2,
                    wordBreak: 'break-word',
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Typography>
                </Paper>

                {/* Timestamp */}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    mt: 0.5,
                    mx: 1,
                    fontSize: '0.7rem',
                  }}
                >
                  {formatTimestamp(message.timestamp)}
                  {isOwnMessage && message.isRead && (
                    <Typography
                      component="span"
                      variant="caption"
                      color="primary.main"
                      sx={{ ml: 0.5 }}
                    >
                      ✓✓
                    </Typography>
                  )}
                </Typography>
              </Box>
            </Box>
          </React.Fragment>
        );
      })}
    </Box>
  );
};

export default MessageList;
