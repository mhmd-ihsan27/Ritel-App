/**
 * Auth API Module
 * Handles authentication operations in both desktop and web modes
 */

import client from './client';
import { isWebMode } from '../utils/environment';

// Import Wails bindings (only used in desktop mode)
let WailsApp = {};
if (!isWebMode()) {
  import('../../wailsjs/go/main/App').then(module => {
    WailsApp = module;
  });
}

export const authAPI = {
  /**
   * Login user
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{success: boolean, user: object, token?: string}>}
   */
  login: async (username, password) => {
    if (isWebMode()) {
      // HTTP API
      const response = await client.post('/api/auth/login', {
        username,
        password,
      });

      if (response.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response;
    } else {
      // Wails binding
      const { Login } = await import('../../wailsjs/go/main/App');
      const response = await Login({ username, password });

      if (response.success && response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      return response;
    }
  },

  /**
   * Get current user info
   * @returns {Promise<object>}
   */
  me: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/auth/me');
      return response.data;
    } else {
      const { GetCurrentUser } = await import('../../wailsjs/go/main/App');
      return await GetCurrentUser();
    }
  },

  /**
   * Refresh JWT token (web mode only)
   * @returns {Promise<string>} New token
   */
  refreshToken: async () => {
    if (isWebMode()) {
      const response = await client.post('/api/auth/refresh');
      if (response.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data.token;
    }
    // Desktop mode doesn't use tokens
    return null;
  },

  /**
   * Change password
   * @param {string} oldPassword
   * @param {string} newPassword
   * @returns {Promise<{success: boolean, message: string}>}
   */
  changePassword: async (oldPassword, newPassword) => {
    if (isWebMode()) {
      return await client.post('/api/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
    } else {
      const { ChangePassword } = await import('../../wailsjs/go/main/App');
      return await ChangePassword(oldPassword, newPassword);
    }
  },

  /**
   * Logout user
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.clear();
  },
};
