import { OpenLibraryService } from '../openlibrary/openLibraryService';
import { GutenbergService } from './gutenbergService';
import { InternetArchiveService } from './internetArchiveService';
import { CacheManager } from '../cache/CacheManager';
import { CACHE_TTL } from '../../constants/api';
import { BookContent, BookDownloadLink, BookAvailability } from './types';
import { EnhancedOpenLibraryBook } from '../openlibrary/types';

/**
 * Comprehensive book service that aggregates content from multiple sources
 * Prioritizes educational content for Ghana students
 */
export class BookService {
  /**
   * Get comprehensive book content from multiple sources
   */
  static async getBookContent(
    book: EnhancedOpenLibraryBook,
    useCache: boolean = true
  ): Promise<BookContent> {
    try {
      const cacheKey = `comprehensive_book_${book.key}`;
      
      if (useCache) {
        const cached = await CacheManager.get(cacheKey);
        if (cached) {
          console.log(`BookService: Returning cached content for "${book.title}"`);
          return cached;
        }
      }

      console.log(`BookService: Fetching comprehensive content for "${book.title}"`);
      
      // Try multiple sources in order of preference
      const sources = [
        () => this.tryGutenbergContent(book),
        () => this.tryInternetArchiveContent(book),
        () => this.tryOpenLibraryContent(book)
      ];

      let bestContent: BookContent | null = null;
      
      for (const source of sources) {
        try {
          const content = await source();
          if (content) {
            // Prefer sources with full text
            if (content.isFullText || !bestContent) {
              bestContent = content;
            }
            // If we found full text, we can stop
            if (content.isFullText) {
              break;
            }
          }
        } catch (error) {
          console.log('Source failed, trying next:', error.message);
        }
      }

      // If no content found, generate educational fallback
      if (!bestContent) {
        bestContent = this.generateEducationalContent(book);
      }

      // Enhance with additional educational resources
      bestContent = this.enhanceWithEducationalResources(bestContent, book);

      if (useCache) {
        await CacheManager.set(cacheKey, bestContent, CACHE_TTL.BOOKS);
      }

      return bestContent;
    } catch (error) {
      console.error(`BookService: Error getting content for "${book.title}":`, error);
      return this.generateEducationalContent(book);
    }
  }

  /**
   * Search for educational books across all sources
   */
  static async searchEducationalBooks(
    query: string,
    subjects: string[] = [],
    gradeLevel?: string,
    limit: number = 20
  ): Promise<Array<{ book: any; source: string; availability: BookAvailability }>> {
    try {
      console.log(`BookService: Searching for educational books: "${query}"`);
      
      // Search across all sources simultaneously
      const [openLibraryBooks, gutenbergBooks, iaBooks] = await Promise.allSettled([
        OpenLibraryService.searchEducationalBooks(query, { subject: subjects[0] }),
        GutenbergService.searchBooks(query, subjects, Math.ceil(limit / 3)),
        InternetArchiveService.searchBooks(query, subjects, Math.ceil(limit / 3))
      ]);

      const results: Array<{ book: any; source: string; availability: BookAvailability }> = [];

      // Process OpenLibrary results
      if (openLibraryBooks.status === 'fulfilled') {
        openLibraryBooks.value.forEach(book => {
          results.push({
            book,
            source: 'openlibrary',
            availability: {
              canRead: true,
              canDownload: false,
              requiresBorrow: false,
              isPublicDomain: false
            }
          });
        });
      }

      // Process Gutenberg results
      if (gutenbergBooks.status === 'fulfilled') {
        gutenbergBooks.value.forEach(book => {
          results.push({
            book: {
              key: `/gutenberg/${book.id}`,
              title: book.title,
              author_name: book.authors.map(a => a.name),
              subject: book.subjects,
              authorsString: book.authors.map(a => a.name).join(', '),
              subjectsString: book.subjects.slice(0, 3).join(', '),
              isEducational: true
            },
            source: 'gutenberg',
            availability: {
              canRead: true,
              canDownload: true,
              requiresBorrow: false,
              isPublicDomain: true
            }
          });
        });
      }

      // Process Internet Archive results
      if (iaBooks.status === 'fulfilled') {
        iaBooks.value.forEach(item => {
          results.push({
            book: {
              key: `/ia/${item.identifier}`,
              title: item.title,
              author_name: item.creator || [],
              subject: item.subject || [],
              authorsString: (item.creator || []).join(', ') || 'Unknown Author',
              subjectsString: (item.subject || []).slice(0, 3).join(', '),
              isEducational: true
            },
            source: 'internet_archive',
            availability: {
              canRead: true,
              canDownload: true,
              requiresBorrow: false,
              isPublicDomain: true
            }
          });
        });
      }

      // Sort by relevance and educational value
      return this.rankEducationalBooks(results, query, subjects, gradeLevel).slice(0, limit);
    } catch (error) {
      console.error('BookService: Search error:', error);
      return [];
    }
  }

