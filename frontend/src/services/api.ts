import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { config } from '../config/env';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: config.API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string): Promise<AxiosResponse<T>> {
    return await this.api.get(url);
  }

  async post<T>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return await this.api.post(url, data);
  }

  async put<T>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return await this.api.put(url, data);
  }

  async delete<T>(url: string): Promise<AxiosResponse<T>> {
    return await this.api.delete(url);
  }
}

export const apiService = new ApiService();
