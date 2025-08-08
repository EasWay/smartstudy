import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { GuardianArticle } from '../../types/api';
import { Colors } from '../../constants/colors';

interface NewsPostProps {
  article: GuardianArticle;
  onPress?: () => void;
}

export const NewsPost: React.FC<NewsPostProps> = ({ article, onPress }) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      Linking.openURL(article.webUrl);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    }
  };

  const getAuthor = () => {
    if (article.fields?.byline) {
      return article.fields.byline;
    }
    return 'The Guardian';
  };

  const getThumbnail = () => {
    if (article.fields?.thumbnail) {
      return article.fields.thumbnail;
    }
    // Default Guardian logo or placeholder
    return 'https://assets.guim.co.uk/images/guardian-logo-160x60.png';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          <Image
            source={{ uri: 'https://assets.guim.co.uk/images/guardian-logo-160x60.png' }}
            style={styles.authorAvatar}
            resizeMode="contain"
          />
          <View style={styles.authorDetails}>
            <Text style={styles.authorName}>{getAuthor()}</Text>
            <Text style={styles.timestamp}>
              {formatDate(article.webPublicationDate)} • The Guardian
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title} numberOfLines={3}>
            {article.fields?.headline || article.webTitle}
          </Text>

          {/* Trail text */}
          {article.fields?.trailText && (
            <Text style={styles.trailText} numberOfLines={3}>
              {article.fields.trailText.replace(/<[^>]*>/g, '')} {/* Remove HTML tags */}
            </Text>
          )}

          {/* Image */}
          {article.fields?.thumbnail && (
            <Image
              source={{ uri: getThumbnail() }}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          {/* Link preview */}
          <View style={styles.linkPreview}>
            <Text style={styles.linkDomain}>theguardian.com</Text>
            <Text style={styles.linkTitle} numberOfLines={2}>
              {article.webTitle}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handlePress}>
          <Text style={styles.actionText}>📖 Read More</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            // Could implement sharing functionality here
            console.log('Share article:', article.webTitle);
          }}
        >
          <Text style={styles.actionText}>📤 Share</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            // Could implement bookmarking functionality here
            console.log('Bookmark article:', article.webTitle);
          }}
        >
          <Text style={styles.actionText}>🔖 Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  authorDetails: {
    marginLeft: 12,
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  timestamp: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 24,
    marginBottom: 8,
  },
  trailText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
  },
  linkPreview: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  linkDomain: {
    fontSize: 12,
    color: '#666666',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  linkTitle: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
});