  /**
   * Try to get content from Project Gutenberg
   */
  private static async tryGutenbergContent(book: EnhancedOpenLibraryBook): Promise<BookContent | null> {
    try {
      // Search for the book on Gutenberg
      const gutenbergBooks = await GutenbergService.searchBooks(book.title, [], 5, false);
      
      // Find best match
      const match = gutenbergBooks.find(gb => 
        this.isSimilarBook(book.title, gb.title, book.authorsString, gb.authors.map(a => a.name).join(', '))
      );

      if (match) {
        console.log(`BookService: Found Gutenberg match for "${book.title}"`);
        return await GutenbergService.getBookContent(match.id, false);
      }
      
      return null;
    } catch (error) {
      console.log('Gutenberg content fetch failed:', error);
      return null;
    }
  }

  /**
   * Try to get content from Internet Archive
   */
  private static async tryInternetArchiveContent(book: EnhancedOpenLibraryBook): Promise<BookContent | null> {
    try {
      // Search for the book on Internet Archive
      const iaItems = await InternetArchiveService.searchBooks(book.title, [], 5, false);
      
      // Find best match
      const match = iaItems.find(item => 
        this.isSimilarBook(book.title, item.title, book.authorsString, (item.creator || []).join(', '))
      );

      if (match) {
        console.log(`BookService: Found Internet Archive match for "${book.title}"`);
        return await InternetArchiveService.getBookContent(match.identifier, false);
      }
      
      return null;
    } catch (error) {
      console.log('Internet Archive content fetch failed:', error);
      return null;
    }
  }

  /**
   * Try to get content from OpenLibrary
   */
  private static async tryOpenLibraryContent(book: EnhancedOpenLibraryBook): Promise<BookContent | null> {
    try {
      const olContent = await OpenLibraryService.getBookContent(book.key, false);
      
      if (olContent.content) {
        return {
          title: book.title,
          author: book.authorsString || 'Unknown Author',
          content: olContent.content,
          isFullText: olContent.hasFullText,
          source: 'openlibrary',
          downloadLinks: olContent.downloadLinks,
          readingOptions: olContent.downloadLinks.map(link => ({
            type: link.type === 'Internet Archive' ? 'web_reader' : 'download',
            url: link.url,
            description: link.description,
            format: link.format
          }))
        };
      }
      
      return null;
    } catch (error) {
      console.log('OpenLibrary content fetch failed:', error);
      return null;
    }
  }

  /**
   * Generate educational content when no source has full text
   */
  private static generateEducationalContent(book: EnhancedOpenLibraryBook): BookContent {
    const subjects = book.subjectsString || 'Educational Content';
    const year = book.first_publish_year || 'Unknown';
    
    return {
      title: book.title,
      author: book.authorsString || 'Unknown Author',
      content: `# ${book.title}

**Author:** ${book.authorsString || 'Unknown Author'}
**Published:** ${year}
**Subjects:** ${subjects}

## About This Educational Resource

This book covers important topics in ${subjects.toLowerCase()}. It's designed to help students understand key concepts and develop critical thinking skills.

## Learning Objectives

By reading this book, students will:
- Gain foundational knowledge in ${subjects.toLowerCase()}
- Develop analytical and problem-solving abilities
- Learn to apply theoretical concepts to real-world situations
- Build a strong foundation for advanced study

## Educational Value

This resource is particularly valuable for students in Ghana's education system, providing:
- Curriculum-aligned content
- Clear explanations of complex topics
- Examples relevant to local context
- Preparation for examinations and further study

## How to Access the Full Book

Use the download links below to access the complete content. We recommend:
- **EPUB format** for mobile reading
- **PDF format** for printing and note-taking
- **Web reader** for immediate access

## Study Tips

1. **Active Reading**: Take notes while reading
2. **Discussion**: Share insights with study groups
3. **Practice**: Apply concepts through exercises
4. **Review**: Regularly revisit key concepts

---

*This educational resource is provided to support learning and academic development for students in Ghana.*`,
      isFullText: false,
      source: 'generated',
      downloadLinks: [
        {
          type: 'web',
          url: `https://www.google.com/search?q="${book.title}" "${book.authorsString}" filetype:pdf`,
          format: 'Search Results',
          description: 'Search for PDF versions online',
          quality: 'medium',
          source: 'Google Search'
        },
        {
          type: 'web',
          url: `https://libgen.is/search.php?req=${encodeURIComponent(book.title)}`,
          format: 'Multiple formats',
          description: 'Search in Library Genesis',
          quality: 'high',
          source: 'Library Genesis'
        }
      ],
      readingOptions: [
        {
          type: 'preview',
          url: '#',
          description: 'Educational preview available above',
          format: 'Text'
        }
      ],
      metadata: {
        subjects: book.subject || [],
        publishYear: book.first_publish_year,
        description: `Educational resource covering ${subjects.toLowerCase()}`
      }
    };
  }

