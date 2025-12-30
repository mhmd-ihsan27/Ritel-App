/**
 * Batch API Module
 * Handles FIFO batch tracking operations in both desktop and web modes
 */

import client from './client';
import { isWebMode } from '../utils/environment';

export const batchAPI = {
  /**
   * Get batch by ID
   * @param {number} id
   * @returns {Promise<object>}
   */
  getByID: async (id) => {
    if (isWebMode()) {
      const response = await client.get(`/api/batch/${id}`);
      return response.data;
    } else {
      const { GetBatchByID } = await import('../../wailsjs/go/main/App');
      return await GetBatchByID(id);
    }
  },

  /**
   * Get batches by product
   * @param {number} produkID
   * @returns {Promise<Array>}
   */
  getByProduct: async (produkID) => {
    if (isWebMode()) {
      const response = await client.get(`/api/batch/produk/${produkID}`);
      return response.data;
    } else {
      const { GetBatchByProduk } = await import('../../wailsjs/go/main/App');
      return await GetBatchByProduk(produkID);
    }
  },

  /**
   * Get expired batches
   * @returns {Promise<Array>}
   */
  getExpired: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/batch/expired');
      return response.data;
    } else {
      const { GetExpiredBatches } = await import('../../wailsjs/go/main/App');
      return await GetExpiredBatches();
    }
  },

  /**
   * Get batch summary for product
   * @param {number} produkID
   * @returns {Promise<object>}
   */
  getSummary: async (produkID) => {
    if (isWebMode()) {
      const response = await client.get(`/api/batch/summary/${produkID}`);
      return response.data;
    } else {
      const { GetBatchSummary } = await import('../../wailsjs/go/main/App');
      return await GetBatchSummary(produkID);
    }
  },

  /**
   * Get batches by product (alias for getByProduct)
   * @param {number} produkID
   * @returns {Promise<Array>}
   */
  getByProduk: async (produkID) => {
    if (isWebMode()) {
      const response = await client.get(`/api/batch/produk/${produkID}`);
      return response.data;
    } else {
      const { GetBatchesByProduk } = await import('../../wailsjs/go/main/App');
      return await GetBatchesByProduk(produkID);
    }
  },

  /**
   * Get batches expiring within specified days
   * @param {number} daysThreshold - Number of days threshold
   * @returns {Promise<Array>}
   */
  getExpiring: async (daysThreshold) => {
    if (isWebMode()) {
      const response = await client.get(`/api/batch/expiring/${daysThreshold}`);
      return response.data;
    } else {
      const { GetExpiringBatches } = await import('../../wailsjs/go/main/App');
      return await GetExpiringBatches(daysThreshold);
    }
  },
};
