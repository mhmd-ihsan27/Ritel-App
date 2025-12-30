/**
 * Sales Report API Module
 * Handles sales report operations in both desktop and web modes
 */

import client from './client';
import { isWebMode } from '../utils/environment';

export const salesReportAPI = {
  /**
   * Get comprehensive sales report
   * @param {string} startDate - Format: YYYY-MM-DD
   * @param {string} endDate - Format: YYYY-MM-DD
   * @returns {Promise<object>}
   */
  getComprehensive: async (startDate, endDate) => {
    if (isWebMode()) {
      const response = await client.get('/api/sales-report/comprehensive', {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } else {
      const { GetComprehensiveSalesReport } = await import('../../wailsjs/go/main/App');
      return await GetComprehensiveSalesReport(startDate, endDate);
    }
  },
};
