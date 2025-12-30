/**
 * Staff Report API Module
 * Handles staff report operations in both desktop and web modes
 */

import client from './client';
import { isWebMode } from '../utils/environment';

export const staffReportAPI = {
  /**
   * Get staff report
   * @param {number} staffID
   * @param {string} startDate - Format: YYYY-MM-DD
   * @param {string} endDate - Format: YYYY-MM-DD
   * @returns {Promise<object>}
   */
  getReport: async (staffID, startDate, endDate) => {
    if (isWebMode()) {
      const response = await client.get(`/api/staff-report/${staffID}`, {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } else {
      const { GetStaffReport } = await import('../../wailsjs/go/main/App');
      return await GetStaffReport(staffID, startDate, endDate);
    }
  },

  /**
   * Get staff report detail
   * @param {number} staffID
   * @param {string} startDate - Format: YYYY-MM-DD
   * @param {string} endDate - Format: YYYY-MM-DD
   * @returns {Promise<object>}
   */
  getReportDetail: async (staffID, startDate, endDate) => {
    if (isWebMode()) {
      const response = await client.get(`/api/staff-report/${staffID}/detail`, {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } else {
      const { GetStaffReportDetail } = await import('../../wailsjs/go/main/App');
      return await GetStaffReportDetail(staffID, startDate, endDate);
    }
  },

  /**
   * Get all staff reports
   * @param {string} startDate - Format: YYYY-MM-DD
   * @param {string} endDate - Format: YYYY-MM-DD
   * @returns {Promise<Array>}
   */
  getAllReports: async (startDate, endDate) => {
    if (isWebMode()) {
      const response = await client.get('/api/staff-report', {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } else {
      const { GetAllStaffReports } = await import('../../wailsjs/go/main/App');
      return await GetAllStaffReports(startDate, endDate);
    }
  },

  /**
   * Get all staff reports with trend
   * @returns {Promise<Array>}
   */
  getAllWithTrend: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/staff-report/trend/all');
      return response.data;
    } else {
      const { GetAllStaffReportsWithTrend } = await import('../../wailsjs/go/main/App');
      return await GetAllStaffReportsWithTrend();
    }
  },

  /**
   * Get staff report with trend
   * @param {number} staffID
   * @param {string} startDate - Format: YYYY-MM-DD
   * @param {string} endDate - Format: YYYY-MM-DD
   * @returns {Promise<object>}
   */
  getWithTrend: async (staffID, startDate, endDate) => {
    if (isWebMode()) {
      const response = await client.get(`/api/staff-report/${staffID}/trend`, {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } else {
      const { GetStaffReportWithTrend } = await import('../../wailsjs/go/main/App');
      return await GetStaffReportWithTrend(staffID, startDate, endDate);
    }
  },

  /**
   * Get staff historical data
   * @param {number} staffID
   * @returns {Promise<Array>}
   */
  getHistoricalData: async (staffID) => {
    if (isWebMode()) {
      const response = await client.get(`/api/staff-report/${staffID}/historical`);
      return response.data;
    } else {
      const { GetStaffHistoricalData } = await import('../../wailsjs/go/main/App');
      return await GetStaffHistoricalData(staffID);
    }
  },

  /**
   * Get comprehensive staff report
   * @returns {Promise<object>}
   */
  getComprehensive: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/staff-report/comprehensive');
      return response.data;
    } else {
      const { GetComprehensiveStaffReport } = await import('../../wailsjs/go/main/App');
      return await GetComprehensiveStaffReport();
    }
  },

  /**
   * Get shift productivity
   * @returns {Promise<object>}
   */
  getShiftProductivity: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/staff-report/shift-productivity');
      return response.data;
    } else {
      const { GetShiftProductivity } = await import('../../wailsjs/go/main/App');
      return await GetShiftProductivity();
    }
  },

  /**
   * Get staff shift data
   * @param {number} staffID
   * @param {string} startDate - Format: YYYY-MM-DD
   * @param {string} endDate - Format: YYYY-MM-DD
   * @returns {Promise<object>}
   */
  getStaffShiftData: async (staffID, startDate, endDate) => {
    if (isWebMode()) {
      const response = await client.get(`/api/staff-report/${staffID}/shift-data`, {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } else {
      const { GetStaffShiftData } = await import('../../wailsjs/go/main/App');
      return await GetStaffShiftData(staffID, startDate, endDate);
    }
  },

  /**
   * Get monthly trend
   * @returns {Promise<object>}
   */
  getMonthlyTrend: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/staff-report/monthly-trend');
      return response.data;
    } else {
      const { GetMonthlyComparisonTrend } = await import('../../wailsjs/go/main/App');
      return await GetMonthlyComparisonTrend();
    }
  },

  /**
   * Get staff report with monthly trend
   * @param {number} staffID
   * @param {string} startDate - Format: YYYY-MM-DD
   * @param {string} endDate - Format: YYYY-MM-DD
   * @returns {Promise<object>}
   */
  getWithMonthlyTrend: async (staffID, startDate, endDate) => {
    if (isWebMode()) {
      const response = await client.get(`/api/staff-report/${staffID}/monthly-trend`, {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } else {
      const { GetStaffReportWithMonthlyTrend } = await import('../../wailsjs/go/main/App');
      return await GetStaffReportWithMonthlyTrend(staffID, startDate, endDate);
    }
  },
};
