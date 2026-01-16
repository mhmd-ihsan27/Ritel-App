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

  /**
   * Get overall shift reports
   * @param {string} date - Format: YYYY-MM-DD (optional)
   * @returns {Promise<object>}
   */
  getShiftReports: async (date = "") => {
    if (isWebMode()) {
        const response = await client.get('/api/staff-report/shift-reports', {
            params: { date }
        });
        return response.data;
    } else {
        const { GetShiftReports } = await import('../../wailsjs/go/main/App');
        return await GetShiftReports(date);
    }
  },

  /**
   * Get shift cashiers
   * @param {string} shift
   * @returns {Promise<Array>}
   */
  getShiftCashiers: async (shift) => {
    if (isWebMode()) {
        const response = await client.get(`/api/staff-report/shift/${shift}/cashiers`);
        return response.data;
    } else {
        const { GetShiftCashiers } = await import('../../wailsjs/go/main/App');
        return await GetShiftCashiers(shift);
    }
  },

  /**
   * Get shift detail
   * @param {string} shift
   * @param {string} date
   * @returns {Promise<object>}
   */
  getShiftDetail: async (shift, date) => {
    if (isWebMode()) {
        const response = await client.get(`/api/staff-report/shift/${shift}/detail`, {
            params: { date }
        });
        return response.data;
    } else {
        const { GetShiftDetail } = await import('../../wailsjs/go/main/App');
        return await GetShiftDetail(shift, date);
    }
  },
  /**
   * Get shift settings
   * @returns {Promise<Array>}
   */
  getShiftSettings: async () => {
    if (isWebMode()) {
        const response = await client.get('/api/staff-report/shift-settings');
        return response.data;
    } else {
        const { GetShiftSettings } = await import('../../wailsjs/go/main/App');
        return await GetShiftSettings();
    }
  },

  /**
   * Update shift settings
   * @param {number} id
   * @param {string} startTime
   * @param {string} endTime
   * @param {string} staffIDs
   * @returns {Promise<void>}
   */
  updateShiftSettings: async (id, startTime, endTime, staffIDs) => {
    if (isWebMode()) {
        await client.put(`/api/staff-report/shift-settings/${id}`, { startTime, endTime, staffIDs });
    } else {
        const { UpdateShiftSettings } = await import('../../wailsjs/go/main/App');
        await UpdateShiftSettings(id, startTime, endTime, staffIDs);
    }
  },
};
