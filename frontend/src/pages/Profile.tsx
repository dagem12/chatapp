import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  Fade,
  Slide,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  ArrowBack as ArrowBackIcon,
  Upload as UploadIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, updateProfile, updateAvatar, isLoading, error } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });
  const [formErrors, setFormErrors] = useState({
    username: '',
    email: '',
  });
  const [success, setSuccess] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [avatarTab, setAvatarTab] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    setFormErrors(prev => ({
      ...prev,
      [field]: '',
    }));
  };

  const handleSave = async () => {
    // Basic client-side validation
    const errors = {
      username: '',
      email: '',
    };

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 2) {
      errors.username = 'Username must be at least 2 characters';
    } else if (formData.username.length > 30) {
      errors.username = 'Username must be less than 30 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    setFormErrors(errors);

    // If there are errors, don't proceed
    if (errors.username || errors.email) {
      return;
    }

    try {
      await updateProfile(formData);
      setIsEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
    });
    setFormErrors({
      username: '',
      email: '',
    });
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    setAvatarDialogOpen(true);
    setAvatarUrl('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setAvatarTab(0);
  };

  const handleAvatarDialogClose = () => {
    setAvatarDialogOpen(false);
    setAvatarUrl('');
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setAvatarTab(newValue);
    setAvatarUrl('');
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarUrl(event.target.value);
  };

  const handleAvatarSave = async () => {
    try {
      if (avatarTab === 0 && selectedFile) {
        // File upload - convert to data URL for mock
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = e.target?.result as string;
          await updateAvatar(dataUrl);
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
          handleAvatarDialogClose();
        };
        reader.readAsDataURL(selectedFile);
      } else if (avatarTab === 1 && avatarUrl.trim()) {
        // URL upload
        await updateAvatar(avatarUrl.trim());
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        handleAvatarDialogClose();
      }
    } catch (err) {
      console.error('Failed to update avatar:', err);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h6" color="error">
          User not found. Please log in again.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Slide direction="down" in timeout={600}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            onClick={() => navigate('/chat')}
            sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': { 
                bgcolor: alpha(theme.palette.primary.main, 0.2),
                transform: 'scale(1.05)',
                transition: 'all 0.2s ease-in-out'
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography 
            variant="h4" 
            fontWeight="bold" 
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Profile Settings
          </Typography>
        </Box>
      </Slide>

      {/* Success Alert */}
      <Fade in={success} timeout={500}>
        <Alert 
          severity="success" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.2)}`,
          }}
        >
          Profile updated successfully!
        </Alert>
      </Fade>

      {/* Error Alert */}
      <Fade in={!!error} timeout={500}>
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.2)}`,
          }}
        >
          {error}
        </Alert>
      </Fade>

      <Slide direction="up" in timeout={800}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.08)}`,
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            }
          }}
        >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: 4,
          alignItems: { xs: 'center', md: 'flex-start' }
        }}>
          {/* Avatar Section */}
          <Fade in timeout={1000}>
            <Card sx={{ 
              p: 3,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
              minWidth: { md: '200px' }
            }}>
              <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: 2
                }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={user.avatar}
                      sx={{ 
                        width: 120, 
                        height: 120,
                        border: `4px solid ${theme.palette.primary.main}`,
                        fontSize: '2rem',
                        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
                        }
                      }}
                    >
                      {user.username?.charAt(0).toUpperCase()}
                    </Avatar>
                    <IconButton
                      onClick={handleAvatarClick}
                      sx={{
                        position: 'absolute',
                        bottom: -8,
                        right: -8,
                        bgcolor: theme.palette.primary.main,
                        color: 'white',
                        width: 40,
                        height: 40,
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          bgcolor: theme.palette.primary.dark,
                          transform: 'scale(1.1)',
                          boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.5)}`,
                        },
                      }}
                    >
                      <PhotoCameraIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ textAlign: 'center' }}>
                    {user.username}
                  </Typography>
                  <Chip
                    label={user.isOnline ? 'Online' : 'Offline'}
                    color={user.isOnline ? 'success' : 'default'}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      '& .MuiChip-label': {
                        px: 2,
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Fade>

          {/* Profile Information */}
          <Fade in timeout={1200}>
            <Box sx={{ flex: 1, width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography 
                  variant="h6" 
                  fontWeight="bold"
                  sx={{
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Profile Information
                </Typography>
                {!isEditing && (
                  <Button
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditing(true)}
                    variant="outlined"
                    sx={{ 
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      '&:hover': {
                        borderColor: theme.palette.primary.dark,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    Edit Profile
                  </Button>
                )}
              </Box>

              <Divider 
                sx={{ 
                  mb: 3,
                  background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
                  height: '2px',
                }} 
              />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Username Field */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Username
                </Typography>
                {isEditing ? (
                  <TextField
                    fullWidth
                    value={formData.username}
                    onChange={handleInputChange('username')}
                    variant="outlined"
                    error={!!formErrors.username}
                    helperText={formErrors.username}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                      }
                    }}
                  />
                ) : (
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      p: 2, 
                      bgcolor: alpha(theme.palette.grey[100], 0.5), 
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.grey[300], 0.5)}`,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                      }
                    }}
                  >
                    {user.username}
                  </Typography>
                )}
              </Box>

              {/* Email Field */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Email Address
                </Typography>
                {isEditing ? (
                  <TextField
                    fullWidth
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    variant="outlined"
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                    sx={{ 
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                      }
                    }}
                  />
                ) : (
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      p: 2, 
                      bgcolor: alpha(theme.palette.grey[100], 0.5), 
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.grey[300], 0.5)}`,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                      }
                    }}
                  >
                    {user.email}
                  </Typography>
                )}
              </Box>

              {/* User ID (Read-only) */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  User ID
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    p: 2, 
                    bgcolor: alpha(theme.palette.grey[100], 0.3), 
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.grey[300], 0.3)}`,
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                  }}
                >
                  {user.id}
                </Typography>
              </Box>

              {/* Action Buttons */}
              {isEditing && (
                <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={isLoading}
                    sx={{ 
                      borderRadius: 2,
                      px: 3,
                      py: 1.5,
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                      '&:hover': {
                        background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                      },
                      '&:disabled': {
                        background: theme.palette.grey[300],
                        color: theme.palette.grey[500],
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    disabled={isLoading}
                    sx={{ 
                      borderRadius: 2,
                      px: 3,
                      py: 1.5,
                      borderColor: theme.palette.grey[400],
                      color: theme.palette.grey[600],
                      '&:hover': {
                        borderColor: theme.palette.grey[600],
                        bgcolor: alpha(theme.palette.grey[500], 0.1),
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.grey[500], 0.3)}`,
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </Fade>
        </Box>
      </Paper>
      </Slide>

      {/* Avatar Change Dialog */}
      <Dialog 
        open={avatarDialogOpen} 
        onClose={handleAvatarDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          pb: 1,
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold'
        }}>
          Change Profile Picture
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          <Tabs 
            value={avatarTab} 
            onChange={handleTabChange} 
            centered
            sx={{ mb: 3 }}
          >
            <Tab 
              icon={<UploadIcon />} 
              label="Upload File" 
              iconPosition="start"
            />
            <Tab 
              icon={<LinkIcon />} 
              label="From URL" 
              iconPosition="start"
            />
          </Tabs>

          {avatarTab === 0 && (
            <Box sx={{ textAlign: 'center' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="avatar-file-input"
              />
              <label htmlFor="avatar-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  sx={{ 
                    mb: 2,
                    borderRadius: 2,
                    px: 3,
                    py: 1.5,
                  }}
                >
                  Choose Image File
                </Button>
              </label>
              
              {selectedFile && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Selected: {selectedFile.name}
                  </Typography>
                  {previewUrl && (
                    <Avatar
                      src={previewUrl}
                      sx={{ 
                        width: 100, 
                        height: 100, 
                        mx: 'auto',
                        border: `2px solid ${theme.palette.primary.main}`,
                      }}
                    />
                  )}
                </Box>
              )}
            </Box>
          )}

          {avatarTab === 1 && (
            <Box>
              <TextField
                fullWidth
                label="Image URL"
                value={avatarUrl}
                onChange={handleUrlChange}
                placeholder="https://example.com/image.jpg"
                variant="outlined"
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                  }
                }}
              />
              {avatarUrl && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Avatar
                    src={avatarUrl}
                    sx={{ 
                      width: 100, 
                      height: 100, 
                      mx: 'auto',
                      border: `2px solid ${theme.palette.primary.main}`,
                    }}
                    onError={() => {
                      // Handle invalid URL
                    }}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleAvatarDialogClose}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAvatarSave}
            variant="contained"
            disabled={
              (avatarTab === 0 && !selectedFile) || 
              (avatarTab === 1 && !avatarUrl.trim()) ||
              isLoading
            }
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <PhotoCameraIcon />}
            sx={{ 
              borderRadius: 2,
              px: 3,
            }}
          >
            {isLoading ? 'Updating...' : 'Update Avatar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
