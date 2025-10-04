import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Fade,
  Slide,
  useTheme,
  alpha,
  LinearProgress,
  useMediaQuery,
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Email, 
  Lock, 
  Person,
  Chat as ChatIcon,
  ArrowForward,
  CheckCircle,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import type { RegisterCredentials } from '../types';
import registerImage from '../assets/imgs/premium_photo-1720551256983-445d23d516b2.jpg';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { register, isLoading, error, isAuthenticated, clearError } = useAuth();
  
  const [formData, setFormData] = useState<RegisterCredentials>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<RegisterCredentials>>({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Clear any previous errors when component mounts
    clearError();
  }, [clearError]);

  const getPasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength < 25) return theme.palette.error.main;
    if (strength < 50) return theme.palette.warning.main;
    if (strength < 75) return theme.palette.info.main;
    return theme.palette.success.main;
  };

  const getPasswordStrengthText = (strength: number): string => {
    if (strength < 25) return 'Weak';
    if (strength < 50) return 'Fair';
    if (strength < 75) return 'Good';
    return 'Strong';
  };

  const validateForm = (): boolean => {
    const errors: Partial<RegisterCredentials> = {};

    if (!formData.username) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof RegisterCredentials) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));

    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const success = await register(formData);
    if (success) {
      // Redirect to login page with success message
      navigate('/login', { 
        state: { 
          message: 'Registration successful! Please log in to continue.',
          type: 'success'
        } 
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(prev => !prev);
  };

  const passwordStrength = getPasswordStrength(formData.password);

  if (isMobile) {
    // Mobile layout - single column
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 3,
        }}
      >
        <Container component="main" maxWidth="sm">
          <Fade in timeout={800}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* Logo/Brand Section */}
              <Slide direction="down" in timeout={600}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 4,
                  }}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
                    }}
                  >
                    <ChatIcon sx={{ color: 'white', fontSize: 32 }} />
                  </Box>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    ChatApp
                  </Typography>
                </Box>
              </Slide>

              <RegisterForm 
                formData={formData}
                formErrors={formErrors}
                showPassword={showPassword}
                showConfirmPassword={showConfirmPassword}
                isLoading={isLoading}
                error={error}
                theme={theme}
                passwordStrength={passwordStrength}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                togglePasswordVisibility={togglePasswordVisibility}
                toggleConfirmPasswordVisibility={toggleConfirmPasswordVisibility}
                getPasswordStrengthColor={getPasswordStrengthColor}
                getPasswordStrengthText={getPasswordStrengthText}
              />
            </Box>
          </Fade>
        </Container>
      </Box>
    );
  }

  // Desktop layout - split screen
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      {/* Left Side - Form */}
      <Box 
        sx={{
          width: '35%',
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 3,
        }}
      >
          <Container component="main" maxWidth="sm">
            <Fade in timeout={800}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* Logo/Brand Section */}
                <Slide direction="down" in timeout={600}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 4,
                    }}
                  >
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
                      }}
                    >
                      <ChatIcon sx={{ color: 'white', fontSize: 32 }} />
                    </Box>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 700,
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      ChatApp
                    </Typography>
                  </Box>
                </Slide>

                <RegisterForm 
                  formData={formData}
                  formErrors={formErrors}
                  showPassword={showPassword}
                  showConfirmPassword={showConfirmPassword}
                  isLoading={isLoading}
                  error={error}
                  theme={theme}
                  passwordStrength={passwordStrength}
                  handleInputChange={handleInputChange}
                  handleSubmit={handleSubmit}
                  togglePasswordVisibility={togglePasswordVisibility}
                  toggleConfirmPasswordVisibility={toggleConfirmPasswordVisibility}
                  getPasswordStrengthColor={getPasswordStrengthColor}
                  getPasswordStrengthText={getPasswordStrengthText}
                />
              </Box>
            </Fade>
          </Container>
        </Box>

      {/* Right Side - Image */}
      <Box 
        sx={{
          width: '65%',
          minHeight: '100vh',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
          <Slide direction="left" in timeout={1000}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                backgroundImage: `url(${registerImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `linear-gradient(45deg, ${alpha(theme.palette.secondary.main, 0.8)}, ${alpha(theme.palette.primary.main, 0.6)})`,
                  zIndex: 1,
                },
              }}
            >
              {/* Overlay Content */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 2,
                  textAlign: 'center',
                  color: 'white',
                  px: 4,
                }}
              >
                <Fade in timeout={1200} style={{ transitionDelay: '600ms' }}>
                  <Box>
                    <Typography 
                      variant="h2" 
                      sx={{ 
                        fontWeight: 700, 
                        mb: 2,
                        textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                      }}
                    >
                      Start Your Journey
                    </Typography>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 400, 
                        opacity: 0.9,
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        lineHeight: 1.6,
                      }}
                    >
                      Create your account and join the community
                    </Typography>
                  </Box>
                </Fade>
              </Box>
            </Box>
          </Slide>
        </Box>
    </Box>
  );
};

// Extracted RegisterForm component for reusability
interface RegisterFormProps {
  formData: RegisterCredentials;
  formErrors: Partial<RegisterCredentials>;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isLoading: boolean;
  error: string | null;
  theme: any;
  passwordStrength: number;
  handleInputChange: (field: keyof RegisterCredentials) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (event: React.FormEvent) => Promise<void>;
  togglePasswordVisibility: () => void;
  toggleConfirmPasswordVisibility: () => void;
  getPasswordStrengthColor: (strength: number) => string;
  getPasswordStrengthText: (strength: number) => string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  formData,
  formErrors,
  showPassword,
  showConfirmPassword,
  isLoading,
  error,
  theme,
  passwordStrength,
  handleInputChange,
  handleSubmit,
  togglePasswordVisibility,
  toggleConfirmPasswordVisibility,
  getPasswordStrengthColor,
  getPasswordStrengthText,
}) => {
  return (
    <Slide direction="up" in timeout={800}>
      <Paper
        elevation={24}
        sx={{
          padding: { xs: 3, sm: 5 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: 480,
          borderRadius: 4,
          background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.95)})`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.1)}`,
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography 
            component="h1" 
            variant="h4" 
            sx={{ 
              fontWeight: 600,
              mb: 1,
              color: theme.palette.text.primary,
            }}
          >
            Join Us!
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: theme.palette.text.secondary,
              fontSize: '1.1rem',
            }}
          >
            Create your account to start chatting
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Fade in>
            <Alert 
              severity="error" 
              sx={{ 
                width: '100%', 
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem',
                },
              }}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={formData.username}
            onChange={handleInputChange('username')}
            error={!!formErrors.username}
            helperText={formErrors.username}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: alpha(theme.palette.background.default, 0.5),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.background.default, 0.7),
                },
                '&.Mui-focused': {
                  backgroundColor: alpha(theme.palette.background.default, 0.8),
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person sx={{ color: theme.palette.primary.main }} />
                </InputAdornment>
              ),
              endAdornment: formData.username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(formData.username) && (
                <InputAdornment position="end">
                  <CheckCircle sx={{ color: theme.palette.success.main }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            error={!!formErrors.email}
            helperText={formErrors.email}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: alpha(theme.palette.background.default, 0.5),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.background.default, 0.7),
                },
                '&.Mui-focused': {
                  backgroundColor: alpha(theme.palette.background.default, 0.8),
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: theme.palette.primary.main }} />
                </InputAdornment>
              ),
              endAdornment: /\S+@\S+\.\S+/.test(formData.email) && (
                <InputAdornment position="end">
                  <CheckCircle sx={{ color: theme.palette.success.main }} />
                </InputAdornment>
              ),
            }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleInputChange('password')}
            error={!!formErrors.password}
            helperText={formErrors.password}
            sx={{
              mb: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: alpha(theme.palette.background.default, 0.5),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.background.default, 0.7),
                },
                '&.Mui-focused': {
                  backgroundColor: alpha(theme.palette.background.default, 0.8),
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: theme.palette.primary.main }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={togglePasswordVisibility}
                    edge="end"
                    sx={{
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        color: theme.palette.primary.main,
                      },
                    }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Password Strength Indicator */}
          {formData.password && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ mr: 1 }}>
                  Password strength:
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: getPasswordStrengthColor(passwordStrength),
                    fontWeight: 600,
                  }}
                >
                  {getPasswordStrengthText(passwordStrength)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={passwordStrength}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.grey[300], 0.3),
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getPasswordStrengthColor(passwordStrength),
                    borderRadius: 3,
                  },
                }}
              />
            </Box>
          )}

          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleInputChange('confirmPassword')}
            error={!!formErrors.confirmPassword}
            helperText={formErrors.confirmPassword}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: alpha(theme.palette.background.default, 0.5),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.background.default, 0.7),
                },
                '&.Mui-focused': {
                  backgroundColor: alpha(theme.palette.background.default, 0.8),
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: theme.palette.primary.main }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {formData.confirmPassword && formData.password === formData.confirmPassword ? (
                    <CheckCircle sx={{ color: theme.palette.success.main }} />
                  ) : (
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={toggleConfirmPasswordVisibility}
                      edge="end"
                      sx={{
                        color: theme.palette.text.secondary,
                        '&:hover': {
                          color: theme.palette.primary.main,
                        },
                      }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading}
            sx={{
              py: 1.8,
              borderRadius: 3,
              fontSize: '1.1rem',
              fontWeight: 600,
              textTransform: 'none',
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}`,
                transform: 'translateY(-2px)',
              },
              '&:disabled': {
                background: alpha(theme.palette.action.disabled, 0.12),
              },
              transition: 'all 0.3s ease-in-out',
            }}
            endIcon={!isLoading && <ArrowForward />}
          >
            {isLoading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              'Create Account'
            )}
          </Button>
          
          {/* Sign In Link */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
              Already have an account?{' '}
              <Link 
                to="/login" 
                style={{ 
                  textDecoration: 'none',
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  transition: 'color 0.2s ease-in-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme.palette.primary.dark;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme.palette.primary.main;
                }}
              >
                Sign in here
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Slide>
  );
};

export default Register;