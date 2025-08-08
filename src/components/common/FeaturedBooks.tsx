import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { OpenLibraryService, EnhancedOpenLibraryBook } from '../../services/openlibrary';
import { BookCard } from './BookCard';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import { OfflineState } from './OfflineState';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import { BookReader } from './BookReader';
import { useCustomAlert } from './CustomAlert';
import { PersonalizationService } from '../../services/personalization/PersonalizationService';
import { ApiErrorHandler } from '../../utils/apiErrorHandler';

interface FeaturedBooksProps {
  title?: string;
  subject?: string;
  limit?: number;
  horizontal?: boolean;
  onBookPress?: (book: EnhancedOpenLibraryBook) => void;
  onSeeAllPress?: () => void;
}

export const FeaturedBooks: React.FC<FeaturedBooksProps> = ({
  title = 'Featured Educational Books',
  subject,
  limit = 8,
  horizontal = true,
  onBookPress,
  onSeeAllPress
}) => {
  const [books, setBooks] = useState<EnhancedOpenLibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<EnhancedOpenLibraryBook | null>(null);
  const [readerVisible, setReaderVisible] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const { user } = useAuth();
  const { isOnline } = useNetwork();
  const { showAlert, AlertComponent } = useCustomAlert();

  useEffect(() => {
    fetchBooks();
  }, [subject, limit, user]);

  const fetchBooks = async (useCache: boolean = true) => {
    if (!user) {
      setError('Please log in to see personalized book recommendations.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setIsFromCache(false);

      // Determine cache key based on parameters
      const cacheKey = subject 
        ? `openlibrary_featured-subject_subject:${subject}|limit:${limit}`
        : `openlibrary_popular-educational_subjects:${getUserPreferredSubjects().join(',')}|limit:${limit}`;

      // Create API call function
      const apiCall = async () => {
        if (subject) {
          return await OpenLibraryService.getFeaturedBooksBySubject(subject, limit, useCache);
        } else {
          const userSubjects = getUserPreferredSubjects();
          return await OpenLibraryService.getPopularEducationalBooks(userSubjects, limit, useCache);
        }
      };

      // Use enhanced error handling
      const result = await ApiErrorHandler.handleApiCall(
        apiCall,
        cacheKey,
        2, // max retries
        1500 // retry delay
      );

      if (result.data && result.data.length > 0) {
        // Add lightweight personalization scoring
        const personalizedBooks = result.data.map(book => ({
          ...book,
          personalization: PersonalizationService.scoreBook(book, user)
        })).sort((a, b) => b.personalization.score - a.personalization.score);

        setBooks(personalizedBooks);
        setIsFromCache(result.isFromCache);
        setRetryCount(0); // Reset retry count on success
        
        console.log(`FeaturedBooks: Loaded ${personalizedBooks.length} personalized books${result.isFromCache ? ' (cached)' : ''}`);

        // Show warning if data is from cache due to error
        if (result.isFromCache && result.error) {
          setError(`${ApiErrorHandler.getUserFriendlyMessage(result.error)} Showing cached books.`);
        }
      } else {
        // No data available
        if (result.error) {
          setError(ApiErrorHandler.getUserFriendlyMessage(result.error));
        } else {
          setError('No books found. Please try again later.');
        }
      }

    } catch (err) {
      console.error('FeaturedBooks: Unexpected error fetching books:', err);
      setError('An unexpected error occurred while loading books.');
    } finally {
      setLoading(false);
    }
  };

  const getUserPreferredSubjects = (): string[] => {
    if (!user?.subjectsOfInterest || user.subjectsOfInterest.length === 0) {
      // Default subjects based on grade level
      if (user?.gradeLevel) {
        const gradeLevel = user.gradeLevel.toLowerCase();
        if (gradeLevel.includes('primary')) {
          return ['mathematics', 'science', 'english', 'social studies'];
        } else if (gradeLevel.includes('jhs')) {
          return ['mathematics', 'science', 'english', 'social studies', 'integrated science'];
        } else if (gradeLevel.includes('shs')) {
          return ['mathematics', 'physics', 'chemistry', 'biology', 'english', 'economics'];
        } else if (gradeLevel.includes('university')) {
          return ['computer science', 'engineering', 'mathematics', 'physics', 'chemistry'];
        }
      }
      // Fallback to general subjects
      return ['mathematics', 'science', 'computer science', 'physics', 'chemistry'];
    }

    // Map user subjects to OpenLibrary search terms
    return user.subjectsOfInterest.map(subject =>
      subject.toLowerCase()
        .replace('information technology', 'computer science')
        .replace('integrated science', 'science')
        .replace('english language', 'english')
    );
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchBooks(false); // Force fresh data on retry
  };

  const handleBookPress = (book: EnhancedOpenLibraryBook) => {
    if (onBookPress) {
      onBookPress(book);
    } else {
      // Show enhanced options with source information
      const message = `${book.authorsString ? `By: ${book.authorsString}\n` : ''}${book.first_publish_year ? `Published: ${book.first_publish_year}\n` : ''}${book.subjectsString ? `Subjects: ${book.subjectsString}\n` : ''}\n📚 This book will be loaded from multiple educational sources including Project Gutenberg, Internet Archive, and OpenLibrary for the best reading experience.`;

      showAlert(
        book.title,
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Read Book',
            onPress: () => {
              setSelectedBook(book);
              setReaderVisible(true);
            }
          }
        ]
      );
    }
  };

  const renderBook = ({ item }: { item: EnhancedOpenLibraryBook }) => (
    <View style={horizontal ? styles.horizontalBookContainer : styles.verticalBookContainer}>
      <BookCard
        book={item}
        onPress={handleBookPress}
        compact={horizontal}
        showSubjects={!horizontal}
        fixedSize={true}
      />
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {isFromCache && (
          <View style={styles.cacheIndicator}>
            <Text style={styles.cacheText}>Cached</Text>
          </View>
        )}
      </View>
      {onSeeAllPress && books.length > 0 && (
        <TouchableOpacity onPress={onSeeAllPress}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderError = () => (
    <ErrorState
      title="Unable to load books"
      message={error || 'Failed to load books'}
      onRetry={handleRetry}
      retryText={retryCount > 0 ? `Retry (${retryCount})` : 'Retry'}
      style={styles.errorContainer}
      icon="📚"
    />
  );

  const renderLoading = () => (
    <LoadingState 
      message="Loading personalized books..." 
      style={styles.loadingContainer}
    />
  );

  const renderEmpty = () => (
    <ErrorState
      title="No books found"
      message="No books available at the moment. Please try again later."
      onRetry={handleRetry}
      retryText="Try Again"
      style={styles.emptyContainer}
      icon="📚"
    />
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      {/* Show offline indicator if offline */}
      {!isOnline && (
        <OfflineState
          message="You're offline. Showing cached book recommendations."
          onRetry={handleRetry}
          style={styles.offlineIndicator}
        />
      )}

      {loading ? (
        renderLoading()
      ) : error && books.length === 0 ? (
        renderError()
      ) : books.length === 0 ? (
        renderEmpty()
      ) : (
        <>
          {error && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>⚠️ {error}</Text>
            </View>
          )}
          <FlatList
            data={books}
            renderItem={renderBook}
            keyExtractor={(item) => item.key}
            horizontal={horizontal}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={horizontal ? styles.horizontalList : styles.verticalList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            numColumns={horizontal ? 1 : 2}
            key={horizontal ? 'horizontal' : 'vertical'}
          />
        </>
      )}

      <BookReader
        visible={readerVisible}
        book={selectedBook}
        onClose={() => {
          setReaderVisible(false);
          setSelectedBook(null);
        }}
      />

      <AlertComponent />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  cacheIndicator: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  cacheText: {
    fontSize: 12,
    color: Colors.warning,
    fontWeight: '500',
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  offlineIndicator: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
  },
  warningBanner: {
    backgroundColor: Colors.warning + '15',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  warningText: {
    fontSize: 14,
    color: Colors.warning,
    fontWeight: '500',
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  verticalList: {
    paddingHorizontal: 16,
  },
  horizontalBookContainer: {
    width: 180,
    height: 240,
  },
  verticalBookContainer: {
    flex: 1,
    margin: 4,
    height: 240,
  },
  separator: {
    width: 12,
    height: 8,
  },
  loadingContainer: {
    paddingVertical: 40,
  },
  errorContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    paddingVertical: 40,
  },
});