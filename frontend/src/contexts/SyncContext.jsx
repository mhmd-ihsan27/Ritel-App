/**
 * Sync Context
 * Provides global sync status and operations
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { syncAPI } from '../api';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { isWebMode } from '../utils/environment';

const SyncContext = createContext();

export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within SyncProvider');
  }
  return context;
};

export const SyncProvider = ({ children }) => {
  const { isOnline } = useNetworkStatus();
  const [syncStatus, setSyncStatus] = useState({
    enabled: false,
    online: isOnline,
    pending: 0,
    synced: 0,
    failed: 0,
    lastSync: null,
    syncing: false
  });

  const [pendingOperations, setPendingOperations] = useState([]);

  // Update sync status
  const updateSyncStatus = useCallback(async () => {
    try {
      const status = await syncAPI.getStatus();
      setSyncStatus(prev => ({
        ...prev,
        ...status,
        online: isOnline,
        lastSync: new Date()
      }));
    } catch (error) {
      console.error('[SYNC] Failed to update status:', error);
      setSyncStatus(prev => ({
        ...prev,
        online: isOnline,
        enabled: false
      }));
    }
  }, [isOnline]);

  // Load pending operations
  const loadPendingOperations = useCallback(async () => {
    try {
      const pending = await syncAPI.getPending();
      setPendingOperations(pending);
    } catch (error) {
      console.error('[SYNC] Failed to load pending operations:', error);
      setPendingOperations([]);
    }
  }, []);

  // Force sync now
  const forceSync = useCallback(async () => {
    if (!isOnline) {
      throw new Error('Cannot sync while offline');
    }

    setSyncStatus(prev => ({ ...prev, syncing: true }));

    try {
      console.log('[SYNC] 🔄 Forcing sync...');
      const result = await syncAPI.forceSync();

      if (result.success) {
        console.log('[SYNC] ✅ Sync completed successfully');
        await updateSyncStatus();
        await loadPendingOperations();
      }

      return result;
    } catch (error) {
      console.error('[SYNC] ❌ Sync failed:', error);
      throw error;
    } finally {
      setSyncStatus(prev => ({ ...prev, syncing: false }));
    }
  }, [isOnline, updateSyncStatus, loadPendingOperations]);

  // Clear synced queue
  const clearSyncedQueue = useCallback(async () => {
    try {
      const result = await syncAPI.clearSynced();
      await updateSyncStatus();
      return result;
    } catch (error) {
      console.error('[SYNC] Failed to clear synced queue:', error);
      throw error;
    }
  }, [updateSyncStatus]);

  // Auto-update sync status when online
  useEffect(() => {
    if (isOnline && !isWebMode()) {
      updateSyncStatus();
      loadPendingOperations();

      // Auto-refresh every 30 seconds when online
      const interval = setInterval(() => {
        updateSyncStatus();
        loadPendingOperations();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isOnline, updateSyncStatus, loadPendingOperations]);

  // Auto-sync when connection restored
  useEffect(() => {
    let timeoutId;

    if (isOnline && !isWebMode()) {
      // Wait 2 seconds after coming online, then sync
      timeoutId = setTimeout(async () => {
        if (syncStatus.pending > 0) {
          console.log('[SYNC] 🔄 Auto-syncing after connection restored...');
          try {
            await forceSync();
          } catch (error) {
            console.error('[SYNC] Auto-sync failed:', error);
          }
        }
      }, 2000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOnline, syncStatus.pending, forceSync]);

  const value = {
    syncStatus,
    pendingOperations,
    isOnline,
    updateSyncStatus,
    loadPendingOperations,
    forceSync,
    clearSyncedQueue
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};
