import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking
} from 'react-native';
import { Colors } from '../../constants/colors';
import { GuardianArticle } from '../../types/api';
import { ContentRecommendation } from '../../services/personalization';

interface PersonalizedArticle extends GuardianArticle {
  personalization?: ContentRecommendation;
}

interface NewsCardProps {
  article: PersonalizedArticle;
  onPress?: (article: PersonalizedArticle) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  article,
  onPress
}) => {
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

  const handlePress = () => {
    if (onPress) {
      onPress(article);
    } else {
      Linking.openURL(article.webUrl);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.newsCard,
        article.personalization?.priority === 'high' && styles.highPriorityCard
      ]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.newsHeader}>
        <Image
          source={{ uri: 'https://assets.guim.co.uk/images/guardian-logo-160x60.png' }}
          style={styles.sourceIcon}
          resizeMode="contain"
        />
        <View style={styles.newsMetadata}>
          <Text style={styles.sourceName}>The Guardian</Text>
          <Text style={styles.newsTimestamp}>{formatDate(article.webPublicationDate)}</Text>
        </View>

        {/* Personalization Badge */}
        {article.personalization && article.personalization.score > 20 && (
          <View style={[
            styles.priorityBadge,
            article.personalization.priority === 'high' && styles.highPriorityBadge,
            article.personalization.priority === 'medium' && styles.mediumPriorityBadge
          ]}>
            <Text style={styles.priorityText}>
              {article.personalization.priority === 'high' ? '⭐' :
                article.personalization.priority === 'medium' ? '📌' : '📰'}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.newsTitle} numberOfLines={3}>
        {article.fields?.headline || article.webTitle}
      </Text>

      {/* Personalization Reason */}
      {article.personalization && article.personalization.score > 15 && (
        <View style={styles.personalizationTag}>
          <Text style={styles.personalizationText}>
            💡 {article.personalization.reason}
          </Text>
        </View>
      )}

      {article.fields?.trailText && (
        <Text style={styles.newsDescription} numberOfLines={2}>
          {article.fields.trailText.replace(/<[^>]*>/g, '')}
        </Text>
      )}

      {article.fields?.thumbnail && (
        <Image
          source={{ uri: article.fields.thumbnail }}
          style={styles.newsImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.newsFooter}>
        <Text style={styles.readMoreText}>
          📖 {article.personalization?.priority === 'high' ? 'Highly recommended for you' : 'Tap to read more'}
        </Text>
        {article.personalization && (
          <Text style={styles.relevanceScore}>
            {Math.round(article.personalization.score)}% match
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  newsCard: {
    backgroundColor: Colors.surface,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sourceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.placeholder,
  },
  newsMetadata: {
    marginLeft: 12,
    flex: 1,
  },
  sourceName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  newsTimestamp: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryText,
    lineHeight: 22,
    marginHorizontal: 12,
    marginTop: 8,
  },
  newsDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginHorizontal: 12,
    marginTop: 6,
  },
  newsImage: {
    width: '100%',
    height: 180,
    marginTop: 8,
    backgroundColor: Colors.placeholder,
  },
  newsFooter: {
    padding: 12,
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  highPriorityCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  priorityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  highPriorityBadge: {
    backgroundColor: Colors.primary,
  },
  mediumPriorityBadge: {
    backgroundColor: Colors.secondary,
  },
  priorityText: {
    fontSize: 12,
  },
  personalizationTag: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  personalizationText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },
  relevanceScore: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
});