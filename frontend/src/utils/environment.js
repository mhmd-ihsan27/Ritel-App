/**
 * Environment detection utilities for dual-mode operation
 * Determines whether the app is running in desktop (Wails) or web (browser) mode
 */

/**
 * Check if the app is running in desktop mode (Wails)
 * This includes both production Wails app and development mode via wails dev
 * @returns {boolean} True if running in Wails desktop app
 */
export const isDesktopMode = () => {
  // Check for Wails runtime
  if (typeof window !== 'undefined' && window.wails !== undefined) {
    return true;
  }

  // In Wails dev mode, window.wails might not be immediately available
  // Check if we're running on the Wails dev server (localhost:34115 is the default Wails dev port)
  // or if go/wailsjs bindings are available
  if (typeof window !== 'undefined') {
    // Check if running via Wails dev (check for wailsjs in window or runtime)
    if (window.runtime !== undefined || window.go !== undefined) {
      return true;
    }

    // Force desktop mode if VITE_MODE is explicitly set to 'desktop'
    if (import.meta.env.VITE_MODE === 'desktop') {
      return true;
    }

    // Force web mode if VITE_MODE is explicitly set to 'web'
    if (import.meta.env.VITE_MODE === 'web') {
      return false;
    }
  }

  return false;
};

/**
 * Check if the app is running in web mode (browser)
 * @returns {boolean} True if running in web browser
 */
export const isWebMode = () => {
  return !isDesktopMode();
};

/**
 * Get the API base URL for HTTP requests
 * Only relevant in web mode; returns null for desktop mode
 * @returns {string|null} Base URL for API requests or null if in desktop mode
 */
export const getAPIBaseURL = () => {
  if (isDesktopMode()) {
    return null; // Desktop mode uses Wails bindings, not HTTP
  }

  // In web mode, use environment variable or default to localhost:8080
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
};

/**
 * Get the current mode as a string
 * @returns {string} 'desktop' or 'web'
 */
export const getMode = () => {
  return isDesktopMode() ? 'desktop' : 'web';
};
