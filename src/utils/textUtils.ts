/**
 * Text processing utilities for cleaning and formatting book content
 */

/**
 * Clean HTML tags and entities from text content
 */
export function cleanHtmlContent(html: string): string {
  if (!html) return '';
  
  let cleaned = html;
  
  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  // Decode common HTML entities
  const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&mdash;': '—',
    '&ndash;': '–',
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&hellip;': '…',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™'
  };
  
  // Replace HTML entities
  Object.entries(htmlEntities).forEach(([entity, replacement]) => {
    cleaned = cleaned.replace(new RegExp(entity, 'g'), replacement);
  });
  
  // Handle numeric HTML entities (&#123; format)
  cleaned = cleaned.replace(/&#(\d+);/g, (match, num) => {
    return String.fromCharCode(parseInt(num, 10));
  });
  
  // Handle hex HTML entities (&#x1A; format)
  cleaned = cleaned.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  // Clean up extra whitespace
  cleaned = cleaned
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
  
  return cleaned;
}

/**
 * Format text for better readability
 */
export function formatTextForReading(text: string): string {
  if (!text) return '';
  
  let formatted = cleanHtmlContent(text);
  
  // Add proper spacing after periods
  formatted = formatted.replace(/\.([A-Z])/g, '. $1');
  
  // Fix common formatting issues
  formatted = formatted
    .replace(/([.!?])\s*\n\s*([A-Z])/g, '$1\n\n$2') // Paragraph breaks
    .replace(/([a-z])\n([A-Z])/g, '$1 $2') // Join broken lines
    .replace(/\n\s*\n\s*\n/g, '\n\n'); // Normalize paragraph spacing
  
  return formatted;
}

/**
 * Extract preview text from longer content
 */
export function extractPreview(text: string, maxLength: number = 15000): string {
  if (!text || text.length <= maxLength) return text;
  
  const cleaned = formatTextForReading(text);
  
  // Try to break at a sentence boundary
  const truncated = cleaned.substring(0, maxLength);
  const lastSentence = truncated.lastIndexOf('.');
  const lastParagraph = truncated.lastIndexOf('\n\n');
  
  // Use the latest sentence or paragraph break
  const breakPoint = Math.max(lastSentence, lastParagraph);
  
  if (breakPoint > maxLength * 0.8) {
    return truncated.substring(0, breakPoint + 1) + 
           '\n\n[Content continues... Use download links to read the full book]';
  }
  
  return truncated + '\n\n[Content continues... Use download links to read the full book]';
}

/**
 * Detect if text contains HTML content
 */
export function containsHtml(text: string): boolean {
  if (!text) return false;
  
  // Check for common HTML patterns
  const htmlPatterns = [
    /<[^>]+>/,           // HTML tags
    /&[a-zA-Z]+;/,       // Named entities
    /&#\d+;/,            // Numeric entities
    /&#x[0-9A-Fa-f]+;/   // Hex entities
  ];
  
  return htmlPatterns.some(pattern => pattern.test(text));
}

/**
 * Estimate reading time in minutes
 */
export function estimateReadingTime(text: string, wordsPerMinute: number = 200): number {
  if (!text) return 0;
  
  const cleaned = cleanHtmlContent(text);
  const wordCount = cleaned.split(/\s+/).filter(word => word.length > 0).length;
  
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Get text statistics
 */
export function getTextStats(text: string): {
  wordCount: number;
  characterCount: number;
  paragraphCount: number;
  readingTime: number;
} {
  if (!text) {
    return { wordCount: 0, characterCount: 0, paragraphCount: 0, readingTime: 0 };
  }
  
  const cleaned = cleanHtmlContent(text);
  const words = cleaned.split(/\s+/).filter(word => word.length > 0);
  const paragraphs = cleaned.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  return {
    wordCount: words.length,
    characterCount: cleaned.length,
    paragraphCount: paragraphs.length,
    readingTime: estimateReadingTime(cleaned)
  };
}