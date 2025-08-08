/**
 * Text formatting utilities for book content
 */

export interface FormattedTextElement {
    type: 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'bold' | 'italic' | 'list' | 'divider';
    content: string;
    level?: number;
}

export class TextFormatter {
    /**
     * Parse markdown-style text into formatted elements
     */
    static parseMarkdownText(text: string): FormattedTextElement[] {
        const lines = text.split('\n');
        const elements: FormattedTextElement[] = [];
        let currentParagraph = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Skip empty lines but add them as paragraph breaks
            if (!line) {
                if (currentParagraph) {
                    elements.push({
                        type: 'paragraph',
                        content: currentParagraph.trim()
                    });
                    currentParagraph = '';
                }
                continue;
            }

            // Heading 1 (# Title)
            if (line.startsWith('# ')) {
                if (currentParagraph) {
                    elements.push({
                        type: 'paragraph',
                        content: currentParagraph.trim()
                    });
                    currentParagraph = '';
                }
                elements.push({
                    type: 'heading1',
                    content: line.substring(2).trim(),
                    level: 1
                });
                continue;
            }

            // Heading 2 (## Title)
            if (line.startsWith('## ')) {
                if (currentParagraph) {
                    elements.push({
                        type: 'paragraph',
                        content: currentParagraph.trim()
                    });
                    currentParagraph = '';
                }
                elements.push({
                    type: 'heading2',
                    content: line.substring(3).trim(),
                    level: 2
                });
                continue;
            }

            // Heading 3 (### Title)
            if (line.startsWith('### ')) {
                if (currentParagraph) {
                    elements.push({
                        type: 'paragraph',
                        content: currentParagraph.trim()
                    });
                    currentParagraph = '';
                }
                elements.push({
                    type: 'heading3',
                    content: line.substring(4).trim(),
                    level: 3
                });
                continue;
            }

            // List items (- Item or * Item)
            if (line.startsWith('- ') || line.startsWith('* ')) {
                if (currentParagraph) {
                    elements.push({
                        type: 'paragraph',
                        content: currentParagraph.trim()
                    });
                    currentParagraph = '';
                }
                elements.push({
                    type: 'list',
                    content: line.substring(2).trim()
                });
                continue;
            }

            // Horizontal rule (---)
            if (line === '---' || line === '***') {
                if (currentParagraph) {
                    elements.push({
                        type: 'paragraph',
                        content: currentParagraph.trim()
                    });
                    currentParagraph = '';
                }
                elements.push({
                    type: 'divider',
                    content: ''
                });
                continue;
            }

            // Regular text - accumulate into paragraph
            currentParagraph += (currentParagraph ? ' ' : '') + line;
        }

        // Add final paragraph if exists
        if (currentParagraph) {
            elements.push({
                type: 'paragraph',
                content: currentParagraph.trim()
            });
        }

        return elements;
    }

    /**
     * Clean and format text content for better readability
     */
    static cleanText(text: string): string {
        return text
            // Remove HTML tags completely
            .replace(/<[^>]*>/g, '')
            // Convert HTML entities
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'")
            // Remove markdown formatting
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
            .replace(/\*(.*?)\*/g, '$1')     // Remove italic markdown
            .replace(/`(.*?)`/g, '$1')       // Remove code markdown
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
            // Clean up whitespace
            .replace(/\n{3,}/g, '\n\n')      // Reduce multiple newlines
            .replace(/\s{2,}/g, ' ')         // Reduce multiple spaces
            .trim();
    }

    /**
     * Advanced HTML to clean text conversion
     */
    static htmlToText(html: string): string {
        return html
            // Convert common HTML elements to readable text
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<p[^>]*>/gi, '')
            .replace(/<\/div>/gi, '\n')
            .replace(/<div[^>]*>/gi, '')
            .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n# $1\n\n')
            .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
            .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
            .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
            .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
            .replace(/<ul[^>]*>|<\/ul>/gi, '\n')
            .replace(/<ol[^>]*>|<\/ol>/gi, '\n')
            // Remove all remaining HTML tags
            .replace(/<[^>]*>/g, '')
            // Convert HTML entities
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'")
            .replace(/&hellip;/g, '...')
            .replace(/&mdash;/g, '—')
            .replace(/&ndash;/g, '–')
            // Clean up whitespace
            .replace(/\n{3,}/g, '\n\n')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }

    /**
     * Extract bold text patterns
     */
    static extractBoldText(text: string): { text: string; isBold: boolean }[] {
        const parts: { text: string; isBold: boolean }[] = [];
        const boldRegex = /\*\*(.*?)\*\*/g;
        let lastIndex = 0;
        let match;

        while ((match = boldRegex.exec(text)) !== null) {
            // Add text before bold
            if (match.index > lastIndex) {
                parts.push({
                    text: text.substring(lastIndex, match.index),
                    isBold: false
                });
            }

            // Add bold text
            parts.push({
                text: match[1],
                isBold: true
            });

            lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        if (lastIndex < text.length) {
            parts.push({
                text: text.substring(lastIndex),
                isBold: false
            });
        }

        return parts.length > 0 ? parts : [{ text, isBold: false }];
    }

    /**
     * Get reading time estimate
     */
    static getReadingTime(text: string): number {
        const wordsPerMinute = 200; // Average reading speed
        const wordCount = text.split(/\s+/).length;
        return Math.ceil(wordCount / wordsPerMinute);
    }

    /**
     * Split text into chapters or sections
     */
    static splitIntoChapters(text: string): { title: string; content: string }[] {
        const chapters: { title: string; content: string }[] = [];
        const lines = text.split('\n');
        let currentChapter = { title: 'Introduction', content: '' };

        for (const line of lines) {
            const trimmedLine = line.trim();

            // New chapter on heading 1 or 2
            if (trimmedLine.startsWith('# ') || trimmedLine.startsWith('## ')) {
                // Save previous chapter if it has content
                if (currentChapter.content.trim()) {
                    chapters.push({ ...currentChapter });
                }

                // Start new chapter
                const title = trimmedLine.startsWith('# ')
                    ? trimmedLine.substring(2).trim()
                    : trimmedLine.substring(3).trim();

                currentChapter = { title, content: '' };
            } else {
                currentChapter.content += line + '\n';
            }
        }

        // Add final chapter
        if (currentChapter.content.trim()) {
            chapters.push(currentChapter);
        }

        return chapters.length > 0 ? chapters : [{ title: 'Full Text', content: text }];
    }
}