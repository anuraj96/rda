import { create } from 'zustand';
import api from '../services/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  organizationId: string;
  organizationName: string | null;
  branchId: string | null;
  branchName: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  activeBranchId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password?: string) => Promise<User>;
  logout: () => void;
  initialize: () => Promise<void>;
  switchBranch: (branchId: string | null) => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  activeBranchId: null,
  isAuthenticated: false,
  isLoading: !!localStorage.getItem('rda_token'),
  error: null,

  login: async (email: string, password?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password: password || 'password123' });
      const { token, user } = response.data.data;

      localStorage.setItem('rda_token', token);
      localStorage.setItem('rda_user', JSON.stringify(user));
      
      // Default active branch is 'all' for Super Admin or Product Owner, or user's assigned branch for others
      let activeBranchId: string | null = null;
      if (user.role === 'SUPER_ADMIN' || user.role === 'PRODUCT_OWNER') {
        localStorage.setItem('rda_active_branch_id', 'all');
      } else {
        activeBranchId = user.branchId;
        if (activeBranchId) {
          localStorage.setItem('rda_active_branch_id', activeBranchId);
        }
      }

      set({
        user,
        token,
        activeBranchId,
        isAuthenticated: true,
        isLoading: false,
      });

      return user;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('rda_token');
    localStorage.removeItem('rda_user');
    localStorage.removeItem('rda_active_branch_id');
    set({
      user: null,
      token: null,
      activeBranchId: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  initialize: async () => {
    set({ isLoading: true });
    const token = localStorage.getItem('rda_token');
    const userStr = localStorage.getItem('rda_user');
    const activeBranchId = localStorage.getItem('rda_active_branch_id');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        
        let resolvedBranchId: string | null = null;
        if (activeBranchId === 'all') {
          resolvedBranchId = null;
        } else if (activeBranchId) {
          resolvedBranchId = activeBranchId;
        } else {
          resolvedBranchId = (user.role === 'SUPER_ADMIN' || user.role === 'PRODUCT_OWNER') ? null : user.branchId;
        }

        set({
          token,
          user,
          activeBranchId: resolvedBranchId,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (e) {
        localStorage.clear();
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },

  switchBranch: (branchId: string | null) => {
    if (branchId) {
      localStorage.setItem('rda_active_branch_id', branchId);
    } else {
      localStorage.setItem('rda_active_branch_id', 'all');
    }
    set({ activeBranchId: branchId });
  },

  hasPermission: (permission: string) => {
    const { user } = get();
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN' || user.role === 'PRODUCT_OWNER') return true;
    return user.permissions.includes(permission);
  },
}));
