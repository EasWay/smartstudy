import { GuardianResponse, GuardianArticle } from '../../types/api';
import { CacheManager } from '../cache/CacheManager';
import { API_URLS, CACHE_TTL } from '../../constants/api';
import { GuardianApiParams, GuardianApiError, GuardianServiceConfig } from './types';

/**
 * Guardian API Service for fetching educational news
 * Uses The Guardian Open Platform API (free and open)
 */
export class GuardianService {
  private static readonly config: GuardianServiceConfig = {
    baseUrl: API_URLS.GUARDIAN,
    apiKey: process.env.EXPO_PUBLIC_GUARDIAN_API_KEY || 'test',
    defaultParams: {
      'page-size': 10,
      'show-fields': 'headline,trailText,thumbnail,body,byline,webPublicationDate',
      'order-by': 'newest'
    },
    timeout: 10000 // 10 seconds
  };

  /**
   * Fetch educational and tech news articles from The Guardian
   * @param params - Optional API parameters to override defaults
   * @param useCache - Whether to use cached results (default: true)
   * @returns Promise<GuardianArticle[]>
   */
  static async getEducationalNews(
    params: Partial<GuardianApiParams> = {},
    useCache: boolean = true
  ): Promise<GuardianArticle[]> {
    const cacheKey = this.createCacheKey('education-tech-news', params);
    
    const apiCall = async () => {
      console.log('Guardian API: Fetching fresh educational/tech news');
      return await this.fetchArticles({
        ...this.config.defaultParams,
        q: 'education OR technology OR "artificial intelligence" OR AI OR learning OR university OR school OR student',
        ...params
      });
    };

    try {
      // Try to get from cache first if requested
      if (useCache) {
        const cachedData = await CacheManager.get(cacheKey);
        if (cachedData) {
          console.log('Guardian API: Returning cached educational/tech news');
          return cachedData;
        }
      }

      // Fetch from API
      const articles = await apiCall();

      // Cache the results
      if (useCache && articles.length > 0) {
        await CacheManager.set(cacheKey, articles, CACHE_TTL.NEWS);
        console.log(`Guardian API: Cached ${articles.length} articles`);
      }

      return articles;
    } catch (error) {
      console.error('Guardian API: Error fetching educational/tech news:', error);
      
      // Try to return cached data as fallback
      if (useCache) {
        const cachedData = await CacheManager.get(cacheKey);
        if (cachedData) {
          console.log('Guardian API: Returning cached data as fallback');
          return cachedData;
        }
      }
      
      throw this.handleApiError(error);
    }
  }

