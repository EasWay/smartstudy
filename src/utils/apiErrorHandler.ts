import { CacheManager } from '../services/cache/CacheManager';

export interface ApiError {
  message: string;
  code: string;
  status?: number;
  isNetworkError: boolean;
  isTimeoutError: boolean;
  canRetry: boolean;
}

export class ApiErrorHandler {
  /**
   * Parse and categorize API errors
   */
  static parseError(error: any): ApiError {
    // Network/Connection errors
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return {
        message: 'Request timeout. Please check your internet connection and try again.',
        code: 'TIMEOUT_ERROR',
        isNetworkError: true,
        isTimeoutError: true,
        canRetry: true,
      };
    }

    if (error.message?.includes('Network request failed') || 
        error.message?.includes('fetch')) {
      return {
        message: 'Network error. Please check your internet connection.',
        code: 'NETWORK_ERROR',
        isNetworkError: true,
        isTimeoutError: false,
        canRetry: true,
      };
    }

    // HTTP errors
    if (error.status) {
      switch (error.status) {
        case 400:
          return {
            message: 'Invalid request. Please try again.',
            code: 'BAD_REQUEST',
            status: 400,
            isNetworkError: false,
            isTimeoutError: false,
            canRetry: false,
          };
        case 401:
          return {
            message: 'Authentication required. Please log in again.',
            code: 'UNAUTHORIZED',
            status: 401,
            isNetworkError: false,
            isTimeoutError: false,
            canRetry: false,
          };
        case 403:
          return {
            message: 'Access denied. You don\'t have permission to access this resource.',
            code: 'FORBIDDEN',
            status: 403,
            isNetworkError: false,
            isTimeoutError: false,
            canRetry: false,
          };
        case 404:
          return {
            message: 'Resource not found.',
            code: 'NOT_FOUND',
            status: 404,
            isNetworkError: false,
            isTimeoutError: false,
            canRetry: false,
          };
        case 429:
          return {
            message: 'Too many requests. Please wait a moment and try again.',
            code: 'RATE_LIMITED',
            status: 429,
            isNetworkError: false,
            isTimeoutError: false,
            canRetry: true,
          };
        case 500:
        case 502:
        case 503:
        case 504:
          return {
            message: 'Server error. Please try again later.',
            code: 'SERVER_ERROR',
            status: error.status,
            isNetworkError: false,
            isTimeoutError: false,
            canRetry: true,
          };
        default:
          return {
            message: `HTTP ${error.status}: ${error.statusText || 'Unknown error'}`,
            code: 'HTTP_ERROR',
            status: error.status,
            isNetworkError: false,
            isTimeoutError: false,
            canRetry: true,
          };
      }
    }

    // API-specific errors
    if (error.code === 'API_ERROR') {
      return {
        message: error.message || 'API error occurred',
        code: 'API_ERROR',
        isNetworkError: false,
        isTimeoutError: false,
        canRetry: true,
      };
    }

    // Generic error
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      isNetworkError: false,
      isTimeoutError: false,
      canRetry: true,
    };
  }

  /**
   * Handle API call with automatic retry and caching fallback
   */
  static async handleApiCall<T>(
    apiCall: () => Promise<T>,
    cacheKey?: string,
    maxRetries: number = 2,
    retryDelay: number = 1000
  ): Promise<{ data: T | null; error: ApiError | null; isFromCache: boolean }> {
    let lastError: ApiError | null = null;
    
    // Try the API call with retries
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const data = await apiCall();
        return { data, error: null, isFromCache: false };
      } catch (error) {
        lastError = this.parseError(error);
        
        // Don't retry if it's not a retryable error
        if (!lastError.canRetry) {
          break;
        }
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait before retrying
        await this.delay(retryDelay * (attempt + 1));
      }
    }

    // If we have a cache key, try to get cached data as fallback
    if (cacheKey) {
      try {
        const cachedData = await CacheManager.get(cacheKey);
        if (cachedData) {
          console.log(`ApiErrorHandler: Using cached data as fallback for ${cacheKey}`);
          return { data: cachedData, error: lastError, isFromCache: true };
        }
      } catch (cacheError) {
        console.warn('ApiErrorHandler: Failed to get cached data:', cacheError);
      }
    }

    return { data: null, error: lastError, isFromCache: false };
  }

  /**
   * Get user-friendly error message based on error type
   */
  static getUserFriendlyMessage(error: ApiError): string {
    if (error.isNetworkError) {
      return 'Please check your internet connection and try again.';
    }

    if (error.isTimeoutError) {
      return 'The request is taking too long. Please try again.';
    }

    switch (error.code) {
      case 'RATE_LIMITED':
        return 'You\'re making requests too quickly. Please wait a moment and try again.';
      case 'SERVER_ERROR':
        return 'Our servers are experiencing issues. Please try again in a few minutes.';
      case 'UNAUTHORIZED':
        return 'Please log in again to continue.';
      case 'FORBIDDEN':
        return 'You don\'t have permission to access this content.';
      case 'NOT_FOUND':
        return 'The requested content could not be found.';
      default:
        return error.message;
    }
  }

  /**
   * Determine if cached content should be shown
   */
  static shouldShowCachedContent(error: ApiError): boolean {
    return error.isNetworkError || error.isTimeoutError || error.code === 'SERVER_ERROR';
  }

  /**
   * Get retry suggestion based on error type
   */
  static getRetryMessage(error: ApiError): string {
    if (error.isNetworkError) {
      return 'Check your connection and retry';
    }

    if (error.isTimeoutError) {
      return 'Try again';
    }

    if (error.code === 'RATE_LIMITED') {
      return 'Wait and retry';
    }

    if (error.code === 'SERVER_ERROR') {
      return 'Retry in a few minutes';
    }

    return 'Try again';
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default ApiErrorHandler;