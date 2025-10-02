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

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }
}

export const authService = new AuthService();
