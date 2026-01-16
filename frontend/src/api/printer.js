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
      const response = await client.get('/api/printer/list');
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
      const { TestPrintByName } = await import('../../wailsjs/go/main/App');
      return await TestPrintByName(printerName);
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
   * Set default printer name only
   * @param {string} printerName
   * @returns {Promise<object>}
   */
  setDefaultPrinter: async (printerName) => {
    try {
      if (isWebMode()) {
        const response = await client.post('/api/printer/default', { printerName });
        return response.data;
      } else {
        // Desktop mode: Get current settings, update printer name, and save
        console.log('[PRINTER API] Getting current settings...');
        const settings = await printerAPI.getSettings();
        
        if (!settings) {
          console.error('[PRINTER API] Failed to get current settings - settings is null');
          throw new Error('Failed to retrieve current printer settings');
        }
        
        console.log('[PRINTER API] Current settings:', settings);
        console.log('[PRINTER API] Updating printer name to:', printerName);
        
        settings.printerName = printerName;
        
        console.log('[PRINTER API] Saving updated settings...');
        const result = await printerAPI.saveSettings(settings);
        
        console.log('[PRINTER API] Settings saved successfully:', result);
        return result;
      }
    } catch (error) {
      console.error('[PRINTER API] Error in setDefaultPrinter:', error);
      console.error('[PRINTER API] Error details:', {
        message: error.message,
        stack: error.stack,
        printerName: printerName
      });
      throw error;
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
