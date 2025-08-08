import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { GuardianService } from '../../services/guardian/guardianService';
import { GuardianArticle } from '../../types/api';
import { NewsPost } from './NewsPost';
import { Colors } from '../../constants/colors';

interface NewsFeedProps {
  refreshing?: boolean;
  onRefresh?: () => void;
  showHeader?: boolean;
  maxItems?: number;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({
  refreshing = false,
  onRefresh,
  showHeader = true,
  maxItems = 10,
}) => {
  const [articles, setArticles] = useState<GuardianArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async (useCache: boolean = true) => {
    try {
      setError(null);
      if (!useCache) {
        setLoading(true);
      }

      // Fetch both educational and tech news
      const [educationNews, techNews] = await Promise.all([
        GuardianService.getEducationalNews({ 'page-size': Math.ceil(maxItems / 2) }, useCache),
        GuardianService.getTechAndAINews(Math.ceil(maxItems / 2), useCache),
      ]);

      // Combine articles and remove duplicates based on article ID
      const combinedArticles = [...educationNews, ...techNews];
      const uniqueArticles = combinedArticles.filter((article, index, self) => 
        index === self.findIndex(a => a.id === article.id)
      );
      
      console.log(`NewsFeed: Combined ${combinedArticles.length} articles, ${uniqueArticles.length} unique`);
      
      // Shuffle for variety and limit to maxItems
      const shuffledArticles = uniqueArticles
        .sort(() => Math.random() - 0.5)
        .slice(0, maxItems);

      setArticles(shuffledArticles);
    } catch (err) {
      console.error('NewsFeed: Error fetching news:', err);
      setError('Unable to load news. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleRefresh = async () => {
    if (onRefresh) {
      onRefresh();
    }
    await fetchNews(false); // Force fresh data
  };

  const renderNewsPost = ({ item }: { item: GuardianArticle }) => (
    <NewsPost article={item} />
  );

  const renderHeader = () => {
    if (!showHeader) return null;

    return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📰 Latest News</Text>
        <Text style={styles.headerSubtitle}>
          Education, Technology & AI Updates
        </Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>📰</Text>
      <Text style={styles.emptyText}>
        {error || 'No news articles available at the moment'}
      </Text>
      {error && (
        <Text style={styles.retryText} onPress={() => fetchNews(false)}>
          Tap to retry
        </Text>
      )}
    </View>
  );

  const renderFooter = () => {
    if (loading && articles.length > 0) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      );
    }
    return null;
  };

  if (loading && articles.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading latest news...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={articles}
        renderItem={renderNewsPost}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={10}
        initialNumToRender={3}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  retryText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});