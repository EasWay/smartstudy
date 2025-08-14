import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { GuardianArticle } from '../../types/api';
import {
  DashboardCard,
  NewsCard,
  FeaturedBooksCard,
  useCustomAlert,
  LoadingPlaceholder
} from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { userToUserProfile } from '../../utils/userUtils';

// Enhanced article type with personalization data
interface PersonalizedArticle extends GuardianArticle {
  personalization?: ContentRecommendation;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { news, resources, studyGroups, loadAllData } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const { showAlert, AlertComponent } = useCustomAlert();

  // TODO: The personalization and other logic should be re-integrated
  // For now, we will just display the raw news from the context.
  const listData = [
    { type: 'dashboard' },
    { type: 'sectionHeader', title: '📰 Latest Educational News' },
    ...news.map(article => ({ type: 'news', article })),
    { type: 'books' }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
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
              personalizedContent={null} // TODO: Re-add personalization
              resourceCount={resources.length}
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