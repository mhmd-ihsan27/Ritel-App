/**
 * Hardware API Module
 * Handles hardware detection operations in both desktop and web modes
 */

import client from './client';
import { isWebMode } from '../utils/environment';

export const hardwareAPI = {
  /**
   * Detect connected hardware
   * @returns {Promise<object>}
   */
  detectHardware: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/hardware/detect');
      return response.data;
    } else {
      const { DetectHardware } = await import('../../wailsjs/go/main/App');
      return await DetectHardware();
    }
  },

  /**
   * Get barcode scanner status
   * @returns {Promise<boolean>}
   */
  getScannerStatus: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/hardware/scanner-status');
      return response.data;
    } else {
      const { GetBarcodeScannerStatus } = await import('../../wailsjs/go/main/App');
      return await GetBarcodeScannerStatus();
    }
  },

  /**
   * Test barcode scanner
   * @param {string} port - Serial port to test
   * @returns {Promise<object>}
   */
  testScanner: async (port) => {
    if (isWebMode()) {
      const response = await client.post('/api/hardware/test-scanner', { port });
      return response.data;
    } else {
      const { TestScanner } = await import('../../wailsjs/go/main/App');
      return await TestScanner(port);
    }
  },

  /**
   * Test cash drawer
   * @param {string} port - Serial port to test
   * @returns {Promise<object>}
   */
  testCashDrawer: async (port) => {
    if (isWebMode()) {
      const response = await client.post('/api/hardware/test-cash-drawer', { port });
      return response.data;
    } else {
      const { TestCashDrawer } = await import('../../wailsjs/go/main/App');
      return await TestCashDrawer(port);
    }
  },

  /**
   * Test printer
   * @param {string} port - Serial port to test
   * @returns {Promise<object>}
   */
  testPrinter: async (port) => {
    if (isWebMode()) {
      const response = await client.post('/api/hardware/test-printer', { port });
      return response.data;
    } else {
      const { TestPrinter } = await import('../../wailsjs/go/main/App');
      return await TestPrinter(port);
    }
  },
};
