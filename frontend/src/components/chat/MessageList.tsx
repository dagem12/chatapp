import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
} from '@mui/material';
import type { Message, MessageStatus } from '../../types';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
  console.log('📋 MessageList received messages:', {
    messageCount: messages.length,
    messages: messages.map(m => ({
      id: m.id,
      content: m.content,
      senderId: m.senderId,
      createdAt: m.createdAt
    }))
  });

  const getStatusIcon = (status: MessageStatus | string) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      case 'failed':
        return '❌';
      default:
        return '✓';
    }
  };

  const getStatusColor = (status: MessageStatus | string) => {
    switch (status) {
      case 'pending':
        return 'text.secondary';
      case 'sent':
        return 'text.secondary';
      case 'delivered':
        return 'text.secondary';
      case 'read':
        return 'primary.main';
      case 'failed':
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  const formatTimestamp = (timestamp: Date | string) => {
    if (!timestamp) return 'Invalid Date';
    const messageDate = new Date(timestamp);
    if (isNaN(messageDate.getTime())) return 'Invalid Date';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    
    // If message is from today, show time only
    if (messageDay.getTime() === today.getTime()) {
      return messageDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
    }
    
    // If message is from yesterday or older, show date and time
    return messageDate.toLocaleString([], { 
      month: 'short',
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateSeparator = (timestamp: Date | string) => {
    if (!timestamp) return 'Invalid Date';
    const messageDate = new Date(timestamp);
    if (isNaN(messageDate.getTime())) return 'Invalid Date';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

    if (messageDay.getTime() === today.getTime()) {
      return 'Today';
    } else if (messageDay.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      // Check if it's within the current week
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      if (messageDay.getTime() > weekAgo.getTime()) {
        return messageDate.toLocaleDateString([], { 
          weekday: 'long'
        });
      } else {
        return messageDate.toLocaleDateString([], { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
    }
  };

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;
    
    const currentTimestamp = currentMessage.timestamp || currentMessage.createdAt;
    const previousTimestamp = previousMessage.timestamp || previousMessage.createdAt;
    
    if (!currentTimestamp || !previousTimestamp) return true;
    
    const currentDate = new Date(currentTimestamp);
    const previousDate = new Date(previousTimestamp);
    
    if (isNaN(currentDate.getTime()) || isNaN(previousDate.getTime())) return true;
    
    return currentDate.toDateString() !== previousDate.toDateString();
  };

  const shouldShowAvatar = (currentMessage: Message, nextMessage?: Message) => {
    if (!nextMessage) return true;
    
    const currentSenderId = currentMessage.senderId || currentMessage.sender?.id;
    const nextSenderId = nextMessage.senderId || nextMessage.sender?.id;
    
    return currentSenderId !== nextSenderId;
  };

  const shouldShowSenderName = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;
    
    const currentSenderId = currentMessage.senderId || currentMessage.sender?.id;
    const previousSenderId = previousMessage.senderId || previousMessage.sender?.id;
    
    if (currentSenderId === currentUserId) return false;
    
    return currentSenderId !== previousSenderId;
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
        const messageSenderId = message.senderId || message.sender?.id;
        const isOwnMessage = messageSenderId === currentUserId;
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
                  label={formatDateSeparator(message.timestamp || message.createdAt)}
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
                  {/* Show the sender's username initial */}
                  {(message.sender?.username || 'U').charAt(0).toUpperCase()}
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
                    {message.sender?.username || `User ${(message.senderId || message.sender?.id || 'Unknown').substring(0, 8)}`}
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
                  {formatTimestamp(message.timestamp || message.createdAt)}
                  {isOwnMessage && (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ 
                        ml: 0.5,
                        color: getStatusColor(message.status || (message.isRead ? 'read' : 'sent'))
                      }}
                    >
                      {getStatusIcon(message.status || (message.isRead ? 'read' : 'sent'))}
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
