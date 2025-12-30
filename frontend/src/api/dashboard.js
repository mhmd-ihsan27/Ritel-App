/**
 * Dashboard API Module
 * Handles dashboard data operations in both desktop and web modes
 */

import client from './client';
import { isWebMode } from '../utils/environment';

export const dashboardAPI = {
  /**
   * Get dashboard data
   * @returns {Promise<object>}
   */
  getData: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/dashboard');
      return response.data;
    } else {
      const { GetDashboardData } = await import('../../wailsjs/go/main/App');
      return await GetDashboardData();
    }
  },

  /**
   * Get sales chart data
   * @returns {Promise<object>}
   */
  getSalesChart: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/dashboard/sales-chart');
      return response.data;
    } else {
      const { GetDashboardSalesChart } = await import('../../wailsjs/go/main/App');
      return await GetDashboardSalesChart();
    }
  },

  /**
   * Get composition chart data
   * @returns {Promise<object>}
   */
  getCompositionChart: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/dashboard/composition-chart');
      return response.data;
    } else {
      const { GetDashboardCompositionChart } = await import('../../wailsjs/go/main/App');
      return await GetDashboardCompositionChart();
    }
  },

  /**
   * Get category chart data
   * @returns {Promise<object>}
   */
  getCategoryChart: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/dashboard/category-chart');
      return response.data;
    } else {
      const { GetDashboardCategoryChart } = await import('../../wailsjs/go/main/App');
      return await GetDashboardCategoryChart();
    }
  },
};
