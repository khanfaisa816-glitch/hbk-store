import { api, adminApi } from '../lib/api';
import { createAuth } from './createAuth';

// Shop customers
export const { Provider: AuthProvider, useAuth } = createAuth(api, {
  loginPath: '/auth/login',
  role: 'customer',
});

// Admin panel (separate login and separate token)
export const { Provider: AdminAuthProvider, useAuth: useAdminAuth } = createAuth(adminApi, {
  loginPath: '/auth/admin/login',
  role: 'admin',
});
