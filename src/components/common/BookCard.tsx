import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { EnhancedOpenLibraryBook } from '../../services/openlibrary';
import { Colors } from '../../constants/colors';

interface BookCardProps {
  book: EnhancedOpenLibraryBook & { personalization?: any };
  onPress?: (book: EnhancedOpenLibraryBook) => void;
  showSubjects?: boolean;
  compact?: boolean;
  fixedSize?: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({ 
  book, 
  onPress, 
  showSubjects = true,
  compact = false,
  fixedSize = false
}) => {
  const handlePress = () => {
    onPress?.(book);
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        compact && styles.compactContainer,
        fixedSize && styles.fixedSizeContainer
      ]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.coverContainer}>
        {book.coverUrl ? (
          <Image 
            source={{ uri: book.coverUrl }} 
            style={[
              styles.cover, 
              compact && styles.compactCover,
              fixedSize && styles.fixedSizeCover
            ]}
            resizeMode="cover"
          />
        ) : (
          <View style={[
            styles.placeholderCover, 
            compact && styles.compactCover,
            fixedSize && styles.fixedSizeCover
          ]}>
            <Text style={styles.placeholderText}>📚</Text>
          </View>
        )}
        
        {/* Personalization Badge */}
        {book.personalization && book.personalization.score > 20 && (
          <View style={[
            styles.personalizationBadge,
            book.personalization.priority === 'high' && styles.highPriorityBadge
          ]}>
            <Text style={styles.badgeText}>
              {book.personalization.priority === 'high' ? '⭐' : '📌'}
            </Text>
          </View>
        )}
      </View>
      
      <View style={[styles.content, compact && styles.compactContent]}>
        <Text 
          style={[
            styles.title, 
            compact && styles.compactTitle,
            fixedSize && styles.fixedSizeTitle
          ]} 
          numberOfLines={fixedSize ? 2 : (compact ? 2 : 3)}
        >
          {book.title}
        </Text>
        
        <Text 
          style={[styles.author, compact && styles.compactAuthor]} 
          numberOfLines={1}
        >
          {book.authorsString}
        </Text>
        
        {book.first_publish_year && (
          <Text style={[styles.year, compact && styles.compactYear]}>
            {book.first_publish_year}
          </Text>
        )}
        
        {showSubjects && book.subjectsString && !compact && (
          <Text style={styles.subjects} numberOfLines={2}>
            {book.subjectsString}
          </Text>
        )}
        
        {/* Personalization Info */}
        {book.personalization && book.personalization.score > 15 && !compact && (
          <View style={styles.personalizationInfo}>
            <Text style={styles.personalizationText} numberOfLines={1}>
              💡 {book.personalization.reason}
            </Text>
            <Text style={styles.matchScore}>
              {Math.round(book.personalization.score)}% match
            </Text>
          </View>
        )}
        
        {book.edition_count && book.edition_count > 1 && (
          <Text style={[styles.editions, compact && styles.compactEditions]}>
            {book.edition_count} editions
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContainer: {
    padding: 8,
    marginVertical: 4,
  },
  fixedSizeContainer: {
    flexDirection: 'column',
    height: 220,
    width: '100%',
    padding: 12,
  },
  coverContainer: {
    marginRight: 12,
  },
  cover: {
    width: 60,
    height: 80,
    borderRadius: 6,
  },
  compactCover: {
    width: 45,
    height: 60,
  },
  fixedSizeCover: {
    width: '100%',
    height: 120,
    marginBottom: 8,
    alignSelf: 'center',
  },
  placeholderCover: {
    width: 60,
    height: 80,
    borderRadius: 6,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  compactContent: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryText,
    marginBottom: 4,
    lineHeight: 20,
  },
  compactTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  fixedSizeTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  compactAuthor: {
    fontSize: 12,
    marginBottom: 2,
  },
  year: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  compactYear: {
    fontSize: 11,
    marginBottom: 2,
  },
  subjects: {
    fontSize: 12,
    color: Colors.primary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  editions: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  compactEditions: {
    fontSize: 10,
  },
  // Personalization Styles
  personalizationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  highPriorityBadge: {
    backgroundColor: Colors.primary,
  },
  badgeText: {
    fontSize: 10,
  },
  personalizationInfo: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  personalizationText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  matchScore: {
    fontSize: 9,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});