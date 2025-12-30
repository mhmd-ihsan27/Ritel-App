/**
 * Analytics API Module
 * Handles analytics operations in both desktop and web modes
 */

import client from './client';
import { isWebMode } from '../utils/environment';

export const analyticsAPI = {
  /**
   * Get sales analytics
   * @param {string} startDate - Format: YYYY-MM-DD
   * @param {string} endDate - Format: YYYY-MM-DD
   * @returns {Promise<object>}
   */
  getSalesAnalytics: async (startDate, endDate) => {
    if (isWebMode()) {
      const response = await client.get('/api/analytics/sales', {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } else {
      const { GetSalesAnalytics } = await import('../../wailsjs/go/main/App');
      return await GetSalesAnalytics(startDate, endDate);
    }
  },

  /**
   * Get product performance
   * @param {string} startDate - Format: YYYY-MM-DD
   * @param {string} endDate - Format: YYYY-MM-DD
   * @returns {Promise<Array>}
   */
  getProductPerformance: async (startDate, endDate) => {
    if (isWebMode()) {
      const response = await client.get('/api/analytics/products', {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } else {
      const { GetProductPerformance } = await import('../../wailsjs/go/main/App');
      return await GetProductPerformance(startDate, endDate);
    }
  },

  /**
   * Get category performance
   * @param {string} startDate - Format: YYYY-MM-DD
   * @param {string} endDate - Format: YYYY-MM-DD
   * @returns {Promise<Array>}
   */
  getCategoryPerformance: async (startDate, endDate) => {
    if (isWebMode()) {
      const response = await client.get('/api/analytics/categories', {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } else {
      const { GetCategoryPerformance } = await import('../../wailsjs/go/main/App');
      return await GetCategoryPerformance(startDate, endDate);
    }
  },

  /**
   * Get hourly sales pattern
   * @returns {Promise<Array>}
   */
  getHourlySales: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/analytics/hourly');
      return response.data;
    } else {
      const { GetHourlySalesPattern } = await import('../../wailsjs/go/main/App');
      return await GetHourlySalesPattern();
    }
  },

  /**
   * Get customer analytics
   * @returns {Promise<object>}
   */
  getCustomerAnalytics: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/analytics/customers');
      return response.data;
    } else {
      const { GetCustomerAnalytics } = await import('../../wailsjs/go/main/App');
      return await GetCustomerAnalytics();
    }
  },
};
