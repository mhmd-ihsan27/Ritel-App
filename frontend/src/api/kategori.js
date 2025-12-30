/**
 * Kategori API Module
 * Handles category operations in both desktop and web modes
 */

import client from './client';
import { isWebMode } from '../utils/environment';

export const kategoriAPI = {
  /**
   * Get all categories
   * @returns {Promise<Array>}
   */
  getAll: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/kategori');
      return response.data;
    } else {
      const { GetAllKategori } = await import('../../wailsjs/go/main/App');
      return await GetAllKategori();
    }
  },

  /**
   * Get category by ID
   * @param {number} id
   * @returns {Promise<object>}
   */
  getByID: async (id) => {
    if (isWebMode()) {
      const response = await client.get(`/api/kategori/${id}`);
      return response.data;
    } else {
      const { GetKategoriByID } = await import('../../wailsjs/go/main/App');
      return await GetKategoriByID(id);
    }
  },

  /**
   * Create new category
   * @param {object} kategori
   * @returns {Promise<object>}
   */
  create: async (kategori) => {
    if (isWebMode()) {
      const response = await client.post('/api/kategori', kategori);
      return response.data;
    } else {
      const { CreateKategori } = await import('../../wailsjs/go/main/App');
      return await CreateKategori(kategori);
    }
  },

  /**
   * Update category
   * @param {object} kategori
   * @returns {Promise<object>}
   */
  update: async (kategori) => {
    if (isWebMode()) {
      const response = await client.put('/api/kategori', kategori);
      return response.data;
    } else {
      const { UpdateKategori } = await import('../../wailsjs/go/main/App');
      return await UpdateKategori(kategori);
    }
  },

  /**
   * Delete category
   * @param {number} id
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    if (isWebMode()) {
      await client.delete(`/api/kategori/${id}`);
    } else {
      const { DeleteKategori } = await import('../../wailsjs/go/main/App');
      return await DeleteKategori(id);
    }
  },
};
