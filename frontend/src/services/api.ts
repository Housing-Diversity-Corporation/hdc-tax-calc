import axios from 'axios';
import { InvestorTaxInfo } from '../types/investorTaxInfo';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 || error.response?.status === 401) {
      console.warn('Authentication failed - clearing token');
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  role?: string;
  fullName?: string;
}

export interface AuthResponse {
  jwt: string;
}

export interface User {
  id: number;
  username: string;
  role: string;
  fullName: string;
  profileImageUrl?: string;
  bannerImageUrl?: string;
  jobTitle?: string;
  industry?: string;
  organization?: string;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  phone?: string;
  bio?: string;
}

export interface GoogleAuthRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface MessageResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    console.log('📡 Calling login API with:', credentials);
    const response = await api.post<AuthResponse>('/public/login', credentials);
    console.log('📡 Login API response:', response.data);
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<User> => {
    console.log('📡 Calling register API with:', userData);
    const userWithRole = { ...userData, role: userData.role || 'USER' };
    const response = await api.post<User>('/public/register', userWithRole);
    console.log('📡 Register API response:', response.data);
    return response.data;
  },

  googleAuth: async (googleToken: GoogleAuthRequest): Promise<AuthResponse> => {
    console.log('📡 Calling google-auth API');
    const response = await api.post<AuthResponse>('/public/google-auth', googleToken);
    console.log('📡 Google-auth API response:', response.data);
    return response.data;
  },

  forgotPassword: async (forgotPasswordRequest: ForgotPasswordRequest): Promise<MessageResponse> => {
    const response = await api.post<MessageResponse>('/public/forgot-password', forgotPasswordRequest);
    return response.data;
  },

  resetPassword: async (resetPasswordRequest: ResetPasswordRequest): Promise<MessageResponse> => {
    const response = await api.post<MessageResponse>('/public/reset-password', resetPasswordRequest);
    return response.data;
  },
};

export const tokenService = {
  setToken: (token: string) => {
    localStorage.setItem('authToken', token);
  },

  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },

  removeToken: () => {
    localStorage.removeItem('authToken');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('authToken');
  },
};

// Investor Tax Info Service
export const investorTaxInfoService = {
  getUserTaxInfo: async (): Promise<InvestorTaxInfo[]> => {
    const response = await api.get<InvestorTaxInfo[]>('/investor/tax-info');
    return response.data;
  },

  getTaxInfo: async (id: number): Promise<InvestorTaxInfo> => {
    const response = await api.get<InvestorTaxInfo>(`/investor/tax-info/${id}`);
    return response.data;
  },

  getDefaultTaxInfo: async (): Promise<InvestorTaxInfo> => {
    const response = await api.get<InvestorTaxInfo>('/investor/tax-info/default');
    return response.data;
  },

  saveTaxInfo: async (taxInfo: InvestorTaxInfo): Promise<InvestorTaxInfo> => {
    const response = await api.post<InvestorTaxInfo>('/investor/tax-info', taxInfo);
    return response.data;
  },

  updateTaxInfo: async (id: number, taxInfo: InvestorTaxInfo): Promise<InvestorTaxInfo> => {
    const response = await api.put<InvestorTaxInfo>(`/investor/tax-info/${id}`, taxInfo);
    return response.data;
  },

  setAsDefault: async (id: number): Promise<void> => {
    await api.put(`/investor/tax-info/${id}/set-default`);
  },

  deleteTaxInfo: async (id: number): Promise<void> => {
    await api.delete(`/investor/tax-info/${id}`);
  },
};

export default api;