import { CacheManager } from '../cache/CacheManager';
import { CACHE_TTL } from '../../constants/api';
import { GutenbergBook, BookContent, BookDownloadLink } from './types';
import { cleanHtmlContent, formatTextForReading, extractPreview } from '../../utils/textUtils';
import { TextFormatter } from '../../utils/textFormatting';

/**
 * Project Gutenberg service for free educational books
 * Uses Gutendex API - no API key required
 */
export class GutenbergService {
  private static readonly baseUrl = 'https://gutendex.com';
  private static readonly timeout = 10000;

  /**
   * Search for educational books on Project Gutenberg
   */
  static async searchBooks(
    query: string,
    subjects: string[] = [],
    limit: number = 20,
    useCache: boolean = true
  ): Promise<GutenbergBook[]> {
    try {
      const cacheKey = `gutenberg_search_${query}_${subjects.join(',')}_${limit}`;
      
      if (useCache) {
        const cached = await CacheManager.get(cacheKey);
        if (cached) {
          console.log('Gutenberg: Returning cached search results');
          return cached;
        }
      }

      let url = `${this.baseUrl}/books/?search=${encodeURIComponent(query)}`;
      
      // Add subject filters for educational content
      const educationalSubjects = [
        'Education', 'Science', 'Mathematics', 'History', 'Literature',
        'Philosophy', 'Technology', 'Medicine', 'Psychology', 'Economics'
      ];
      
      const relevantSubjects = subjects.length > 0 ? subjects : educationalSubjects;
      const subjectQuery = relevantSubjects.map(s => `topic=${encodeURIComponent(s)}`).join('&');
      
      if (subjectQuery) {
        url += `&${subjectQuery}`;
      }

      console.log(`Gutenberg: Searching for "${query}"`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Ghana-Education-App/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const books = data.results || [];

      // Filter for educational content
      const educationalBooks = books.filter((book: any) => 
        this.isEducationalBook(book)
      ).slice(0, limit);

      if (useCache && educationalBooks.length > 0) {
        await CacheManager.set(cacheKey, educationalBooks, CACHE_TTL.BOOKS);
      }

      return educationalBooks;
    } catch (error) {
      console.error('Gutenberg search error:', error);
      return [];
    }
  }

  /**
   * Get book content from Project Gutenberg
   */
  static async getBookContent(bookId: number, useCache: boolean = true): Promise<BookContent | null> {
    try {
      const cacheKey = `gutenberg_content_${bookId}`;
      
      if (useCache) {
        const cached = await CacheManager.get(cacheKey);
        if (cached) {
          console.log(`Gutenberg: Returning cached content for book ${bookId}`);
          return cached;
        }
      }

      // Get book details first
      const bookResponse = await fetch(`${this.baseUrl}/books/${bookId}/`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Ghana-Education-App/1.0'
        }
      });

      if (!bookResponse.ok) {
        throw new Error(`Book not found: ${bookId}`);
      }

      const book: GutenbergBook = await bookResponse.json();
      
      // Try to get plain text content
      let content = '';
      let textUrl = '';
      
      // Look for plain text format
      if (book.formats['text/plain; charset=utf-8']) {
        textUrl = book.formats['text/plain; charset=utf-8'];
      } else if (book.formats['text/plain']) {
        textUrl = book.formats['text/plain'];
      }

      if (textUrl) {
        console.log(`Gutenberg: Fetching text content for book ${bookId}`);
        const textResponse = await fetch(textUrl, {
          headers: {
            'User-Agent': 'Ghana-Education-App/1.0'
          }
        });

        if (textResponse.ok) {
          const fullText = await textResponse.text();
          // Clean the text and take first portion for preview
          const cleanedText = this.cleanGutenbergText(fullText);
          content = extractPreview(formatTextForReading(cleanedText), 15000);
        }
      }

      // Generate download links
      const downloadLinks: BookDownloadLink[] = [];
      
      Object.entries(book.formats).forEach(([format, url]) => {
        let type: any = 'web';
        let description = format;
        let quality: 'high' | 'medium' | 'low' = 'medium';

        if (format.includes('epub')) {
          type = 'epub';
          description = 'EPUB format (recommended for mobile)';
          quality = 'high';
        } else if (format.includes('pdf')) {
          type = 'pdf';
          description = 'PDF format';
          quality = 'high';
        } else if (format.includes('text/plain')) {
          type = 'txt';
          description = 'Plain text format';
          quality = 'medium';
        } else if (format.includes('html')) {
          type = 'html';
          description = 'HTML format (web reading)';
          quality = 'medium';
        }

        downloadLinks.push({
          type,
          url,
          format: format.split(';')[0],
          description,
          quality,
          source: 'Project Gutenberg'
        });
      });

      const bookContent: BookContent = {
        title: book.title,
        author: book.authors.map(a => a.name).join(', ') || 'Unknown Author',
        content: content ? TextFormatter.htmlToText(content) : `# ${book.title}\n\n**Author:** ${book.authors.map(a => a.name).join(', ')}\n\n**About this book:**\nThis is a free educational book from Project Gutenberg. Use the download links below to access the full content in various formats.\n\n**Subjects:** ${book.subjects.join(', ')}\n\n**Languages:** ${book.languages.join(', ')}\n\n**Download Count:** ${book.download_count.toLocaleString()} downloads`,
        isFullText: !!content,
        source: 'gutenberg',
        downloadLinks,
        readingOptions: downloadLinks.map(link => ({
          type: link.type === 'html' ? 'web_reader' : 'download',
          url: link.url,
          description: link.description,
          format: link.format
        })),
        metadata: {
          subjects: book.subjects,
          language: book.languages[0],
          description: `Free educational book with ${book.download_count.toLocaleString()} downloads`
        }
      };

      if (useCache) {
        await CacheManager.set(cacheKey, bookContent, CACHE_TTL.BOOKS);
      }

      return bookContent;
    } catch (error) {
      console.error(`Gutenberg content error for book ${bookId}:`, error);
      return null;
    }
  }

  /**
   * Get popular educational books from Project Gutenberg
   */
  static async getPopularEducationalBooks(limit: number = 20): Promise<GutenbergBook[]> {
    try {
      const cacheKey = `gutenberg_popular_${limit}`;
      const cached = await CacheManager.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Get books sorted by download count
      const response = await fetch(`${this.baseUrl}/books/?sort=download_count`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Ghana-Education-App/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const books = (data.results || [])
        .filter((book: any) => this.isEducationalBook(book))
        .slice(0, limit);

      await CacheManager.set(cacheKey, books, CACHE_TTL.BOOKS);
      return books;
    } catch (error) {
      console.error('Gutenberg popular books error:', error);
      return [];
    }
  }

  /**
   * Clean Gutenberg text content
   */
  private static cleanGutenbergText(text: string): string {
    // Remove Project Gutenberg header and footer
    let cleaned = text;
    
    // Remove header (everything before "*** START OF")
    const startMatch = cleaned.match(/\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i);
    if (startMatch) {
      cleaned = cleaned.substring(cleaned.indexOf(startMatch[0]) + startMatch[0].length);
    }

    // Remove footer (everything after "*** END OF")
    const endMatch = cleaned.match(/\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i);
    if (endMatch) {
      cleaned = cleaned.substring(0, cleaned.indexOf(endMatch[0]));
    }

    // Clean up extra whitespace and formatting
    cleaned = cleaned
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Take first 15000 characters for preview
    if (cleaned.length > 15000) {
      cleaned = cleaned.substring(0, 15000) + '\n\n[Content continues... Use download links to read the full book]';
    }

    return cleaned;
  }

  /**
   * Check if a book is educational
   */
  private static isEducationalBook(book: any): boolean {
    const educationalKeywords = [
      'education', 'science', 'mathematics', 'history', 'literature',
      'philosophy', 'technology', 'medicine', 'psychology', 'economics',
      'physics', 'chemistry', 'biology', 'geography', 'language',
      'textbook', 'manual', 'guide', 'introduction', 'principles'
    ];

    const title = book.title.toLowerCase();
    const subjects = book.subjects.join(' ').toLowerCase();

    return educationalKeywords.some(keyword => 
      title.includes(keyword) || subjects.includes(keyword)
    );
  }
}