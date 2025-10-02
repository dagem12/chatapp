import type { AuthUser, LoginCredentials, RegisterCredentials, ApiResponse } from '../types';
import { currentUser } from '../utils/mockData';

export class AuthService {
  async login(_credentials: LoginCredentials): Promise<ApiResponse<AuthUser>> {
    // Mock login - accept any credentials
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    
    const mockAuthUser: AuthUser = {
      ...currentUser,
      token: 'mock-jwt-token-' + Date.now(),
    };
    
    localStorage.setItem('token', mockAuthUser.token);
    localStorage.setItem('user', JSON.stringify(mockAuthUser));
    
    return {
      success: true,
      data: mockAuthUser,
    };
  }

  async register(credentials: RegisterCredentials): Promise<ApiResponse<AuthUser>> {
    // Mock registration - accept any credentials
    await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate network delay
    
    const mockAuthUser: AuthUser = {
      id: 'current-user',
      username: credentials.username,
      email: credentials.email,
      token: 'mock-jwt-token-' + Date.now(),
    };
    
    localStorage.setItem('token', mockAuthUser.token);
    localStorage.setItem('user', JSON.stringify(mockAuthUser));
    
    return {
      success: true,
      data: mockAuthUser,
    };
  }

  async logout(): Promise<void> {
    // Mock logout - just clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  async getCurrentUser(): Promise<ApiResponse<AuthUser>> {
    // Mock getCurrentUser - return stored user
    const storedUser = this.getStoredUser();
    if (storedUser) {
      return {
        success: true,
        data: storedUser,
      };
    }
    
    return {
      success: false,
      error: 'No user found',
    };
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
    // Mock profile update with validation
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
    
    const storedUser = this.getStoredUser();
    if (!storedUser) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Basic validation
    if (!data.username.trim()) {
      return {
        success: false,
        error: 'Username is required',
      };
    }

    if (!data.email.trim()) {
      return {
        success: false,
        error: 'Email is required',
      };
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return {
        success: false,
        error: 'Please enter a valid email address',
      };
    }

    // Username length validation
    if (data.username.length < 2) {
      return {
        success: false,
        error: 'Username must be at least 2 characters long',
      };
    }

    if (data.username.length > 30) {
      return {
        success: false,
        error: 'Username must be less than 30 characters',
      };
    }

    const updatedUser: AuthUser = {
      ...storedUser,
      username: data.username.trim(),
      email: data.email.trim().toLowerCase(),
    };
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    return {
      success: true,
      data: updatedUser,
    };
  }

  async updateAvatar(avatarUrl: string): Promise<ApiResponse<AuthUser>> {
    // Mock avatar update
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    const storedUser = this.getStoredUser();
    if (!storedUser) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Basic URL validation
    try {
      new URL(avatarUrl);
    } catch {
      return {
        success: false,
        error: 'Please enter a valid URL',
      };
    }

    const updatedUser: AuthUser = {
      ...storedUser,
      avatar: avatarUrl,
    };
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    return {
      success: true,
      data: updatedUser,
    };
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }
}

export const authService = new AuthService();
