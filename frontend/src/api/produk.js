/**
 * Produk API Module
 * Handles product operations in both desktop and web modes
 */

import client from './client';
import { isWebMode } from '../utils/environment';

export const produkAPI = {
  /**
   * Get all products
   * @returns {Promise<Array>}
   */
  getAll: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/produk');
      return response.data;
    } else {
      const { GetAllProduk } = await import('../../wailsjs/go/main/App');
      return await GetAllProduk();
    }
  },

  /**
   * Get product by ID
   * @param {number} id
   * @returns {Promise<object>}
   */
  getByID: async (id) => {
    if (isWebMode()) {
      const response = await client.get(`/api/produk/${id}`);
      return response.data;
    } else {
      const { GetProdukByID } = await import('../../wailsjs/go/main/App');
      return await GetProdukByID(id);
    }
  },

  /**
   * Create new product
   * @param {object} produk
   * @returns {Promise<object>}
   */
  create: async (produk) => {
    if (isWebMode()) {
      const response = await client.post('/api/produk', produk);
      return response.data;
    } else {
      const { CreateProduk } = await import('../../wailsjs/go/main/App');
      return await CreateProduk(produk);
    }
  },

  /**
   * Update product
   * @param {object} produk
   * @returns {Promise<object>}
   */
  update: async (produk) => {
    if (isWebMode()) {
      const response = await client.put('/api/produk', produk);
      return response.data;
    } else {
      const { UpdateProduk } = await import('../../wailsjs/go/main/App');
      return await UpdateProduk(produk);
    }
  },

  /**
   * Delete product
   * @param {number} id
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    if (isWebMode()) {
      await client.delete(`/api/produk/${id}`);
    } else {
      const { DeleteProduk } = await import('../../wailsjs/go/main/App');
      return await DeleteProduk(id);
    }
  },

  /**
   * Scan barcode
   * @param {string} barcode
   * @returns {Promise<object>}
   */
  scanBarcode: async (barcode) => {
    if (isWebMode()) {
      const response = await client.post('/api/produk/scan', { barcode });
      return response.data;
    } else {
      const { ScanBarcode } = await import('../../wailsjs/go/main/App');
      return await ScanBarcode(barcode);
    }
  },

  /**
   * Update product stock
   * @param {object} request
   * @returns {Promise<object>}
   */
  updateStok: async (request) => {
    if (isWebMode()) {
      const response = await client.put('/api/produk/stok', request);
      return response.data;
    } else {
      const { UpdateStok } = await import('../../wailsjs/go/main/App');
      return await UpdateStok(request);
    }
  },

  /**
   * Increment product stock
   * @param {object} request
   * @returns {Promise<object>}
   */
  updateStokIncrement: async (request) => {
    if (isWebMode()) {
      const response = await client.put('/api/produk/stok/increment', request);
      return response.data;
    } else {
      const { UpdateStokIncrement } = await import('../../wailsjs/go/main/App');
      return await UpdateStokIncrement(request);
    }
  },

  /**
   * Get cart items
   * @returns {Promise<Array>}
   */
  getKeranjang: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/produk/keranjang');
      return response.data;
    } else {
      const { GetKeranjang } = await import('../../wailsjs/go/main/App');
      return await GetKeranjang();
    }
  },

  /**
   * Process cart (add/update/remove items)
   * @param {object} request
   * @returns {Promise<void>}
   */
  processKeranjang: async (request) => {
    if (isWebMode()) {
      await client.post('/api/produk/keranjang/process', request);
    } else {
      const { ProcessKeranjang } = await import('../../wailsjs/go/main/App');
      return await ProcessKeranjang(request);
    }
  },

  /**
   * Clear cart
   * @returns {Promise<void>}
   */
  clearKeranjang: async () => {
    if (isWebMode()) {
      await client.delete('/api/produk/keranjang');
    } else {
      const { ClearKeranjang } = await import('../../wailsjs/go/main/App');
      return await ClearKeranjang();
    }
  },

  /**
   * Get stock history for a product
   * @param {number} produkID
   * @returns {Promise<Array>}
   */
  getStokHistory: async (produkID) => {
    if (isWebMode()) {
      const response = await client.get(`/api/produk/${produkID}/stok-history`);
      return response.data;
    } else {
      const { GetStokHistory } = await import('../../wailsjs/go/main/App');
      return await GetStokHistory(produkID);
    }
  },
};
