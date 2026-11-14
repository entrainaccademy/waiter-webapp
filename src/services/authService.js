import api, { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from './api';
import socketService from './socket';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', {
      email: email.trim(),
      password,
    });

    const { accessToken, user } = response.data;

    if (accessToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    }
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }

    // Connect socket on successful login
    socketService.connect();

    return { accessToken, user };
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API error:', err.message);
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      socketService.disconnect();
    }
  },

  async getMe() {
    const response = await api.get('/auth/me');
    const user = response.data.data || response.data.user;
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
    return user;
  },

  async changePassword(currentPassword, newPassword) {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  getStoredUser() {
    try {
      const data = localStorage.getItem(USER_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  getStoredToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem(TOKEN_STORAGE_KEY));
  },
};

export default authService;
