export type { User } from './auth';

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: 'admin' | 'user';
  theme_preference?: 'light' | 'dark' | 'system';
}
