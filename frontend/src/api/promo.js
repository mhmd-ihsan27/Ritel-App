/**
 * Promo API Module
 * Handles promotion operations in both desktop and web modes
 */

import client from './client';
import { isWebMode } from '../utils/environment';

export const promoAPI = {
  /**
   * Get all promotions
   * @returns {Promise<Array>}
   */
  getAll: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/promo');
      return response.data;
    } else {
      const { GetAllPromo } = await import('../../wailsjs/go/main/App');
      return await GetAllPromo();
    }
  },

  /**
   * Get active promotions
   * @returns {Promise<Array>}
   */
  getActive: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/promo/active');
      return response.data;
    } else {
      const { GetActivePromos } = await import('../../wailsjs/go/main/App');
      return await GetActivePromos();
    }
  },

  /**
   * Get promotion by ID
   * @param {number} id
   * @returns {Promise<object>}
   */
  getByID: async (id) => {
    if (isWebMode()) {
      const response = await client.get(`/api/promo/${id}`);
      return response.data;
    } else {
      const { GetPromoByID } = await import('../../wailsjs/go/main/App');
      return await GetPromoByID(id);
    }
  },

  /**
   * Get promotion by code
   * @param {string} kode
   * @returns {Promise<object>}
   */
  getByKode: async (kode) => {
    if (isWebMode()) {
      const response = await client.get(`/api/promo/kode/${kode}`);
      return response.data;
    } else {
      const { GetPromoByKode } = await import('../../wailsjs/go/main/App');
      return await GetPromoByKode(kode);
    }
  },

  /**
   * Create new promotion
   * @param {object} promo
   * @returns {Promise<object>}
   */
  create: async (promo) => {
    if (isWebMode()) {
      const response = await client.post('/api/promo', promo);
      return response.data;
    } else {
      const { CreatePromo } = await import('../../wailsjs/go/main/App');
      return await CreatePromo(promo);
    }
  },

  /**
   * Update promotion
   * @param {object} promo
   * @returns {Promise<object>}
   */
  update: async (promo) => {
    if (isWebMode()) {
      const response = await client.put('/api/promo', promo);
      return response.data;
    } else {
      const { UpdatePromo } = await import('../../wailsjs/go/main/App');
      return await UpdatePromo(promo);
    }
  },

  /**
   * Delete promotion
   * @param {number} id
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    if (isWebMode()) {
      await client.delete(`/api/promo/${id}`);
    } else {
      const { DeletePromo } = await import('../../wailsjs/go/main/App');
      return await DeletePromo(id);
    }
  },

  /**
   * Apply promotion
   * @param {object} request
   * @returns {Promise<object>}
   */
  apply: async (request) => {
    if (isWebMode()) {
      const response = await client.post('/api/promo/apply', request);
      return response.data;
    } else {
      const { ApplyPromo } = await import('../../wailsjs/go/main/App');
      return await ApplyPromo(request);
    }
  },

  /**
   * Get promotions for product
   * @param {number} produkID
   * @returns {Promise<Array>}
   */
  getForProduct: async (produkID) => {
    if (isWebMode()) {
      const response = await client.get(`/api/promo/product/${produkID}`);
      return response.data;
    } else {
      const { GetPromoForProduct } = await import('../../wailsjs/go/main/App');
      return await GetPromoForProduct(produkID);
    }
  },

  /**
   * Get products in promotion
   * @param {number} promoID
   * @returns {Promise<Array>}
   */
  getProducts: async (promoID) => {
    if (isWebMode()) {
      const response = await client.get(`/api/promo/${promoID}/products`);
      return response.data;
    } else {
      const { GetPromoProducts } = await import('../../wailsjs/go/main/App');
      return await GetPromoProducts(promoID);
    }
  },
};
