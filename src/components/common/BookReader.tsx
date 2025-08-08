import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Linking,
  FlatList,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { EnhancedOpenLibraryBook } from '../../services/openlibrary';
import { BookService } from '../../services/books/bookService';
import { BookContent } from '../../services/books/types';
import { TextFormatter, FormattedTextElement } from '../../utils/textFormatting';

interface BookReaderProps {
  visible: boolean;
  book: EnhancedOpenLibraryBook | null;
  onClose: () => void;
}

// BookContent interface is now imported from services/books/types

export const BookReader: React.FC<BookReaderProps> = ({
  visible,
  book,
  onClose,
}) => {
  const [bookContent, setBookContent] = useState<BookContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [chapters, setChapters] = useState<{ title: string; content: string }[]>([]);
  const [readingMode, setReadingMode] = useState<'formatted' | 'chapters'>('formatted');
  const [showChapterList, setShowChapterList] = useState(false);

  useEffect(() => {
    if (visible && book) {
      fetchBookContent();
    }
  }, [visible, book]);

  const fetchBookContent = async () => {
    if (!book) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`BookReader: Fetching comprehensive content for "${book.title}"`);
      
      // Use the comprehensive BookService to get content from multiple sources
      const bookContent = await BookService.getBookContent(book);
      
      setBookContent(bookContent);
      
      // Split content into chapters for better navigation
      const bookChapters = TextFormatter.splitIntoChapters(bookContent.content);
      setChapters(bookChapters);
      
      console.log(`BookReader: Successfully loaded content from ${bookContent.source} source`);
      console.log(`BookReader: Full text available: ${bookContent.isFullText}`);
      console.log(`BookReader: Download options: ${bookContent.downloadLinks.length}`);
      console.log(`BookReader: Chapters found: ${bookChapters.length}`);
      
    } catch (err) {
      console.error('Error fetching book content:', err);
      setError('Failed to load book content. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  const adjustFontSize = (delta: number) => {
    setFontSize(prev => Math.max(12, Math.min(24, prev + delta)));
  };

  const renderFormattedText = (element: FormattedTextElement, index: number) => {
    switch (element.type) {
      case 'heading1':
        return (
          <Text key={index} style={[styles.heading1, { fontSize: fontSize + 8 }]}>
            {element.content}
          </Text>
        );
      case 'heading2':
        return (
          <Text key={index} style={[styles.heading2, { fontSize: fontSize + 6 }]}>
            {element.content}
          </Text>
        );
      case 'heading3':
        return (
          <Text key={index} style={[styles.heading3, { fontSize: fontSize + 4 }]}>
            {element.content}
          </Text>
        );
      case 'list':
        return (
          <View key={index} style={styles.listItem}>
            <Text style={[styles.listBullet, { fontSize }]}>•</Text>
            <Text style={[styles.listText, { fontSize }]}>{element.content}</Text>
          </View>
        );
      case 'divider':
        return <View key={index} style={styles.textDivider} />;
      case 'paragraph':
      default:
        const textParts = TextFormatter.extractBoldText(element.content);
        return (
          <Text key={index} style={[styles.paragraph, { fontSize, lineHeight: fontSize * 1.5 }]}>
            {textParts.map((part, partIndex) => (
              <Text
                key={partIndex}
                style={part.isBold ? styles.boldText : undefined}
              >
                {part.text}
              </Text>
            ))}
          </Text>
        );
    }
  };

  const renderChapterNavigation = () => (
    <Modal
      visible={showChapterList}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowChapterList(false)}
    >
      <View style={styles.chapterModal}>
        <View style={styles.chapterHeader}>
          <Text style={styles.chapterModalTitle}>Chapters</Text>
          <TouchableOpacity onPress={() => setShowChapterList(false)}>
            <Text style={styles.chapterCloseButton}>✕</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={chapters}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[
                styles.chapterItem,
                currentChapter === index && styles.currentChapterItem
              ]}
              onPress={() => {
                setCurrentChapter(index);
                setShowChapterList(false);
              }}
            >
              <Text style={[
                styles.chapterTitle,
                currentChapter === index && styles.currentChapterTitle
              ]}>
                {item.title}
              </Text>
              <Text style={styles.chapterPreview} numberOfLines={2}>
                {TextFormatter.cleanText(item.content).substring(0, 100)}...
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading book content...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchBookContent}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!bookContent) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No content available</Text>
        </View>
      );
    }

    const currentChapterContent = readingMode === 'chapters' && chapters.length > 0 
      ? chapters[currentChapter]?.content || bookContent.content
      : bookContent.content;

    // Clean HTML content and parse markdown
    const cleanedContent = TextFormatter.htmlToText(currentChapterContent);
    const formattedElements = TextFormatter.parseMarkdownText(cleanedContent);
    const readingTime = TextFormatter.getReadingTime(currentChapterContent);

    return (
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Book Header */}
        <View style={styles.bookHeader}>
          <Text style={[styles.bookTitle, { fontSize: fontSize + 4 }]}>
            {readingMode === 'chapters' && chapters.length > 0 
              ? chapters[currentChapter]?.title || bookContent.title
              : bookContent.title}
          </Text>
          <Text style={[styles.bookAuthor, { fontSize: fontSize - 2 }]}>
            by {bookContent.author}
          </Text>
          
          {/* Reading Info */}
          <View style={styles.readingInfo}>
            <Text style={styles.readingTime}>📖 {readingTime} min read</Text>
            {readingMode === 'chapters' && chapters.length > 1 && (
              <Text style={styles.chapterInfo}>
                Chapter {currentChapter + 1} of {chapters.length}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.divider} />
        
        {/* Formatted Content */}
        <View style={styles.formattedContent}>
          {formattedElements.map((element, index) => renderFormattedText(element, index))}
        </View>

        {/* Chapter Navigation */}
        {readingMode === 'chapters' && chapters.length > 1 && (
          <View style={styles.chapterNavigation}>
            <TouchableOpacity
              style={[styles.navButton, currentChapter === 0 && styles.navButtonDisabled]}
              onPress={() => setCurrentChapter(Math.max(0, currentChapter - 1))}
              disabled={currentChapter === 0}
            >
              <Text style={[styles.navButtonText, currentChapter === 0 && styles.navButtonTextDisabled]}>
                ← Previous
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.chapterListButton}
              onPress={() => setShowChapterList(true)}
            >
              <Text style={styles.chapterListButtonText}>
                {currentChapter + 1} / {chapters.length}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.navButton, currentChapter === chapters.length - 1 && styles.navButtonDisabled]}
              onPress={() => setCurrentChapter(Math.min(chapters.length - 1, currentChapter + 1))}
              disabled={currentChapter === chapters.length - 1}
            >
              <Text style={[styles.navButtonText, currentChapter === chapters.length - 1 && styles.navButtonTextDisabled]}>
                Next →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Download Links Section */}
        {bookContent.downloadLinks && bookContent.downloadLinks.length > 0 && (
          <View style={styles.downloadSection}>
            <Text style={[styles.downloadTitle, { fontSize: fontSize + 2 }]}>
              📥 Access Full Book
            </Text>
            
            {/* Show source information */}
            <View style={styles.sourceInfo}>
              <Text style={styles.sourceText}>
                Content from: {bookContent.source === 'gutenberg' ? 'Project Gutenberg' : 
                              bookContent.source === 'internet_archive' ? 'Internet Archive' :
                              bookContent.source === 'openlibrary' ? 'OpenLibrary' : 'Educational Resources'}
              </Text>
              {bookContent.isFullText && (
                <Text style={styles.fullTextIndicator}>✅ Full text available</Text>
              )}
            </View>
            
            {bookContent.downloadLinks.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.downloadLink,
                  link.quality === 'high' && styles.highQualityLink
                ]}
                onPress={() => Linking.openURL(link.url)}
                activeOpacity={0.7}
              >
                <View style={styles.downloadLinkContent}>
                  <Text style={styles.downloadLinkTitle}>
                    {(link.type || 'UNKNOWN').toUpperCase()} - {link.source}
                  </Text>
                  <Text style={styles.downloadLinkDescription}>{link.description}</Text>
                  <View style={styles.linkMetadata}>
                    <Text style={styles.downloadLinkFormat}>Format: {link.format}</Text>
                    {link.size && (
                      <Text style={styles.downloadLinkSize}>Size: {link.size}</Text>
                    )}
                    <Text style={[
                      styles.qualityBadge,
                      link.quality === 'high' && styles.highQuality,
                      link.quality === 'medium' && styles.mediumQuality,
                      link.quality === 'low' && styles.lowQuality
                    ]}>
                      {(link.quality || 'MEDIUM').toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.downloadArrow}>→</Text>
              </TouchableOpacity>
            ))}
            
            {/* Educational note */}
            <View style={styles.educationalNote}>
              <Text style={styles.educationalNoteTitle}>📚 For Ghana Students</Text>
              <Text style={styles.educationalNoteText}>
                {bookContent.isFullText 
                  ? 'This book is freely available and can support your studies. Download in EPUB format for mobile reading or PDF for printing.'
                  : 'Use the links above to find complete versions of this educational resource. Check your school library or ask your teacher for additional copies.'
                }
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  if (!visible || !book) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.surface} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText} numberOfLines={1}>
              {book.title}
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            {chapters.length > 1 && (
              <TouchableOpacity 
                style={[styles.fontButton, readingMode === 'chapters' && styles.activeButton]} 
                onPress={() => setReadingMode(readingMode === 'chapters' ? 'formatted' : 'chapters')}
              >
                <Text style={[styles.fontButtonText, readingMode === 'chapters' && styles.activeButtonText]}>
                  📑
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.fontButton} 
              onPress={() => adjustFontSize(-2)}
            >
              <Text style={styles.fontButtonText}>A-</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.fontButton} 
              onPress={() => adjustFontSize(2)}
            >
              <Text style={styles.fontButtonText}>A+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {renderContent()}
        </View>
        
        {/* Chapter Navigation Modal */}
        {renderChapterNavigation()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitleText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  fontButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  activeButton: {
    backgroundColor: Colors.white,
  },
  activeButtonText: {
    color: Colors.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  bookHeader: {
    marginBottom: 20,
  },
  bookTitle: {
    fontWeight: '700',
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  bookAuthor: {
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 20,
  },
  readingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  readingTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  chapterInfo: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  formattedContent: {
    marginBottom: 20,
  },
  heading1: {
    fontWeight: '700',
    color: Colors.primaryText,
    marginTop: 24,
    marginBottom: 16,
    lineHeight: 32,
  },
  heading2: {
    fontWeight: '600',
    color: Colors.primaryText,
    marginTop: 20,
    marginBottom: 12,
    lineHeight: 28,
  },
  heading3: {
    fontWeight: '600',
    color: Colors.primaryText,
    marginTop: 16,
    marginBottom: 8,
    lineHeight: 24,
  },
  paragraph: {
    color: Colors.primaryText,
    marginBottom: 12,
    textAlign: 'justify',
  },
  boldText: {
    fontWeight: '600',
    color: Colors.primaryText,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 16,
  },
  listBullet: {
    color: Colors.primary,
    marginRight: 8,
    fontWeight: '600',
  },
  listText: {
    flex: 1,
    color: Colors.primaryText,
  },
  textDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  chapterNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 20,
  },
  navButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    minWidth: 80,
  },
  navButtonDisabled: {
    backgroundColor: Colors.border,
  },
  navButtonText: {
    color: Colors.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  navButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  chapterListButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chapterListButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  chapterModal: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chapterModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  chapterCloseButton: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  chapterItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  currentChapterItem: {
    backgroundColor: Colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryText,
    marginBottom: 4,
  },
  currentChapterTitle: {
    color: Colors.primary,
  },
  chapterPreview: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  downloadSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  downloadTitle: {
    fontWeight: '700',
    color: Colors.primaryText,
    marginBottom: 16,
    textAlign: 'center',
  },
  downloadLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadLinkContent: {
    flex: 1,
  },
  downloadLinkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  downloadLinkDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  downloadLinkFormat: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  downloadArrow: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '600',
  },
  sourceInfo: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  sourceText: {
    fontSize: 14,
    color: Colors.primaryText,
    fontWeight: '500',
    marginBottom: 4,
  },
  fullTextIndicator: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  highQualityLink: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  linkMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  downloadLinkSize: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  qualityBadge: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  highQuality: {
    backgroundColor: Colors.primary,
    color: Colors.white,
  },
  mediumQuality: {
    backgroundColor: Colors.secondary,
    color: Colors.primaryText,
  },
  lowQuality: {
    backgroundColor: Colors.border,
    color: Colors.textSecondary,
  },
  educationalNote: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  educationalNoteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 8,
  },
  educationalNoteText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});