import type { AuthUser, LoginCredentials, RegisterCredentials, ApiResponse } from '../types';
import { apiService } from './api';

export class AuthService {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthUser>> {
    const response = await apiService.post<AuthUser>('/auth/login', credentials);
    
    if (response.success && response.data) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    
    return response;
  }

  async register(credentials: RegisterCredentials): Promise<ApiResponse<AuthUser>> {
    const response = await apiService.post<AuthUser>('/auth/register', credentials);
    
    if (response.success && response.data) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    
    return response;
  }

  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  async getCurrentUser(): Promise<ApiResponse<AuthUser>> {
    return apiService.get<AuthUser>('/auth/me');
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
