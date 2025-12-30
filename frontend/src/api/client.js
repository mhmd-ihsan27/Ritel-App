/**
 * HTTP client for web mode API requests
 * Handles authentication, error handling, and request/response interceptors
 */

import axios from 'axios';
import { getAPIBaseURL, isWebMode } from '../utils/environment';

// Create axios instance with default config
const client = axios.create({
  baseURL: getAPIBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add JWT token to all requests
client.interceptors.request.use(
  (config) => {
    // Only add token in web mode
    if (isWebMode()) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle errors and extract data
client.interceptors.response.use(
  (response) => {
    // Return the data field from the response
    // Backend returns { success, message, data }
    return response.data;
  },
  (error) => {
    // DEBUG: Log full error untuk debugging
    console.error('[API] Full error:', error);
    console.error('[API] Error code:', error.code);
    console.error('[API] Error message:', error.message);
    console.error('[API] Error config:', error.config);
    console.error('[API] Error response:', error.response);

    // Handle network errors (offline/connection issues)
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || !navigator.onLine) {
      console.warn('[API] Network error detected - operation may be queued for sync');
      // Return original error for debugging
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirect to login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Handle 429 Too Many Requests (rate limiting)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const errorMessage = `Terlalu banyak request. Silakan coba lagi ${retryAfter ? `dalam ${retryAfter} detik` : 'beberapa saat lagi'}.`;
      return Promise.reject(new Error(errorMessage));
    }

    // Extract error message from response
    const errorMessage = error.response?.data?.message ||
                        error.response?.data?.error ||
                        error.message ||
                        'Terjadi kesalahan pada server';

    // Return a rejected promise with the error message
    return Promise.reject(new Error(errorMessage));
  }
);

export default client;
