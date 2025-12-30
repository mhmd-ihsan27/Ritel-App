/**
 * Sync API Module
 * Handles synchronization between offline/online modes
 */

import client from './client';
import { isWebMode } from '../utils/environment';

export const syncAPI = {
  /**
   * Get current sync status and statistics
   * @returns {Promise<{online: boolean, pending: number, synced: number, failed: number}>}
   */
  getStatus: async () => {
    if (!isWebMode()) {
      // Desktop mode - check if sync engine is enabled
      try {
        const response = await client.get('/api/sync/status');
        return response.data;
      } catch (error) {
        // Sync mode not enabled or error
        return {
          online: navigator.onLine,
          pending: 0,
          synced: 0,
          failed: 0,
          enabled: false
        };
      }
    }

    // Web mode - just return online status
    return {
      online: navigator.onLine,
      pending: 0,
      synced: 0,
      failed: 0,
      enabled: false
    };
  },

  /**
   * Manually trigger sync of all pending operations
   * @returns {Promise<{success: boolean, message: string}>}
   */
  forceSync: async () => {
    if (!isWebMode()) {
      try {
        const response = await client.post('/api/sync/force');
        return response;
      } catch (error) {
        throw new Error('Failed to force sync: ' + error.message);
      }
    }

    return {
      success: false,
      message: 'Sync not available in web mode'
    };
  },

  /**
   * Get list of pending sync operations
   * @returns {Promise<Array>}
   */
  getPending: async () => {
    if (!isWebMode()) {
      try {
        const response = await client.get('/api/sync/pending');
        return response.data || [];
      } catch (error) {
        console.error('Failed to get pending syncs:', error);
        return [];
      }
    }

    return [];
  },

  /**
   * Clear successfully synced operations from queue
   * @returns {Promise<{success: boolean, cleared: number}>}
   */
  clearSynced: async () => {
    if (!isWebMode()) {
      try {
        const response = await client.post('/api/sync/clear');
        return response.data;
      } catch (error) {
        throw new Error('Failed to clear synced queue: ' + error.message);
      }
    }

    return { success: false, cleared: 0 };
  },

  /**
   * Check if sync mode is enabled
   * @returns {Promise<boolean>}
   */
  isEnabled: async () => {
    try {
      const status = await syncAPI.getStatus();
      return status.enabled !== false;
    } catch (error) {
      return false;
    }
  }
};