  /**
   * Search for articles with custom query
   * @param query - Search query string
   * @param params - Additional API parameters
   * @param useCache - Whether to use cached results
   * @returns Promise<GuardianArticle[]>
   */
  static async searchArticles(
    query: string,
    params: Partial<GuardianApiParams> = {},
    useCache: boolean = true
  ): Promise<GuardianArticle[]> {
    try {
      const searchParams = {
        q: query,
        section: 'education',
        ...params
      };

      const cacheKey = this.createCacheKey('search', searchParams);
      
      // Try cache first
      if (useCache) {
        const cachedData = await CacheManager.get(cacheKey);
        if (cachedData) {
          console.log(`Guardian API: Returning cached search results for "${query}"`);
          return cachedData;
        }
      }

      // Fetch from API
      console.log(`Guardian API: Searching for "${query}"`);
      const articles = await this.fetchArticles({
        ...this.config.defaultParams,
        ...searchParams
      });

      // Cache results
      if (useCache && articles.length > 0) {
        await CacheManager.set(cacheKey, articles, CACHE_TTL.NEWS);
      }

      return articles;
    } catch (error) {
      console.error(`Guardian API: Error searching for "${query}":`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get latest educational headlines (optimized for quick loading)
   * @param count - Number of headlines to fetch (default: 5)
   * @returns Promise<GuardianArticle[]>
   */
  static async getLatestHeadlines(count: number = 5): Promise<GuardianArticle[]> {
    try {
      return await this.getEducationalNews({
        'page-size': count,
        'show-fields': 'headline,trailText,thumbnail,byline'
      });
    } catch (error) {
      console.error('Guardian API: Error fetching latest headlines:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get technology and AI focused news
   * @param count - Number of articles to fetch (default: 8)
   * @param useCache - Whether to use cached results (default: true)
   * @returns Promise<GuardianArticle[]>
   */
  static async getTechAndAINews(count: number = 8, useCache: boolean = true): Promise<GuardianArticle[]> {
    try {
      const cacheKey = this.createCacheKey('tech-ai-news', { 'page-size': count });
      
      // Try cache first
      if (useCache) {
        const cachedData = await CacheManager.get(cacheKey);
        if (cachedData) {
          console.log('Guardian API: Returning cached tech/AI news');
          return cachedData;
        }
      }

      // Fetch tech and AI focused content
      const articles = await this.fetchArticles({
        ...this.config.defaultParams,
        q: 'technology OR "artificial intelligence" OR AI OR "machine learning" OR programming OR coding OR software OR digital OR innovation',
        'page-size': count,
        'show-fields': 'headline,trailText,thumbnail,body,byline,webPublicationDate'
      });

      // Cache results
      if (useCache && articles.length > 0) {
        await CacheManager.set(cacheKey, articles, CACHE_TTL.NEWS);
      }

      return articles;
    } catch (error) {
      console.error('Guardian API: Error fetching tech/AI news:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Check if Guardian API is available
   * @returns Promise<boolean>
   */
  static async isApiAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.config.baseUrl}/search?api-key=${this.config.apiKey}&page-size=1`, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log('Guardian API: Service unavailable');
      return false;
    }
  }

  /**
   * Clear all Guardian API cache
   */
  static async clearCache(): Promise<void> {
    try {
      const keys = await CacheManager.getKeys();
      const guardianKeys = keys.filter(key => key.startsWith('guardian_'));
      
      for (const key of guardianKeys) {
        await CacheManager.remove(key);
      }
      
      console.log(`Guardian API: Cleared ${guardianKeys.length} cached items`);
    } catch (error) {
      console.error('Guardian API: Error clearing cache:', error);
    }
  }

  /**
   * Private method to fetch articles from the API
   * @private
   */
  private static async fetchArticles(params: GuardianApiParams): Promise<GuardianArticle[]> {
    const url = this.buildApiUrl(params);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Ghana-Education-App/1.0'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GuardianResponse = await response.json();
      
      if (data.response.status !== 'ok') {
        throw new Error(`API Error: ${data.response.status}`);
      }

      return data.response.results || [];
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please check your internet connection');
      }
      
      throw error;
    }
  }

  /**
   * Build API URL with parameters
   * @private
   */
  private static buildApiUrl(params: GuardianApiParams): string {
    const url = new URL('/search', this.config.baseUrl);
    
    // Add API key
    url.searchParams.append('api-key', this.config.apiKey);
    
    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    return url.toString();
  }

  /**
   * Create cache key for requests
   * @private
   */
  private static createCacheKey(type: string, params: Partial<GuardianApiParams>): string {
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    
    return `guardian_${type}_${paramString}`;
  }

  /**
   * Handle and format API errors
   * @private
   */
  private static handleApiError(error: any): GuardianApiError {
    if (error instanceof Error) {
      return {
        message: error.message,
        code: 'API_ERROR'
      };
    }
    
    if (typeof error === 'object' && error.status) {
      return {
        message: error.message || 'Unknown API error',
        code: 'HTTP_ERROR',
        status: error.status
      };
    }
    
    return {
      message: 'An unexpected error occurred while fetching news',
      code: 'UNKNOWN_ERROR'
    };
  }
}