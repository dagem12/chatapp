import type { AuthUser, LoginCredentials, RegisterCredentials, ApiResponse, AuthResponse, ProfileResponse } from '../types';
import { mapUserDataToUser } from '../types';
import { apiService } from './api';

export class AuthService {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthUser>> {
    try {
      const response = await apiService.post<AuthResponse>('/auth/login', credentials);
      
      if (response.data.success && response.data.data) {
        const { user, token } = response.data.data;
        const authUser: AuthUser = {
          ...mapUserDataToUser(user),
          token,
        };
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(authUser));
        
        return {
          success: true,
          data: authUser,
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Login failed',
        };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async register(credentials: RegisterCredentials): Promise<ApiResponse<AuthUser>> {
    try {
      const response = await apiService.post<AuthResponse>('/auth/register', credentials);
      
      if (response.data.success && response.data.data) {
        const { user, token } = response.data.data;
        const authUser: AuthUser = {
          ...mapUserDataToUser(user),
          token,
        };
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(authUser));
        
        return {
          success: true,
          data: authUser,
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Registration failed',
        };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async logout(): Promise<void> {
    // Mock logout - just clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  async getCurrentUser(): Promise<ApiResponse<AuthUser>> {
    try {
      const token = this.getStoredToken();
      if (!token) {
        return {
          success: false,
          error: 'No token found',
        };
      }

      const response = await apiService.get<ProfileResponse>('/auth/me');
      
      if (response.data.success && response.data.data) {
        const user = response.data.data;
        const authUser: AuthUser = {
          ...mapUserDataToUser(user),
          token,
        };
        
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(authUser));
        
        return {
          success: true,
          data: authUser,
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to get user profile',
        };
      }
    } catch (error: any) {
      // If token is invalid, clear storage
      this.logout();
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get user profile';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  getStoredUser(): AuthUser | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  getStoredToken(): string | null {
    return localStorage.getItem('token');
  }

  async updateProfile(data: { username: string; email: string }): Promise<ApiResponse<AuthUser>> {
    try {
      const response = await apiService.put<ProfileResponse>('/auth/profile', data);
      
      if (response.data.success && response.data.data) {
        const user = response.data.data;
        const token = this.getStoredToken();
        const authUser: AuthUser = {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar || undefined,
          isOnline: user.isOnline,
          lastSeen: new Date(user.lastSeen),
          token: token || '',
        };
        
        localStorage.setItem('user', JSON.stringify(authUser));
        
        return {
          success: true,
          data: authUser,
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Profile update failed',
        };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Profile update failed';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async updateAvatar(avatarUrl: string): Promise<ApiResponse<AuthUser>> {
    try {
      const response = await apiService.put<ProfileResponse>('/auth/profile', { avatar: avatarUrl });
      
      if (response.data.success && response.data.data) {
        const user = response.data.data;
        const token = this.getStoredToken();
        const authUser: AuthUser = {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar || undefined,
          isOnline: user.isOnline,
          lastSeen: new Date(user.lastSeen),
          token: token || '',
        };
        
        localStorage.setItem('user', JSON.stringify(authUser));
        
        return {
          success: true,
          data: authUser,
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Avatar update failed',
        };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Avatar update failed';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }
}

export const authService = new AuthService();
