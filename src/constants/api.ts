// API URLs and configuration
export const API_URLS = {
  GUARDIAN: 'https://content.guardianapis.com',
  OPENLIBRARY: 'https://openlibrary.org',
} as const;

// Cache TTL values (in milliseconds)
export const CACHE_TTL = {
  NEWS: 30 * 60 * 1000, // 30 minutes
  BOOKS: 60 * 60 * 1000, // 1 hour
  USER_DATA: 24 * 60 * 60 * 1000, // 24 hours
} as const;