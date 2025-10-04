import React, { useState, useEffect } from 'react';
import { Box, Typography, Fade } from '@mui/material';
import { socketService } from '../../services/socket';

interface TypingUser {
  userId: string;
  username: string;
  isTyping: boolean;
  timestamp: string;
}

interface TypingIndicatorProps {
  conversationId: string;
  currentUserId: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  conversationId,
  currentUserId,
}) => {
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleUserTyping = (data: {
      userId: string;
      username: string;
      conversationId: string;
      isTyping: boolean;
      timestamp: string;
    }) => {
      if (data.conversationId !== conversationId || data.userId === currentUserId) {
        return;
      }

      setTypingUsers(prev => {
        const newMap = new Map(prev);
        
        if (data.isTyping) {
          newMap.set(data.userId, {
            userId: data.userId,
            username: data.username,
            isTyping: true,
            timestamp: data.timestamp,
          });
        } else {
          newMap.delete(data.userId);
        }
        
        return newMap;
      });
    };

    socketService.onUserTyping(handleUserTyping);

    return () => {
      socketService.removeEventListener('userTyping', handleUserTyping);
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    const hasTypingUsers = typingUsers.size > 0;
    setIsVisible(hasTypingUsers);

    // Auto-hide typing indicator after 3 seconds of no updates
    if (hasTypingUsers) {
      const timer = setTimeout(() => {
        setTypingUsers(new Map());
        setIsVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [typingUsers]);

  const getTypingText = () => {
    const users = Array.from(typingUsers.values());
    
    if (users.length === 0) return '';
    if (users.length === 1) return `${users[0].username} is typing...`;
    if (users.length === 2) return `${users[0].username} and ${users[1].username} are typing...`;
    return `${users.length} people are typing...`;
  };

  return (
    <Fade in={isVisible} timeout={300}>
      <Box
        sx={{
          height: isVisible ? 'auto' : 0,
          overflow: 'hidden',
          transition: 'height 0.3s ease-in-out',
          px: 2,
          py: 1,
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 0.5,
              '& > div': {
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                animation: 'typing 1.4s infinite ease-in-out',
                '&:nth-of-type(1)': { animationDelay: '-0.32s' },
                '&:nth-of-type(2)': { animationDelay: '-0.16s' },
              },
              '@keyframes typing': {
                '0%, 80%, 100%': {
                  transform: 'scale(0.8)',
                  opacity: 0.5,
                },
                '40%': {
                  transform: 'scale(1)',
                  opacity: 1,
                },
              },
            }}
          >
            <div />
            <div />
            <div />
          </Box>
          {getTypingText()}
        </Typography>
      </Box>
    </Fade>
  );
};
