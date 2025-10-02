import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, updateProfile, loading, error } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSave = async () => {
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
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    // TODO: Implement avatar upload
    console.log('Avatar upload clicked');
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
        <Grid container spacing={4}>
          {/* Avatar Section */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
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
          </Grid>

          {/* Profile Information */}
          <Grid item xs={12} md={8}>
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
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={loading}
                    sx={{ 
                      borderRadius: 2,
                      px: 3,
                      py: 1.5,
                    }}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    disabled={loading}
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
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};
