import { CacheManager } from '../cache/CacheManager';
import { CACHE_TTL } from '../../constants/api';
import { InternetArchiveItem, BookContent, BookDownloadLink } from './types';
import { cleanHtmlContent, formatTextForReading, extractPreview } from '../../utils/textUtils';
import { TextFormatter } from '../../utils/textFormatting';

/**
 * Internet Archive service for accessing digitized books
 */
export class InternetArchiveService {
  private static readonly baseUrl = 'https://archive.org';
  private static readonly timeout = 15000;

  /**
   * Search for educational books on Internet Archive
   */
  static async searchBooks(
    query: string,
    subjects: string[] = [],
    limit: number = 20,
    useCache: boolean = true
  ): Promise<InternetArchiveItem[]> {
    try {
      const cacheKey = `ia_search_${query}_${subjects.join(',')}_${limit}`;
      
      if (useCache) {
        const cached = await CacheManager.get(cacheKey);
        if (cached) {
          console.log('Internet Archive: Returning cached search results');
          return cached;
        }
      }

      // Build search query for educational books
      let searchQuery = `(${query}) AND collection:(texts OR books OR opensource)`;
      
      // Add subject filters
      if (subjects.length > 0) {
        const subjectQuery = subjects.map(s => `subject:"${s}"`).join(' OR ');
        searchQuery += ` AND (${subjectQuery})`;
      }

      const params = new URLSearchParams({
        q: searchQuery,
        fl: 'identifier,title,creator,description,subject,language,date,downloads',
        rows: limit.toString(),
        output: 'json'
      });

      console.log(`Internet Archive: Searching for "${query}"`);
      const response = await fetch(`${this.baseUrl}/advancedsearch.php?${params}`, {
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
      const items = data.response?.docs || [];

      // Filter and enhance results
      const educationalItems = items
        .filter((item: any) => this.isEducationalItem(item))
        .map((item: any) => this.enhanceItem(item));

      if (useCache && educationalItems.length > 0) {
        await CacheManager.set(cacheKey, educationalItems, CACHE_TTL.BOOKS);
      }

      return educationalItems;
    } catch (error) {
      console.error('Internet Archive search error:', error);
      return [];
    }
  }

  /**
   * Get book content from Internet Archive
   */
  static async getBookContent(identifier: string, useCache: boolean = true): Promise<BookContent | null> {
    try {
      const cacheKey = `ia_content_${identifier}`;
      
      if (useCache) {
        const cached = await CacheManager.get(cacheKey);
        if (cached) {
          console.log(`Internet Archive: Returning cached content for ${identifier}`);
          return cached;
        }
      }

      // Get item metadata
      const metadataResponse = await fetch(`${this.baseUrl}/metadata/${identifier}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Ghana-Education-App/1.0'
        }
      });

      if (!metadataResponse.ok) {
        throw new Error(`Item not found: ${identifier}`);
      }

      const metadata = await metadataResponse.json();
      const item = metadata.metadata;
      const files = metadata.files || [];

      // Try to get text content
      let content = '';
      let textFile = files.find((f: any) => 
        f.name.endsWith('_djvu.txt') || 
        f.name.endsWith('.txt') ||
        f.format === 'DjVuTXT'
      );

      if (textFile) {
        try {
          console.log(`Internet Archive: Fetching text content for ${identifier}`);
          const textUrl = `${this.baseUrl}/download/${identifier}/${textFile.name}`;
          const textResponse = await fetch(textUrl, {
            headers: {
              'User-Agent': 'Ghana-Education-App/1.0'
            }
          });

          if (textResponse.ok) {
            const fullText = await textResponse.text();
            const cleanedText = this.cleanInternetArchiveText(fullText);
            content = extractPreview(formatTextForReading(cleanedText), 15000);
          }
        } catch (textError) {
          console.log('Could not fetch text content:', textError);
        }
      }

      // Generate download links
      const downloadLinks: BookDownloadLink[] = [];
      
      files.forEach((file: any) => {
        if (this.isDownloadableFormat(file)) {
          let type: 'pdf' | 'epub' | 'txt' | 'html' | 'mobi' | 'web' = 'web';
          let description = file.format || file.name.split('.').pop()?.toUpperCase() || 'Unknown';
          let quality: 'high' | 'medium' | 'low' = 'medium';

          if (file.format === 'PDF' || file.name.endsWith('.pdf')) {
            type = 'pdf';
            description = 'PDF format';
            quality = 'high';
          } else if (file.format === 'EPUB' || file.name.endsWith('.epub')) {
            type = 'epub';
            description = 'EPUB format (recommended for mobile)';
            quality = 'high';
          } else if (file.format === 'Text' || file.name.endsWith('.txt')) {
            type = 'txt';
            description = 'Plain text format';
            quality = 'medium';
          } else if (file.format === 'DjVu' || file.name.endsWith('.djvu')) {
            type = 'web';
            description = 'DjVu format (web viewer)';
            quality = 'high';
          }

          downloadLinks.push({
            type,
            url: `${this.baseUrl}/download/${identifier}/${file.name}`,
            format: file.format || 'Unknown',
            description,
            size: file.size ? this.formatFileSize(file.size) : undefined,
            quality,
            source: 'Internet Archive'
          });
        }
      });

      // Add web reader link
      downloadLinks.unshift({
        type: 'web',
        url: `${this.baseUrl}/details/${identifier}`,
        format: 'Web Reader',
        description: 'Read online in Internet Archive viewer',
        quality: 'high',
        source: 'Internet Archive'
      });

      const bookContent: BookContent = {
        title: Array.isArray(item.title) ? item.title[0] : item.title || 'Unknown Title',
        author: this.formatAuthors(item.creator) || 'Unknown Author',
        content: content ? TextFormatter.htmlToText(content) : this.generateFallbackContent(item),
        isFullText: !!content,
        source: 'internet_archive',
        downloadLinks,
        readingOptions: [
          {
            type: 'web_reader',
            url: `${this.baseUrl}/details/${identifier}`,
            description: 'Read online with Internet Archive viewer',
            format: 'Web Reader'
          },
          ...downloadLinks.filter(link => link.type !== 'web').map(link => ({
            type: 'download' as const,
            url: link.url,
            description: link.description,
            format: link.format
          }))
        ],
        metadata: {
          subjects: Array.isArray(item.subject) ? item.subject : [item.subject].filter(Boolean),
          language: Array.isArray(item.language) ? item.language[0] : item.language,
          publishYear: item.date ? parseInt(item.date.toString().substring(0, 4)) : undefined,
          description: Array.isArray(item.description) ? item.description[0] : item.description
        }
      };

      if (useCache) {
        await CacheManager.set(cacheKey, bookContent, CACHE_TTL.BOOKS);
      }

      return bookContent;
    } catch (error) {
      console.error(`Internet Archive content error for ${identifier}:`, error);
      return null;
    }
  }

  /**
   * Clean Internet Archive text content
   */
  private static cleanInternetArchiveText(text: string): string {
    let cleaned = text;
    
    // Remove OCR artifacts and clean up
    cleaned = cleaned
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
      .trim();

    // Take first 15000 characters for preview
    if (cleaned.length > 15000) {
      cleaned = cleaned.substring(0, 15000) + '\n\n[Content continues... Use download links to read the full book]';
    }

    return cleaned;
  }

  /**
   * Generate fallback content when full text isn't available
   */
  private static generateFallbackContent(item: any): string {
    const title = Array.isArray(item.title) ? item.title[0] : item.title || 'Unknown Title';
    const author = this.formatAuthors(item.creator) || 'Unknown Author';
    const description = Array.isArray(item.description) ? item.description[0] : item.description || '';
    const subjects = Array.isArray(item.subject) ? item.subject.join(', ') : item.subject || '';

    return `# ${title}

**Author:** ${author}
**Subjects:** ${subjects}

## About This Book

${description}

This book is available through the Internet Archive digital library. Use the reading options below to access the full content online or download it in various formats.

## Access Options

- **Web Reader**: Read online with the Internet Archive's built-in viewer
- **Download**: Available in multiple formats including PDF and EPUB
- **Mobile Friendly**: EPUB format recommended for mobile devices

The Internet Archive provides free access to millions of books, movies, music, and other cultural artifacts.`;
  }

  /**
   * Format authors array into string
   */
  private static formatAuthors(creators: any): string {
    if (!creators) return '';
    
    if (Array.isArray(creators)) {
      return creators.slice(0, 3).join(', ');
    }
    
    return creators.toString();
  }

  /**
   * Format file size
   */
  private static formatFileSize(size: string | number): string {
    const bytes = typeof size === 'string' ? parseInt(size) : size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  /**
   * Check if file format is downloadable
   */
  private static isDownloadableFormat(file: any): boolean {
    const downloadableFormats = ['PDF', 'EPUB', 'Text', 'DjVu', 'MOBI'];
    const downloadableExtensions = ['.pdf', '.epub', '.txt', '.djvu', '.mobi'];
    
    return downloadableFormats.includes(file.format) ||
           downloadableExtensions.some(ext => file.name?.endsWith(ext));
  }

  /**
   * Check if item is educational
   */
  private static isEducationalItem(item: any): boolean {
    const educationalKeywords = [
      'education', 'textbook', 'manual', 'guide', 'handbook',
      'science', 'mathematics', 'history', 'literature', 'philosophy',
      'technology', 'medicine', 'psychology', 'economics', 'physics',
      'chemistry', 'biology', 'geography', 'language', 'grammar'
    ];

    const title = (item.title || '').toLowerCase();
    const subjects = Array.isArray(item.subject) ? 
      item.subject.join(' ').toLowerCase() : 
      (item.subject || '').toLowerCase();

    return educationalKeywords.some(keyword => 
      title.includes(keyword) || subjects.includes(keyword)
    );
  }

  /**
   * Enhance item with additional properties
   */
  private static enhanceItem(item: any): InternetArchiveItem {
    return {
      identifier: item.identifier,
      title: Array.isArray(item.title) ? item.title[0] : item.title || 'Unknown Title',
      creator: Array.isArray(item.creator) ? item.creator : [item.creator].filter(Boolean),
      description: Array.isArray(item.description) ? item.description[0] : item.description,
      subject: Array.isArray(item.subject) ? item.subject : [item.subject].filter(Boolean),
      language: Array.isArray(item.language) ? item.language : [item.language].filter(Boolean)
    };
  }
}