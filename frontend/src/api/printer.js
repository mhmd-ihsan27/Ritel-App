/**
 * Printer API Module
 * Handles printer operations in both desktop and web modes
 */

import client from './client';
import { isWebMode } from '../utils/environment';

export const printerAPI = {
  /**
   * Print receipt
   * @param {object} receipt
   * @returns {Promise<void>}
   */
  printReceipt: async (receipt) => {
    if (isWebMode()) {
      await client.post('/api/printer/receipt', receipt);
    } else {
      const { PrintReceipt } = await import('../../wailsjs/go/main/App');
      return await PrintReceipt(receipt);
    }
  },

  /**
   * Get available printers
   * @returns {Promise<Array>}
   */
  getAvailablePrinters: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/printer/available');
      return response.data;
    } else {
      const { GetAvailablePrinters } = await import('../../wailsjs/go/main/App');
      return await GetAvailablePrinters();
    }
  },

  /**
   * Test printer
   * @param {string} printerName
   * @returns {Promise<boolean>}
   */
  testPrinter: async (printerName) => {
    if (isWebMode()) {
      const response = await client.post('/api/printer/test', { printer_name: printerName });
      return response.data;
    } else {
      const { TestPrinter } = await import('../../wailsjs/go/main/App');
      return await TestPrinter(printerName);
    }
  },

  /**
   * Get print settings
   * @returns {Promise<object>}
   */
  getSettings: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/printer/settings');
      return response.data;
    } else {
      const { GetPrintSettings } = await import('../../wailsjs/go/main/App');
      return await GetPrintSettings();
    }
  },

  /**
   * Save print settings
   * @param {object} settings
   * @returns {Promise<object>}
   */
  saveSettings: async (settings) => {
    if (isWebMode()) {
      const response = await client.post('/api/printer/settings', settings);
      return response.data;
    } else {
      const { SavePrintSettings } = await import('../../wailsjs/go/main/App');
      return await SavePrintSettings(settings);
    }
  },

  /**
   * Get installed printers on system
   * @returns {Promise<Array>}
   */
  getInstalledPrinters: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/printer/list');
      return response.data;
    } else {
      const { GetInstalledPrinters } = await import('../../wailsjs/go/main/App');
      return await GetInstalledPrinters();
    }
  },
};
