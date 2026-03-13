// API Configuration
const getApiBaseUrl = () => {
  // Try different environment variable approaches
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    let url = import.meta.env.VITE_API_URL;
    // Ensure it's a complete URL (starts with http:// or https://)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // If it starts with http: but missing //, add them
      if (url.startsWith('http:')) {
        url = url.replace('http:', 'http://');
      } else {
        // Otherwise prepend the full protocol
        url = `${import.meta.env.VITE_API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
      }
    }
    return url;
  }
  
  if (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) {
    let url = process.env.REACT_APP_API_URL;
    // Ensure it's a complete URL (starts with http:// or https://)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // If it starts with http: but missing //, add them
      if (url.startsWith('http:')) {
        url = url.replace('http:', 'http://');
      } else {
        // Otherwise prepend the full protocol
        url = `${import.meta.env.VITE_API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
      }
    }
    return url;
  }
  
  // Fallback to localhost for development
  return import.meta.env.VITE_API_URL;
};

export const API_BASE_URL = getApiBaseUrl();

// API endpoints
export const API_ENDPOINTS = {
  // Cart endpoints
  CART: '/cart',
  CART_ADD: '/cart',
  CART_UPDATE: (itemId) => `/cart/update/${itemId}`,
  CART_REMOVE: (itemId) => `/cart/remove/${itemId}`,
  CART_CLEAR: '/cart/clear',
  CART_COUNT: '/cart/count',
  CART_SYNC: '/cart/sync',
  
  // Wishlist endpoints
  WISHLIST: '/wishlist',
  WISHLIST_ADD: '/wishlist/add',
  WISHLIST_REMOVE: (itemId) => `/wishlist/remove/${itemId}`,
  WISHLIST_REMOVE_PRODUCT: (productId) => `/wishlist/remove-product/${productId}`,
  WISHLIST_CLEAR: '/wishlist/clear',
  WISHLIST_COUNT: '/wishlist/count',
  WISHLIST_CHECK: (productId) => `/wishlist/check/${productId}`,
  WISHLIST_SYNC: '/wishlist/sync'
};

// Environment detection
export const isDevelopment = () => {
  if (typeof import.meta !== 'undefined') {
    return import.meta.env?.MODE === 'development';
  }
  if (typeof process !== 'undefined') {
    return process.env?.NODE_ENV === 'development';
  }
  return true; // Default to development
};

export const isProduction = () => !isDevelopment();
