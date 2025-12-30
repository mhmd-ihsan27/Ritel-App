/**
 * Settings API Module
 * Handles settings operations in both desktop and web modes
 */

import client from './client';
import { isWebMode } from '../utils/environment';

export const settingsAPI = {
  /**
   * Get point settings
   * @returns {Promise<object>}
   */
  getPoinSettings: async () => {
    if (isWebMode()) {
      const response = await client.get('/api/settings/poin');
      return response.data;
    } else {
      const { GetPoinSettings } = await import('../../wailsjs/go/main/App');
      return await GetPoinSettings();
    }
  },

  /**
   * Update point settings
   * @param {object} settings
   * @returns {Promise<object>}
   */
  updatePoinSettings: async (settings) => {
    if (isWebMode()) {
      const response = await client.put('/api/settings/poin', settings);
      return response.data;
    } else {
      const { UpdatePoinSettings } = await import('../../wailsjs/go/main/App');
      return await UpdatePoinSettings(settings);
    }
  },
};
