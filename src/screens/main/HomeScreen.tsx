import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Colors } from '../../constants/colors';
import { GuardianService } from '../../services/guardian/guardianService';
import { GuardianArticle } from '../../types/api';
import {
  DashboardCard,
  NewsCard,
  FeaturedBooksCard,
  useCustomAlert,
  LoadingPlaceholder
} from '../../components/common';
import { ErrorState } from '../../components/common/ErrorState';
import { OfflineState } from '../../components/common/OfflineState';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import { PersonalizationService, ContentRecommendation } from '../../services/personalization';
import { userToUserProfile } from '../../utils/userUtils';
import { ApiErrorHandler } from '../../utils/apiErrorHandler';

// Enhanced article type with personalization data
interface PersonalizedArticle extends GuardianArticle {
  personalization?: ContentRecommendation;
}

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [listData, setListData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personalizedContent, setPersonalizedContent] = useState<any>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [resourceCount, setResourceCount] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { user } = useAuth();
  const { isOnline } = useNetwork();
  const { showAlert, AlertComponent } = useCustomAlert();

  const fetchNews = async (useCache: boolean = true) => {
    if (!user) {
      setError('Please log in to see personalized content.');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setIsFromCache(false);
      
      if (!useCache) {
        setLoading(true);
        const placeholderSections = [
          { type: 'dashboard' },
          { type: 'sectionHeader', title: '📰 Latest Educational News' },
          ...Array(5).fill(0).map((_, i) => ({ type: 'newsPlaceholder', id: `placeholder-${i}` })),
          { type: 'books' }
        ];
        setListData(placeholderSections);
      }

      // Check if we're offline and should use cached content
      if (!isOnline && useCache) {
        console.log('HomeScreen: Offline mode, attempting to load cached content');
      }

      // Fetch news with enhanced error handling
      const fetchEducationNews = async () => {
        const result = await ApiErrorHandler.handleApiCall(
          () => GuardianService.getEducationalNews({ 'page-size': 6 }, useCache),
          'guardian_education-tech-news_page-size:6',
          2,
          1000
        );
        return result;
      };

      const fetchTechNews = async () => {
        const result = await ApiErrorHandler.handleApiCall(
          () => GuardianService.getTechAndAINews(4, useCache),
          'guardian_tech-ai-news_page-size:4',
          2,
          1000
        );
        return result;
      };

      const [educationResult, techResult] = await Promise.all([
        fetchEducationNews(),
        fetchTechNews()
      ]);

      // Check if we got any data
      const educationNews = educationResult.data || [];
      const techNews = techResult.data || [];
      const hasErrors = educationResult.error || techResult.error;
      const fromCache = educationResult.isFromCache || techResult.isFromCache;

      // Combine articles and remove duplicates
      const combinedArticles = [...educationNews, ...techNews];
      const uniqueArticles = combinedArticles
        .filter((article, index, self) =>
          index === self.findIndex(a => a.id === article.id)
        )
        .slice(0, 8);

      // Generate dashboard content first
      const dashboardContent = PersonalizationService.getPersonalizedDashboard(user);
      setPersonalizedContent(dashboardContent);

      const sections: any[] = [{ type: 'dashboard' }];

      if (uniqueArticles.length > 0) {
        const scoredArticles: PersonalizedArticle[] = uniqueArticles.map(article => ({
          ...article,
          personalization: PersonalizationService.scoreNewsArticle(article, user)
        })).sort((a, b) => (b.personalization?.score || 0) - (a.personalization?.score || 0));

        sections.push({ type: 'sectionHeader', title: '📰 Latest Educational News' });
        scoredArticles.forEach(article => sections.push({ type: 'news', article }));

        setIsFromCache(fromCache);
        setLastUpdated(new Date());

        if (fromCache && hasErrors) {
          const errorMessage = educationResult.error || techResult.error;
          if (errorMessage) {
            setError(`${ApiErrorHandler.getUserFriendlyMessage(errorMessage)} Showing cached content.`);
          }
        }
      } else {
        const primaryError = educationResult.error || techResult.error;
        if (primaryError) {
          setError(ApiErrorHandler.getUserFriendlyMessage(primaryError));
        } else {
          setError('No news articles available at the moment.');
        }
      }

      sections.push({ type: 'books' });
      setListData(sections);

    } catch (err) {
      console.error('HomeScreen: Unexpected error fetching personalized news:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNews();
      // Fetch resources count
      import('../../services/resources/resourceService').then(({ ResourceService }) => {
        ResourceService.fetchResources()
          .then(resources => setResourceCount(resources.length))
          .catch(() => setResourceCount(0));
      });
    }
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNews(false); // Force fresh data
    setRefreshing(false);
  };

  const handleArticlePress = (article: PersonalizedArticle) => {
    // Handle article press - could add analytics or other logic here
    console.log('Article pressed:', article.webTitle);
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    if (!user) return null;

    switch (item.type) {
      case 'dashboard':
        return (
          <View style={styles.section}>
            <DashboardCard
              user={userToUserProfile(user)}
              personalizedContent={personalizedContent}
              resourceCount={resourceCount}
            />
          </View>
        );
      case 'sectionHeader':
        return (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{item.title}</Text>
          </View>
        );
      case 'news':
        return <NewsCard article={item.article} onPress={handleArticlePress} />;
      case 'newsPlaceholder':
        return <LoadingPlaceholder type="news" style={{ marginBottom: 16 }} />;
      case 'books':
        return (
          <View style={styles.section}>
            <FeaturedBooksCard
              user={userToUserProfile(user)}
              limit={6}
              horizontal={false}
            />
          </View>
        );
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.centeredMessage}>
          <Text style={styles.centeredMessageText}>Please log in to view your dashboard.</Text>
        </View>
        <AlertComponent />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.type}-${item.article?.id || index}`}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
      <AlertComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface, // Container theme for dashboard section
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primaryText,
    marginLeft: 4,
  },
  cacheIndicator: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cacheText: {
    fontSize: 12,
    color: Colors.warning,
    fontWeight: '500',
  },
  offlineIndicator: {
    marginBottom: 16,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
  },
  loadingContainer: {
    paddingVertical: 40,
  },
  errorContainer: {
    paddingVertical: 20,
  },
  warningBanner: {
    backgroundColor: Colors.warning + '15',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  warningText: {
    fontSize: 14,
    color: Colors.warning,
    fontWeight: '500',
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredMessageText: {
    color: Colors.textSecondary,
    fontSize: 18,
    textAlign: 'center',
  },
});