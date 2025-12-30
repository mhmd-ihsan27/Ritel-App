/**
 * Pelanggan API Module
 * Handles customer operations in both desktop and web modes
 */

import client from './client';
import { isWebMode } from '../utils/environment';

export const pelangganAPI = {
  /**
   * Get all customers
   * @returns {Promise<Array>}
   */
  getAll: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/pelanggan');
      return response.data;
    } else {
      const { GetAllPelanggan } = await import('../../wailsjs/go/main/App');
      return await GetAllPelanggan();
    }
  },

  /**
   * Get customer by ID
   * @param {number} id
   * @returns {Promise<object>}
   */
  getByID: async (id) => {
    if (isWebMode()) {
      const response = await client.get(`/api/pelanggan/${id}`);
      return response.data;
    } else {
      const { GetPelangganByID } = await import('../../wailsjs/go/main/App');
      return await GetPelangganByID(id);
    }
  },

  /**
   * Search customer by phone
   * @param {string} nohp
   * @returns {Promise<object>}
   */
  searchByPhone: async (nohp) => {
    if (isWebMode()) {
      const response = await client.get(`/api/pelanggan/search/${nohp}`);
      return response.data;
    } else {
      const { SearchPelangganByPhone } = await import('../../wailsjs/go/main/App');
      return await SearchPelangganByPhone(nohp);
    }
  },

  /**
   * Create new customer
   * @param {object} pelanggan
   * @returns {Promise<object>}
   */
  create: async (pelanggan) => {
    if (isWebMode()) {
      const response = await client.post('/api/pelanggan', pelanggan);
      return response.data;
    } else {
      const { CreatePelanggan } = await import('../../wailsjs/go/main/App');
      return await CreatePelanggan(pelanggan);
    }
  },

  /**
   * Update customer
   * @param {object} pelanggan
   * @returns {Promise<object>}
   */
  update: async (pelanggan) => {
    if (isWebMode()) {
      const response = await client.put('/api/pelanggan', pelanggan);
      return response.data;
    } else {
      const { UpdatePelanggan } = await import('../../wailsjs/go/main/App');
      return await UpdatePelanggan(pelanggan);
    }
  },

  /**
   * Delete customer
   * @param {number} id
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    if (isWebMode()) {
      await client.delete(`/api/pelanggan/${id}`);
    } else {
      const { DeletePelanggan } = await import('../../wailsjs/go/main/App');
      return await DeletePelanggan(id);
    }
  },

  /**
   * Add points to customer
   * @param {object} request - { pelangganId: number, poin: number }
   * @returns {Promise<object>}
   */
  addPoin: async (request) => {
    if (isWebMode()) {
      const response = await client.post('/api/pelanggan/poin', request);
      return response.data;
    } else {
      const { AddPoin } = await import('../../wailsjs/go/main/App');
      return await AddPoin(request);
    }
  },
};
