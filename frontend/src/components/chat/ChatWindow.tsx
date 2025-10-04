import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Avatar,
  Badge,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Send,
} from '@mui/icons-material';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { socketService } from '../../services/socket';
import MessageList from './MessageList';
import { TypingIndicator } from './TypingIndicator';

const ChatWindow: React.FC = () => {
  const { user } = useAuth();
  const { 
    currentConversation, 
    messages, 
    sendMessage, 
    loadMoreMessages, 
    isLoadingMoreMessages,
    messagesPagination,
    markRecentMessagesAsRead
  } = useChat();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const previousMessageCountRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);

  // Auto-scroll to bottom when new messages arrive (but not when loading old messages)
  useEffect(() => {
    const currentMessageCount = messages.length;
    const previousMessageCount = previousMessageCountRef.current;
    
    // Always auto-scroll on initial load
    if (isInitialLoadRef.current) {
      scrollToBottom();
      isInitialLoadRef.current = false;
    }
    // Only auto-scroll if new messages were added (not when loading old messages)
    else if (currentMessageCount > previousMessageCount && !isLoadingMoreMessages) {
      scrollToBottom();
    }
    
    // Update the previous count
    previousMessageCountRef.current = currentMessageCount;
  }, [messages, isLoadingMoreMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Infinite scroll handler for messages
  const handleMessagesScroll = useCallback(() => {
    const element = messagesContainerRef.current;
    if (!element) return;

    const { scrollTop } = element;
    const isNearTop = scrollTop < 100; // Load more when near the top (for older messages)

    if (isNearTop && messagesPagination?.hasNext && !isLoadingMoreMessages) {
      loadMoreMessages();
    }
  }, [messagesPagination, isLoadingMoreMessages, loadMoreMessages]);

  // Add scroll event listener for infinite scrolling
  useEffect(() => {
    const element = messagesContainerRef.current;
    if (!element) return;

    element.addEventListener('scroll', handleMessagesScroll);
    return () => element.removeEventListener('scroll', handleMessagesScroll);
  }, [handleMessagesScroll]);

  // Mark recent messages as read when new messages arrive (for read receipts)
  // Use a ref to track the last processed message count to avoid excessive calls
  const lastProcessedMessageCountRef = useRef<number>(0);
  
  useEffect(() => {
    if (currentConversation && messages.length > 0 && messages.length !== lastProcessedMessageCountRef.current) {
      // Only process if message count actually changed
      lastProcessedMessageCountRef.current = messages.length;
      
      // Small delay to ensure message is processed
      const timeoutId = setTimeout(() => {
        markRecentMessagesAsRead();
      }, 500); // Increased delay to reduce frequency
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, currentConversation, markRecentMessagesAsRead]);

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

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageText(value);

    if (!currentConversation) return;

    // Send typing status
    socketService.sendTyping(currentConversation.id, value.length > 0);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendTyping(currentConversation.id, false);
    }, 1000);
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const getOtherParticipant = () => {
    if (!currentConversation || !user) return null;
    
    // Find the other participant (not the current user)
    const otherParticipant = currentConversation.participants.find(p => p.id !== user.id);
    
    // If no other participant found, log for debugging
    if (!otherParticipant) {
      console.warn('No other participant found in conversation:', {
        currentUserId: user.id,
        participants: currentConversation.participants.map(p => ({ id: p.id, username: p.username }))
      });
    }
    
    return otherParticipant;
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
                {otherParticipant?.username?.charAt(0).toUpperCase() || '?'}
              </Avatar>
            </Badge>
            
            <Box>
              <Typography variant="h6">
                {otherParticipant?.username || 'Unknown User'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {otherParticipant?.isOnline ? 'Online' : 'Offline'}
              </Typography>
            </Box>
          </Box>

        </Box>
      </Paper>

      {/* Messages Area */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: 'grey.50',
        }}
      >
        {/* Loading more messages indicator at the top */}
        {isLoadingMoreMessages && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="caption" sx={{ ml: 1 }}>
              Loading older messages...
            </Typography>
          </Box>
        )}
        
        <MessageList messages={messages} currentUserId={user?.id || ''} />
        {currentConversation && (
          <TypingIndicator 
            conversationId={currentConversation.id} 
            currentUserId={user?.id || ''} 
          />
        )}
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
            onChange={handleTyping}
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
