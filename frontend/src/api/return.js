/**
 * Return API Module
 * Handles product return operations in both desktop and web modes
 */

import client from './client';
import { isWebMode } from '../utils/environment';

export const returnAPI = {
  /**
   * Create new return
   * @param {object} returnData
   * @returns {Promise<object>}
   */
  create: async (returnData) => {
    if (isWebMode()) {
      const response = await client.post('/api/return', returnData);
      return response.data;
    } else {
      const { CreateReturn } = await import('../../wailsjs/go/main/App');
      return await CreateReturn(returnData);
    }
  },

  /**
   * Get all returns
   * @returns {Promise<Array>}
   */
  getAll: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/return');
      return response.data;
    } else {
      const { GetAllReturns } = await import('../../wailsjs/go/main/App');
      return await GetAllReturns();
    }
  },

  /**
   * Get return by ID
   * @param {number} id
   * @returns {Promise<object>}
   */
  getByID: async (id) => {
    if (isWebMode()) {
      const response = await client.get(`/api/return/${id}`);
      return response.data;
    } else {
      const { GetReturnByID } = await import('../../wailsjs/go/main/App');
      return await GetReturnByID(id);
    }
  },

  /**
   * Get returns by transaction
   * @param {number} transaksiID
   * @returns {Promise<Array>}
   */
  getByTransaksi: async (transaksiID) => {
    if (isWebMode()) {
      const response = await client.get(`/api/return/transaksi/${transaksiID}`);
      return response.data;
    } else {
      const { GetReturnsByTransaksi } = await import('../../wailsjs/go/main/App');
      return await GetReturnsByTransaksi(transaksiID);
    }
  },

  /**
   * Get return statistics
   * @returns {Promise<object>}
   */
  getStats: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/return/stats');
      return response.data;
    } else {
      const { GetReturnStats } = await import('../../wailsjs/go/main/App');
      return await GetReturnStats();
    }
  },
};
