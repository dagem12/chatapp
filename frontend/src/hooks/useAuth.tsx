import React, { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { AuthUser, AuthState, LoginCredentials, RegisterCredentials } from '../types';
import { authService } from '../services/auth';
import { socketService } from '../services/socket';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  updateProfile: (data: { username: string; email: string }) => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: AuthUser }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true to prevent FOUC
  error: null,
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check for stored authentication on app start
    const initAuth = async () => {
      const storedUser = authService.getStoredUser();
      const token = authService.getStoredToken();

      if (storedUser && token) {
        dispatch({ type: 'AUTH_START' });
        
        // Verify token is still valid
        const response = await authService.getCurrentUser();
        
        if (response.success && response.data) {
          dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
          socketService.connect(token);
        } else {
          // Token is invalid, clear storage
          authService.logout();
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } else {
        // No stored authentication, set loading to false
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });

    const response = await authService.login(credentials);

    if (response.success && response.data) {
      dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
      socketService.connect(response.data.token);
      return true;
    } else {
      dispatch({ type: 'AUTH_ERROR', payload: response.error || 'Login failed' });
      return false;
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });

    const response = await authService.register(credentials);

    if (response.success && response.data) {
      dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
      socketService.connect(response.data.token);
      return true;
    } else {
      dispatch({ type: 'AUTH_ERROR', payload: response.error || 'Registration failed' });
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    socketService.disconnect();
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const updateProfile = useCallback(async (data: { username: string; email: string }): Promise<void> => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await authService.updateProfile(data);
      
      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: response.error || 'Profile update failed' });
        throw new Error(response.error || 'Profile update failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const updateAvatar = useCallback(async (avatarUrl: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await authService.updateAvatar(avatarUrl);
      
      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: response.error || 'Avatar update failed' });
        throw new Error(response.error || 'Avatar update failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Avatar update failed';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
    updateProfile,
    updateAvatar,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};