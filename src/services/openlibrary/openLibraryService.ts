import { OpenLibrarySearchResponse, OpenLibraryBook } from '../../types/api';
import { CacheManager } from '../cache/CacheManager';
import { API_URLS, CACHE_TTL } from '../../constants/api';
import {
  OpenLibraryApiParams,
  OpenLibraryApiError,
  OpenLibraryServiceConfig,
  EnhancedOpenLibraryBook,
  EducationalBookFilters
} from './types';

/**
 * OpenLibrary API Service for fetching educational books
 * Uses the free OpenLibrary Search API
 */
export class OpenLibraryService {
  private static readonly config: OpenLibraryServiceConfig = {
    baseUrl: API_URLS.OPENLIBRARY,
    defaultParams: {
      limit: 10,
      fields: 'key,title,author_name,first_publish_year,isbn,subject,cover_i,edition_count,publisher,language,number_of_pages',
      sort: 'relevance'
    },
    timeout: 15000 // 15 seconds for better reliability
  };

  /**
   * Search for educational books
   * @param query - Search query string
   * @param filters - Optional filters for educational content
   * @param useCache - Whether to use cached results (default: true)
   * @returns Promise<EnhancedOpenLibraryBook[]>
   */
  static async searchEducationalBooks(
    query: string,
    filters: EducationalBookFilters = {},
    useCache: boolean = true
  ): Promise<EnhancedOpenLibraryBook[]> {
    try {
      // Build search parameters
      const searchParams = this.buildEducationalSearchParams(query, filters);
      const cacheKey = this.createCacheKey('educational-search', { q: query, ...searchParams });

      // Try to get from cache first
      if (useCache) {
        const cachedData = await CacheManager.get(cacheKey);
        if (cachedData) {
          console.log(`OpenLibrary API: Returning cached educational books for "${query}"`);
          return cachedData;
        }
      }

      // Fetch from API
      console.log(`OpenLibrary API: Searching for educational books: "${query}"`);
      const books = await this.fetchBooks(searchParams);

      // Enhance books with additional properties
      const enhancedBooks = this.enhanceBooks(books, true);

      // Cache the results
      if (useCache && enhancedBooks.length > 0) {
        await CacheManager.set(cacheKey, enhancedBooks, CACHE_TTL.BOOKS);
        console.log(`OpenLibrary API: Cached ${enhancedBooks.length} educational books`);
      }

      return enhancedBooks;
    } catch (error) {
      console.error(`OpenLibrary API: Error searching educational books for "${query}":`, error);

      // Try to return cached data as fallback
      if (useCache) {
        const cacheKey = this.createCacheKey('educational-search', { q: query, ...filters });
        const cachedData = await CacheManager.get(cacheKey);
        if (cachedData) {
          console.log('OpenLibrary API: Returning cached data as fallback');
          return cachedData;
        }
      }

      throw this.handleApiError(error);
    }
  }

