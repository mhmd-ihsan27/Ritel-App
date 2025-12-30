/**
 * Transaksi API Module
 * Handles transaction operations in both desktop and web modes
 */

import client from './client';
import { isWebMode } from '../utils/environment';

export const transaksiAPI = {
  /**
   * Create new transaction
   * @param {object} transaksi
   * @returns {Promise<object>}
   */
  create: async (transaksi) => {
    if (isWebMode()) {
      const response = await client.post('/api/transaksi', transaksi);
      return response.data;
    } else {
      const { CreateTransaksi } = await import('../../wailsjs/go/main/App');
      return await CreateTransaksi(transaksi);
    }
  },

  /**
   * Get all transactions
   * @returns {Promise<Array>}
   */
  getAll: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/transaksi');
      return response.data;
    } else {
      const { GetAllTransaksi } = await import('../../wailsjs/go/main/App');
      return await GetAllTransaksi();
    }
  },

  /**
   * Get transaction by ID
   * @param {number} id
   * @returns {Promise<object>}
   */
  getByID: async (id) => {
    if (isWebMode()) {
      const response = await client.get(`/api/transaksi/${id}`);
      return response.data;
    } else {
      const { GetTransaksiByID } = await import('../../wailsjs/go/main/App');
      return await GetTransaksiByID(id);
    }
  },

  /**
   * Get transaction by transaction number
   * @param {string} noTransaksi
   * @returns {Promise<object>}
   */
  getByNoTransaksi: async (noTransaksi) => {
    if (isWebMode()) {
      const response = await client.get(`/api/transaksi/no/${noTransaksi}`);
      return response.data;
    } else {
      const { GetTransaksiByNoTransaksi } = await import('../../wailsjs/go/main/App');
      return await GetTransaksiByNoTransaksi(noTransaksi);
    }
  },

  /**
   * Get transactions by date range
   * @param {string} startDate - Format: YYYY-MM-DD
   * @param {string} endDate - Format: YYYY-MM-DD
   * @returns {Promise<Array>}
   */
  getByDateRange: async (startDate, endDate) => {
    if (isWebMode()) {
      const response = await client.get('/api/transaksi/date-range', {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } else {
      const { GetTransaksiByDateRange } = await import('../../wailsjs/go/main/App');
      return await GetTransaksiByDateRange(startDate, endDate);
    }
  },

  /**
   * Get today's transaction statistics
   * @returns {Promise<object>}
   */
  getTodayStats: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/transaksi/stats/today');
      return response.data;
    } else {
      const { GetTodayStats } = await import('../../wailsjs/go/main/App');
      return await GetTodayStats();
    }
  },

  /**
   * Get transactions by customer
   * @param {number} pelangganID
   * @returns {Promise<Array>}
   */
  getByPelanggan: async (pelangganID) => {
    if (isWebMode()) {
      const response = await client.get(`/api/transaksi/pelanggan/${pelangganID}`);
      return response.data;
    } else {
      const { GetTransaksiByPelanggan } = await import('../../wailsjs/go/main/App');
      return await GetTransaksiByPelanggan(pelangganID);
    }
  },
};
