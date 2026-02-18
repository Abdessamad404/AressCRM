export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  client_type: 'commercial' | 'entreprise' | null;
  theme_preference: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  client_type?: 'commercial' | 'entreprise';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