  /**
   * Enhance content with additional educational resources
   */
  private static enhanceWithEducationalResources(
    content: BookContent, 
    book: EnhancedOpenLibraryBook
  ): BookContent {
    // Add educational context for Ghana students
    const enhancedContent = { ...content };
    
    // Add study resources section
    enhancedContent.content += `

## Additional Study Resources

### Related Topics
${book.subject?.slice(0, 5).map(subject => `- ${subject}`).join('\n') || '- General Education'}

### Recommended for Ghana Students
This book aligns with educational standards and can support:
- ${this.getGradeRecommendations(book.subject || [])}
- Preparation for WASSCE and other examinations
- University entrance requirements
- Professional development

### Study Group Discussion Points
1. How do the concepts in this book apply to the Ghanaian context?
2. What are the practical applications in daily life?
3. How can this knowledge contribute to national development?
4. What are the connections to other subjects in the curriculum?`;

    return enhancedContent;
  }

  /**
   * Get grade level recommendations based on subjects
   */
  private static getGradeRecommendations(subjects: string[]): string {
    const subjectText = subjects.join(' ').toLowerCase();
    
    if (subjectText.includes('mathematics') || subjectText.includes('algebra')) {
      return 'JHS 2-3, SHS 1-3 Mathematics students';
    } else if (subjectText.includes('science') || subjectText.includes('physics') || subjectText.includes('chemistry')) {
      return 'JHS 3, SHS 1-3 Science students';
    } else if (subjectText.includes('history') || subjectText.includes('social')) {
      return 'JHS 1-3, SHS 1-3 Social Studies students';
    } else if (subjectText.includes('literature') || subjectText.includes('english')) {
      return 'JHS 1-3, SHS 1-3 English Language students';
    } else {
      return 'JHS and SHS students across all levels';
    }
  }

  /**
   * Check if two books are similar
   */
  private static isSimilarBook(title1: string, title2: string, author1?: string, author2?: string): boolean {
    const normalizeTitle = (title: string) => 
      title.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const normalizedTitle1 = normalizeTitle(title1);
    const normalizedTitle2 = normalizeTitle(title2);

    // Check title similarity
    const titleSimilarity = this.calculateSimilarity(normalizedTitle1, normalizedTitle2);
    
    // Check author similarity if available
    let authorSimilarity = 0;
    if (author1 && author2) {
      const normalizedAuthor1 = normalizeTitle(author1);
      const normalizedAuthor2 = normalizeTitle(author2);
      authorSimilarity = this.calculateSimilarity(normalizedAuthor1, normalizedAuthor2);
    }

    // Consider it a match if title similarity > 0.7 or (title > 0.5 and author > 0.7)
    return titleSimilarity > 0.7 || (titleSimilarity > 0.5 && authorSimilarity > 0.7);
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Rank educational books by relevance and educational value
   */
  private static rankEducationalBooks(
    results: Array<{ book: any; source: string; availability: BookAvailability }>,
    query: string,
    subjects: string[],
    gradeLevel?: string
  ): Array<{ book: any; source: string; availability: BookAvailability }> {
    return results.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Prefer sources with full text availability
      if (a.availability.canDownload && a.availability.isPublicDomain) scoreA += 10;
      if (b.availability.canDownload && b.availability.isPublicDomain) scoreB += 10;

      // Prefer Gutenberg (highest quality) > Internet Archive > OpenLibrary
      const sourceScores = { gutenberg: 8, internet_archive: 6, openlibrary: 4 };
      scoreA += sourceScores[a.source as keyof typeof sourceScores] || 0;
      scoreB += sourceScores[b.source as keyof typeof sourceScores] || 0;

      // Prefer books with relevant subjects
      if (subjects.length > 0) {
        const aSubjects = (a.book.subject || []).join(' ').toLowerCase();
        const bSubjects = (b.book.subject || []).join(' ').toLowerCase();
        
        subjects.forEach(subject => {
          if (aSubjects.includes(subject.toLowerCase())) scoreA += 5;
          if (bSubjects.includes(subject.toLowerCase())) scoreB += 5;
        });
      }

      // Title relevance to query
      const aTitleMatch = a.book.title.toLowerCase().includes(query.toLowerCase()) ? 3 : 0;
      const bTitleMatch = b.book.title.toLowerCase().includes(query.toLowerCase()) ? 3 : 0;
      scoreA += aTitleMatch;
      scoreB += bTitleMatch;

      return scoreB - scoreA;
    });
  }
}