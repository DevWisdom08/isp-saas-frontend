import { defineStore } from 'pinia';
import { authAPI } from '../api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    isDistributor: (state) => state.user?.role === 'distributor',
    userRole: (state) => state.user?.role || 'guest',
  },

  actions: {
    async login(email, password) {
      this.loading = true;
      this.error = null;
      try {
        const response = await authAPI.login(email, password);
        const { token, user } = response.data.data;
        
        this.token = token;
        this.user = user;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        return { success: true };
      } catch (error) {
        this.error = error.response?.data?.error || 'Login failed';
        return { success: false, error: this.error };
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },

    checkAuth() {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      if (token && user) {
        this.token = token;
        this.user = JSON.parse(user);
        return true;
      }
      return false;
    },
  },
});
