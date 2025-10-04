import React from 'react';
import { Box, Tooltip } from '@mui/material';

interface OnlineStatusProps {
  isOnline: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const OnlineStatus: React.FC<OnlineStatusProps> = ({ 
  isOnline, 
  size = 'medium' 
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 8, height: 8 };
      case 'large':
        return { width: 12, height: 12 };
      default:
        return { width: 10, height: 10 };
    }
  };

  const sizeProps = getSize();

  return (
    <Tooltip title={isOnline ? 'Online' : 'Offline'} arrow>
      <Box
        sx={{
          ...sizeProps,
          borderRadius: '50%',
          backgroundColor: isOnline ? '#4caf50' : '#9e9e9e',
          border: '2px solid white',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
          position: 'relative',
          '&::after': isOnline ? {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60%',
            height: '60%',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            animation: 'pulse 2s infinite',
          } : {},
          '@keyframes pulse': {
            '0%': {
              transform: 'translate(-50%, -50%) scale(1)',
              opacity: 1,
            },
            '50%': {
              transform: 'translate(-50%, -50%) scale(1.2)',
              opacity: 0.7,
            },
            '100%': {
              transform: 'translate(-50%, -50%) scale(1)',
              opacity: 1,
            },
          },
        }}
      />
    </Tooltip>
  );
};
