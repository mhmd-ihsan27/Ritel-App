/**
 * User API Module
 * Handles user management operations in both desktop and web modes
 */

import client from './client';
import { isWebMode } from '../utils/environment';

export const userAPI = {
  /**
   * Get all users (admin only)
   * @returns {Promise<Array>}
   */
  getAll: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/users');
      return response.data;
    } else {
      const { GetAllUsers } = await import('../../wailsjs/go/main/App');
      return await GetAllUsers();
    }
  },

  /**
   * Get user by ID
   * @param {number} id
   * @returns {Promise<object>}
   */
  getByID: async (id) => {
    if (isWebMode()) {
      const response = await client.get(`/api/users/${id}`);
      return response.data;
    } else {
      const { GetUserByID } = await import('../../wailsjs/go/main/App');
      return await GetUserByID(id);
    }
  },

  /**
   * Create new user (admin only)
   * @param {object} user
   * @returns {Promise<object>}
   */
  create: async (user) => {
    if (isWebMode()) {
      const response = await client.post('/api/users', user);
      return response.data;
    } else {
      const { CreateUser } = await import('../../wailsjs/go/main/App');
      return await CreateUser(user);
    }
  },

  /**
   * Update user (admin only)
   * @param {object} user
   * @returns {Promise<object>}
   */
  update: async (user) => {
    if (isWebMode()) {
      const response = await client.put('/api/users', user);
      return response.data;
    } else {
      const { UpdateUser } = await import('../../wailsjs/go/main/App');
      return await UpdateUser(user);
    }
  },

  /**
   * Delete user (admin only)
   * @param {number} id
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    if (isWebMode()) {
      await client.delete(`/api/users/${id}`);
    } else {
      const { DeleteUser } = await import('../../wailsjs/go/main/App');
      return await DeleteUser(id);
    }
  },
};
