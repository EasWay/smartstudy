import { OpenLibraryBook, OpenLibrarySearchResponse } from '../../types/api';

/**
 * OpenLibrary API parameters for search requests
 */
export interface OpenLibraryApiParams {
  q?: string; // Search query
  title?: string; // Search by title
  author?: string; // Search by author
  subject?: string; // Search by subject
  limit?: number; // Number of results (default: 10, max: 100)
  offset?: number; // Pagination offset
  fields?: string; // Comma-separated list of fields to return
  sort?: 'relevance' | 'rating' | 'new' | 'old'; // Sort order
  language?: string; // Language filter (e.g., 'eng' for English)
}

/**
 * OpenLibrary service configuration
 */
export interface OpenLibraryServiceConfig {
  baseUrl: string;
  defaultParams: Partial<OpenLibraryApiParams>;
  timeout: number;
}

/**
 * OpenLibrary API error interface
 */
export interface OpenLibraryApiError {
  message: string;
  code: 'API_ERROR' | 'HTTP_ERROR' | 'NETWORK_ERROR' | 'TIMEOUT_ERROR' | 'UNKNOWN_ERROR';
  status?: number;
}

/**
 * Enhanced book interface with additional computed properties
 */
export interface EnhancedOpenLibraryBook extends OpenLibraryBook {
  coverUrl?: string; // Generated cover image URL
  authorsString?: string; // Formatted authors string
  subjectsString?: string; // Formatted subjects string
  isEducational?: boolean; // Whether the book is educational
}

/**
 * Book search filters for educational content
 */
export interface EducationalBookFilters {
  subject?: string;
  gradeLevel?: 'elementary' | 'middle' | 'high' | 'college';
  language?: string;
  hasCovers?: boolean;
  publishedAfter?: number;
  publishedBefore?: number;
}