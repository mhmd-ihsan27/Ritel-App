/**
 * Network Status Hook
 * Detects and monitors online/offline status
 */

import { useState, useEffect } from 'react';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    // Update connection type
    const updateConnectionType = () => {
      if (navigator.connection) {
        setConnectionType(navigator.connection.effectiveType || 'unknown');
      }
    };

    // Handle online event
    const handleOnline = () => {
      console.log('[NETWORK] 🟢 Connection RESTORED');
      setIsOnline(true);
      updateConnectionType();
    };

    // Handle offline event
    const handleOffline = () => {
      console.log('[NETWORK] 🔴 Connection LOST');
      setIsOnline(false);
      setConnectionType('offline');
    };

    // Handle connection change
    const handleConnectionChange = () => {
      updateConnectionType();
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.connection) {
      navigator.connection.addEventListener('change', handleConnectionChange);
    }

    // Initial update
    updateConnectionType();

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (navigator.connection) {
        navigator.connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return {
    isOnline,
    connectionType,
    isFast: connectionType === '4g' || connectionType === 'wifi',
    isSlow: connectionType === '2g' || connectionType === 'slow-2g',
  };
};