  /**
   * Get featured educational books by subject
   * @param subject - Subject area (e.g., 'mathematics', 'science', 'history')
   * @param limit - Number of books to fetch (default: 8)
   * @param useCache - Whether to use cached results (default: true)
   * @returns Promise<EnhancedOpenLibraryBook[]>
   */
  static async getFeaturedBooksBySubject(
    subject: string,
    limit: number = 8,
    useCache: boolean = true
  ): Promise<EnhancedOpenLibraryBook[]> {
    try {
      const cacheKey = this.createCacheKey('featured-subject', { subject, limit });

      // Try cache first
      if (useCache) {
        const cachedData = await CacheManager.get(cacheKey);
        if (cachedData) {
          console.log(`OpenLibrary API: Returning cached featured books for "${subject}"`);
          return cachedData;
        }
      }

      // Use the dedicated Subjects API for better results
      console.log(`OpenLibrary API: Fetching featured books for subject: "${subject}"`);
      const enhancedBooks = await this.getBooksBySubject(subject, limit, false);

      // Cache results
      if (useCache && enhancedBooks.length > 0) {
        await CacheManager.set(cacheKey, enhancedBooks, CACHE_TTL.BOOKS);
      }

      return enhancedBooks;
    } catch (error) {
      console.error(`OpenLibrary API: Error fetching featured books for "${subject}":`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get popular educational books across multiple subjects
   * @param subjects - Array of subjects to search
   * @param limit - Total number of books to return (default: 12)
   * @param useCache - Whether to use cached results (default: true)
   * @returns Promise<EnhancedOpenLibraryBook[]>
   */
  static async getPopularEducationalBooks(
    subjects: string[] = [
      'mathematics',
      'science',
      'history',
      'literature',
      'computer_science',
      'physics',
      'chemistry',
      'biology',
      'education'
    ],
    limit: number = 12,
    useCache: boolean = true
  ): Promise<EnhancedOpenLibraryBook[]> {
    try {
      const cacheKey = this.createCacheKey('popular-educational', { subjects: subjects.join(','), limit });

      // Try cache first
      if (useCache) {
        const cachedData = await CacheManager.get(cacheKey);
        if (cachedData) {
          console.log('OpenLibrary API: Returning cached popular educational books');
          return cachedData;
        }
      }

      console.log('OpenLibrary API: Fetching popular educational books');

      // Fetch books from multiple subjects
      const booksPerSubject = Math.ceil(limit / subjects.length);
      const allBooks: EnhancedOpenLibraryBook[] = [];

      for (const subject of subjects) {
        try {
          const subjectBooks = await this.getFeaturedBooksBySubject(subject, booksPerSubject, false);
          allBooks.push(...subjectBooks);
        } catch (error) {
          console.warn(`Failed to fetch books for subject "${subject}":`, error);
        }
      }

      // Remove duplicates and limit results
      const uniqueBooks = this.removeDuplicateBooks(allBooks).slice(0, limit);

      // Cache results
      if (useCache && uniqueBooks.length > 0) {
        await CacheManager.set(cacheKey, uniqueBooks, CACHE_TTL.BOOKS);
      }

      return uniqueBooks;
    } catch (error) {
      console.error('OpenLibrary API: Error fetching popular educational books:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Search books by author
   * @param author - Author name
   * @param limit - Number of books to fetch (default: 10)
   * @param useCache - Whether to use cached results (default: true)
   * @returns Promise<EnhancedOpenLibraryBook[]>
   */
  static async searchBooksByAuthor(
    author: string,
    limit: number = 10,
    useCache: boolean = true
  ): Promise<EnhancedOpenLibraryBook[]> {
    try {
      const cacheKey = this.createCacheKey('author-search', { author, limit });

      if (useCache) {
        const cachedData = await CacheManager.get(cacheKey);
        if (cachedData) {
          console.log(`OpenLibrary API: Returning cached books by "${author}"`);
          return cachedData;
        }
      }

      const searchParams: OpenLibraryApiParams = {
        ...this.config.defaultParams,
        author,
        limit,
        sort: 'new'
      };

      console.log(`OpenLibrary API: Searching books by author: "${author}"`);
      const books = await this.fetchBooks(searchParams);
      const enhancedBooks = this.enhanceBooks(books);

      if (useCache && enhancedBooks.length > 0) {
        await CacheManager.set(cacheKey, enhancedBooks, CACHE_TTL.BOOKS);
      }

      return enhancedBooks;
    } catch (error) {
      console.error(`OpenLibrary API: Error searching books by "${author}":`, error);
      throw this.handleApiError(error);
    }
  }



  /**
   * Get book recommendations based on a book key
   * @param bookKey - OpenLibrary book key (e.g., '/works/OL45804W')
   * @param limit - Number of recommendations (default: 5)
   * @param useCache - Whether to use cached results (default: true)
   * @returns Promise<EnhancedOpenLibraryBook[]>
   */
  static async getBookRecommendations(
    bookKey: string,
    limit: number = 5,
    useCache: boolean = true
  ): Promise<EnhancedOpenLibraryBook[]> {
    try {
      // For now, we'll implement basic recommendations by finding books with similar subjects
      // In a more advanced implementation, we could use collaborative filtering

      const cacheKey = this.createCacheKey('recommendations', { bookKey, limit });

      if (useCache) {
        const cachedData = await CacheManager.get(cacheKey);
        if (cachedData) {
          console.log(`OpenLibrary API: Returning cached recommendations for "${bookKey}"`);
          return cachedData;
        }
      }

      // This is a simplified recommendation system
      // In practice, you might want to fetch the book details first to get subjects
      console.log(`OpenLibrary API: Getting recommendations for book: "${bookKey}"`);

      // For now, return popular educational books as recommendations
      const recommendations = await this.getPopularEducationalBooks(['science', 'mathematics'], limit, false);

      if (useCache && recommendations.length > 0) {
        await CacheManager.set(cacheKey, recommendations, CACHE_TTL.BOOKS);
      }

      return recommendations;
    } catch (error) {
      console.error(`OpenLibrary API: Error getting recommendations for "${bookKey}":`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Get books by subject using the Subjects API
   * @param subject - Subject name (e.g., 'mathematics', 'science')
   * @param limit - Number of books to fetch (default: 12)
   * @param useCache - Whether to use cached results (default: true)
   * @returns Promise<EnhancedOpenLibraryBook[]>
   */
  static async getBooksBySubject(
    subject: string,
    limit: number = 12,
    useCache: boolean = true
  ): Promise<EnhancedOpenLibraryBook[]> {
    try {
      const cacheKey = this.createCacheKey('subject-books', { subject, limit });

      // Try cache first
      if (useCache) {
        const cachedData = await CacheManager.get(cacheKey);
        if (cachedData) {
          console.log(`OpenLibrary API: Returning cached books for subject "${subject}"`);
          return cachedData;
        }
      }

      // Use the Subjects API endpoint
      const url = `${this.config.baseUrl}/subjects/${encodeURIComponent(subject.toLowerCase())}.json?limit=${limit}`;

      console.log(`OpenLibrary API: Fetching books by subject: "${subject}"`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Ghana-Education-App/1.0 (contact: support@ghana-edu-app.com)'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform the subject API response to match our book format
      const books: OpenLibraryBook[] = (data.works || []).map((work: any) => ({
        key: work.key,
        title: work.title,
        author_name: work.authors?.map((author: any) => author.name) || [],
        first_publish_year: work.first_publish_year,
        cover_i: work.cover_id,
        subject: [subject],
        edition_count: work.edition_count
      }));

      const enhancedBooks = this.enhanceBooks(books, true).slice(0, limit);

      // Cache results
      if (useCache && enhancedBooks.length > 0) {
        await CacheManager.set(cacheKey, enhancedBooks, CACHE_TTL.BOOKS);
      }

      return enhancedBooks;
    } catch (error) {
      console.error(`OpenLibrary API: Error fetching books by subject "${subject}":`, error);

      // Try fallback with search API
      try {
        return await this.searchEducationalBooks(subject, { subject }, useCache);
      } catch (fallbackError) {
        throw this.handleApiError(error);
      }
    }
  }

  /**
   * Get book content and download links
   * @param workKey - Work key (e.g., '/works/OL45804W')
   * @param useCache - Whether to use cached results (default: true)
   * @returns Promise<{ content?: string; downloadLinks: any[]; hasFullText: boolean }>
   */
  static async getBookContent(
    workKey: string,
    useCache: boolean = true
  ): Promise<{ content?: string; downloadLinks: any[]; hasFullText: boolean }> {
    try {
      const cacheKey = this.createCacheKey('book-content', { workKey });

      if (useCache) {
        const cachedData = await CacheManager.get(cacheKey);
        if (cachedData) {
          console.log(`OpenLibrary API: Returning cached book content for "${workKey}"`);
          return cachedData;
        }
      }

      // Get work details first
      const workDetails = await this.getWorkDetails(workKey, useCache);

      // Try to get editions to find download links
      const editionsUrl = `${this.config.baseUrl}${workKey}/editions.json`;

      console.log(`OpenLibrary API: Fetching editions for content: "${workKey}"`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const editionsResponse = await fetch(editionsUrl, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Ghana-Education-App/1.0 (contact: support@ghana-edu-app.com)'
        }
      });

      clearTimeout(timeoutId);

      let downloadLinks: any[] = [];
      let hasFullText = false;
      let content: string | undefined;

      if (editionsResponse.ok) {
        const editionsData = await editionsResponse.json();

        // Look for editions with full text or download links
        for (const edition of editionsData.entries || []) {
          // Check for Internet Archive links
          if (edition.ocaid) {
            downloadLinks.push({
              type: 'web',
              url: `https://archive.org/details/${edition.ocaid}`,
              format: 'Multiple formats',
              description: 'Read online or download from Internet Archive',
              quality: 'high',
              source: 'Internet Archive'
            });
            hasFullText = true;
          }

          // Check for other download sources
          if (edition.source_records) {
            for (const source of edition.source_records) {
              if (source.includes('gutenberg')) {
                const gutenbergId = source.split(':')[1];
                downloadLinks.push({
                  type: 'web',
                  url: `https://www.gutenberg.org/ebooks/${gutenbergId}`,
                  format: 'Multiple formats',
                  description: 'Free ebook from Project Gutenberg',
                  quality: 'high',
                  source: 'Project Gutenberg'
                });
                hasFullText = true;
              }
            }
          }
        }

        // Try to get actual text content from Internet Archive if available
        if (downloadLinks.length > 0 && downloadLinks[0].type === 'Internet Archive') {
          try {
            const iaId = downloadLinks[0].url.split('/').pop();
            const textUrl = `https://archive.org/stream/${iaId}/${iaId}_djvu.txt`;

            const textResponse = await fetch(textUrl, {
              method: 'GET',
              headers: {
                'User-Agent': 'Ghana-Education-App/1.0 (contact: support@ghana-edu-app.com)'
              }
            });

            if (textResponse.ok) {
              const fullText = await textResponse.text();
              // Take first 10000 characters as preview
              content = fullText.substring(0, 10000) + (fullText.length > 10000 ? '\n\n[Content continues... Use download link to read full book]' : '');
            }
          } catch (textError) {
            console.log('Could not fetch full text content:', textError);
          }
        }
      }

      // If no download links found, try to find alternative sources
      if (downloadLinks.length === 0) {
        // Add generic search links
        const title = workDetails?.title || 'Unknown Title';
        const author = workDetails?.authors?.[0]?.name || 'Unknown Author';

        downloadLinks.push({
          type: 'web',
          url: `https://www.google.com/search?q="${title}" "${author}" filetype:pdf`,
          format: 'Search Results',
          description: 'Search for PDF versions online',
          quality: 'medium',
          source: 'Google Search'
        });

        downloadLinks.push({
          type: 'web',
          url: `https://libgen.is/search.php?req=${encodeURIComponent(title + ' ' + author)}`,
          format: 'Multiple formats',
          description: 'Search in Library Genesis',
          quality: 'high',
          source: 'Library Genesis'
        });
      }

      const result = {
        content,
        downloadLinks,
        hasFullText
      };

      // Cache results
      if (useCache) {
        await CacheManager.set(cacheKey, result, CACHE_TTL.BOOKS);
      }

      return result;
    } catch (error) {
      console.error(`OpenLibrary API: Error fetching book content for "${workKey}":`, error);

      // Return basic download links as fallback
      return {
        downloadLinks: [
          {
            type: 'Search Online',
            url: `https://www.google.com/search?q=openlibrary ${workKey} download`,
            format: 'Search Results',
            description: 'Search for this book online'
          }
        ],
        hasFullText: false
      };
    }
  }

  /**
   * Get work details by OpenLibrary work key
   * @param workKey - Work key (e.g., '/works/OL45804W')
   * @param useCache - Whether to use cached results (default: true)
   * @returns Promise<any>
   */
  static async getWorkDetails(
    workKey: string,
    useCache: boolean = true
  ): Promise<any> {
    try {
      const cacheKey = this.createCacheKey('work-details', { workKey });

      if (useCache) {
        const cachedData = await CacheManager.get(cacheKey);
        if (cachedData) {
          console.log(`OpenLibrary API: Returning cached work details for "${workKey}"`);
          return cachedData;
        }
      }

      // Use the Works API endpoint
      const url = `${this.config.baseUrl}${workKey}.json`;

      console.log(`OpenLibrary API: Fetching work details: "${workKey}"`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Ghana-Education-App/1.0 (contact: support@ghana-edu-app.com)'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const workDetails = await response.json();

      // Cache results
      if (useCache) {
        await CacheManager.set(cacheKey, workDetails, CACHE_TTL.BOOKS);
      }

      return workDetails;
    } catch (error) {
      console.error(`OpenLibrary API: Error fetching work details for "${workKey}":`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Check if OpenLibrary API is available
   * @returns Promise<boolean>
   */
  static async isApiAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.config.baseUrl}/search.json?q=test&limit=1`, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Ghana-Education-App/1.0 (contact: support@ghana-edu-app.com)'
        }
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log('OpenLibrary API: Service unavailable');
      return false;
    }
  }

  /**
   * Clear all OpenLibrary API cache
   */
  static async clearCache(): Promise<void> {
    try {
      const keys = await CacheManager.getKeys();
      const openLibraryKeys = keys.filter(key => key.startsWith('openlibrary_'));

      for (const key of openLibraryKeys) {
        await CacheManager.remove(key);
      }

      console.log(`OpenLibrary API: Cleared ${openLibraryKeys.length} cached items`);
    } catch (error) {
      console.error('OpenLibrary API: Error clearing cache:', error);
    }
  }

  /**
   * Private method to fetch books from the API
   * @private
   */
  private static async fetchBooks(params: OpenLibraryApiParams): Promise<OpenLibraryBook[]> {
    const url = this.buildApiUrl(params);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Ghana-Education-App/1.0 (contact: support@ghana-edu-app.com)'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: OpenLibrarySearchResponse = await response.json();
      return data.docs || [];
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
  private static buildApiUrl(params: OpenLibraryApiParams): string {
    const url = new URL('/search.json', this.config.baseUrl);

    // Add parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    return url.toString();
  }

  /**
   * Build search parameters for educational content
   * @private
   */
  private static buildEducationalSearchParams(
    query: string,
    filters: EducationalBookFilters
  ): OpenLibraryApiParams {
    const params: OpenLibraryApiParams = {
      ...this.config.defaultParams,
      q: query
    };

    // Add subject filter
    if (filters.subject) {
      params.subject = filters.subject;
    }

    // Add language filter
    if (filters.language) {
      params.language = filters.language;
    }

    // Add publication year filters
    if (filters.publishedAfter || filters.publishedBefore) {
      let yearQuery = query;
      if (filters.publishedAfter) {
        yearQuery += ` AND first_publish_year:[${filters.publishedAfter} TO *]`;
      }
      if (filters.publishedBefore) {
        yearQuery += ` AND first_publish_year:[* TO ${filters.publishedBefore}]`;
      }
      params.q = yearQuery;
    }

    return params;
  }

  /**
   * Enhance books with additional computed properties
   * @private
   */
  private static enhanceBooks(
    books: OpenLibraryBook[],
    filterEducational: boolean = false
  ): EnhancedOpenLibraryBook[] {
    return books.map(book => {
      const enhanced: EnhancedOpenLibraryBook = {
        ...book,
        coverUrl: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : undefined,
        authorsString: book.author_name ? book.author_name.join(', ') : 'Unknown Author',
        subjectsString: book.subject ? book.subject.slice(0, 3).join(', ') : undefined,
        isEducational: this.isEducationalBook(book)
      };

      return enhanced;
    }).filter(book => !filterEducational || book.isEducational);
  }

  /**
   * Determine if a book is educational based on its subjects and metadata
   * @private
   */
  private static isEducationalBook(book: OpenLibraryBook): boolean {
    const educationalKeywords = [
      'education', 'textbook', 'study', 'learning', 'academic', 'school', 'university',
      'mathematics', 'science', 'history', 'literature', 'physics', 'chemistry',
      'biology', 'computer science', 'programming', 'engineering', 'medicine',
      'psychology', 'philosophy', 'economics', 'geography', 'language', 'grammar'
    ];

    // Check subjects
    if (book.subject) {
      const subjectText = book.subject.join(' ').toLowerCase();
      if (educationalKeywords.some(keyword => subjectText.includes(keyword))) {
        return true;
      }
    }

    // Check title
    const titleText = book.title.toLowerCase();
    if (educationalKeywords.some(keyword => titleText.includes(keyword))) {
      return true;
    }

    // Default to true for broader educational content discovery
    return true;
  }

  /**
   * Remove duplicate books based on title and author
   * @private
   */
  private static removeDuplicateBooks(books: EnhancedOpenLibraryBook[]): EnhancedOpenLibraryBook[] {
    const seen = new Set<string>();
    return books.filter(book => {
      const key = `${book.title.toLowerCase()}_${book.authorsString?.toLowerCase() || ''}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Create cache key for requests
   * @private
   */
  private static createCacheKey(type: string, params: Record<string, any>): string {
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');

    return `openlibrary_${type}_${paramString}`;
  }

  /**
   * Handle and format API errors
   * @private
   */
  private static handleApiError(error: any): OpenLibraryApiError {
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return {
          message: 'Request timeout - please check your internet connection',
          code: 'TIMEOUT_ERROR'
        };
      }

      if (error.message.includes('network') || error.message.includes('fetch')) {
        return {
          message: 'Network error - please check your internet connection',
          code: 'NETWORK_ERROR'
        };
      }

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
      message: 'An unexpected error occurred while fetching books',
      code: 'UNKNOWN_ERROR'
    };
  }
}