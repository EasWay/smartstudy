/**
 * Comprehensive book service types for educational content
 */

export interface BookContent {
  title: string;
  author: string;
  content: string;
  isFullText: boolean;
  source: 'openlibrary' | 'gutenberg' | 'internet_archive' | 'generated';
  downloadLinks: BookDownloadLink[];
  readingOptions: ReadingOption[];
  metadata?: BookMetadata;
}

export interface BookDownloadLink {
  type: 'pdf' | 'epub' | 'txt' | 'html' | 'mobi' | 'web';
  url: string;
  format: string;
  description: string;
  size?: string;
  quality: 'high' | 'medium' | 'low';
  source: string;
}

export interface ReadingOption {
  type: 'web_reader' | 'download' | 'preview';
  url: string;
  description: string;
  format: string;
  requiresAuth?: boolean;
}

export interface BookAvailability {
  canRead: boolean;
  canDownload: boolean;
  requiresBorrow: boolean;
  isPublicDomain: boolean;
  restrictions?: string;
}

export interface BookMetadata {
  isbn?: string;
  publishYear?: number;
  publisher?: string;
  language?: string;
  subjects?: string[];
  pageCount?: number;
  description?: string;
}

export interface ReadingFormat {
  format: 'txt' | 'html' | 'epub' | 'pdf';
  content: string;
  isClean: boolean;
  wordCount?: number;
}

export interface GutenbergBook {
  id: number;
  title: string;
  authors: Array<{
    name: string;
    birth_year?: number;
    death_year?: number;
  }>;
  subjects: string[];
  languages: string[];
  formats: Record<string, string>;
  download_count: number;
}

export interface InternetArchiveItem {
  identifier: string;
  title: string;
  creator?: string[];
  description?: string;
  subject?: string[];
  language?: string[];
  files?: Array<{
    name: string;
    format: string;
    size: string;
    url: string;
  }>;
}