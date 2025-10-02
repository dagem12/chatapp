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
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton 
          onClick={() => navigate('/chat')}
          sx={{ 
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Profile Settings
        </Typography>
      </Box>

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Profile updated successfully!
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: 4,
          alignItems: { xs: 'center', md: 'flex-start' }
        }}>
          {/* Avatar Section */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 2,
            minWidth: { md: '200px' }
          }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={user.avatar}
                sx={{ 
                  width: 120, 
                  height: 120,
                  border: `4px solid ${theme.palette.primary.main}`,
                  fontSize: '2rem',
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
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                  },
                }}
              >
                <PhotoCameraIcon fontSize="small" />
              </IconButton>
            </Box>
            <Typography variant="h6" fontWeight="bold">
              {user.username}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.isOnline ? 'Online' : 'Offline'}
            </Typography>
          </Box>

          {/* Profile Information */}
          <Box sx={{ flex: 1, width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                Profile Information
              </Typography>
              {!isEditing && (
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                >
                  Edit Profile
                </Button>
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />

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
                  <Typography variant="body1" sx={{ p: 2, bgcolor: alpha(theme.palette.grey[100], 0.5), borderRadius: 2 }}>
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
                  <Typography variant="body1" sx={{ p: 2, bgcolor: alpha(theme.palette.grey[100], 0.5), borderRadius: 2 }}>
                    {user.email}
                  </Typography>
                )}
              </Box>

              {/* User ID (Read-only) */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  User ID
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, bgcolor: alpha(theme.palette.grey[100], 0.3), borderRadius: 2 }}>
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
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

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
