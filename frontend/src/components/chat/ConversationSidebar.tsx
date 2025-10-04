import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Badge,
  Chip,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search,
  Add,
  PersonAdd,
} from '@mui/icons-material';
import { useChat } from '../../hooks/useChat';
import type { User } from '../../types';

interface ConversationSidebarProps {
  onConversationSelect?: () => void;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({ 
  onConversationSelect 
}) => {
  const {
    conversations,
    currentConversation,
    selectConversation,
    searchUsers,
    createConversation,
    isLoading,
    error,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState(conversations);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Filter conversations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conv =>
        conv.otherParticipant.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  }, [conversations, searchQuery]);

  // Search for users when creating new chat
  useEffect(() => {
    const searchForUsers = async () => {
      if (userSearchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setSearchingUsers(true);
      try {
        const results = await searchUsers(userSearchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setSearchingUsers(false);
      }
    };

    const debounceTimer = setTimeout(searchForUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [userSearchQuery, searchUsers]);

  const handleConversationClick = async (conversationId: string) => {
    await selectConversation(conversationId);
    onConversationSelect?.();
  };

  const handleNewChatOpen = () => {
    setNewChatOpen(true);
    setUserSearchQuery('');
    setSearchResults([]);
  };

  const handleNewChatClose = () => {
    setNewChatOpen(false);
    setUserSearchQuery('');
    setSearchResults([]);
  };

  const handleStartConversation = async (user: User) => {
    const conversationId = await createConversation([user.id]);
    if (conversationId) {
      handleNewChatClose();
      await selectConversation(conversationId);
      onConversationSelect?.();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateMessage = (message: string, maxLength: number = 50) => {
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search Bar */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1 }}
        />
        
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Add />}
          onClick={handleNewChatOpen}
          size="small"
        >
          New Chat
        </Button>
      </Box>

      {/* Conversations List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : filteredConversations.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {!searchQuery && 'Start a new conversation to get chatting!'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredConversations.map((conversation) => (
              <ListItem key={conversation.id} disablePadding>
                <ListItemButton
                  onClick={() => handleConversationClick(conversation.id)}
                  selected={currentConversation?.id === conversation.id}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
                      color={conversation.otherParticipant.isOnline ? 'success' : 'default'}
                    >
                      <Avatar>
                        {conversation.otherParticipant.username.charAt(0).toUpperCase()}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* Primary content */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="subtitle2" noWrap>
                        {conversation.otherParticipant.username}
                      </Typography>
                      {conversation.lastMessage && (
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(conversation.lastMessage.timestamp)}
                        </Typography>
                      )}
                    </Box>
                    
                    {/* Secondary content */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ flex: 1 }}>
                        {conversation.lastMessage 
                          ? truncateMessage(conversation.lastMessage.content)
                          : 'No messages yet'
                        }
                      </Typography>
                      {conversation.unreadCount > 0 && (
                        <Chip
                          label={conversation.unreadCount}
                          size="small"
                          color="primary"
                          sx={{ ml: 1, minWidth: 20, height: 20 }}
                        />
                      )}
                    </Box>
                  </Box>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* New Chat Dialog */}
      <Dialog
        open={newChatOpen}
        onClose={handleNewChatClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAdd />
            Start New Conversation
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            placeholder="Search for users..."
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          {searchingUsers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : searchResults.length > 0 ? (
            <List>
              {searchResults.map((user) => (
                <ListItem key={user.id} disablePadding>
                  <ListItemButton onClick={() => handleStartConversation(user)}>
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        color={user.isOnline ? 'success' : 'default'}
                      >
                        <Avatar>
                          {user.username.charAt(0).toUpperCase()}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.username}
                      secondary={user.email}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          ) : userSearchQuery.length >= 2 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 2 }}>
              No users found
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 2 }}>
              Type at least 2 characters to search for users
            </Typography>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleNewChatClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConversationSidebar;
