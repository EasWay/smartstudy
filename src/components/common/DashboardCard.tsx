import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { UserProfile } from '../../types/profile';

interface DashboardCardProps {
  user: UserProfile;
  personalizedContent?: any;
  resourceCount?: number;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ 
  user, 
  personalizedContent,
  resourceCount = 0
}) => {
  return (
    <View style={styles.container}>
      {/* Personalized Welcome */}
      <View style={styles.card}>
        {personalizedContent?.motivationalQuote && (
          <View style={styles.quoteContainer}>
            <Text style={styles.quote}>"{personalizedContent.motivationalQuote}"</Text>
          </View>
        )}
      </View>

      {/* Progress Stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Your Learning Journey</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.subjects_of_interest?.length || 0}</Text>
            <Text style={styles.statLabel}>Subjects</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{resourceCount}</Text>
            <Text style={styles.statLabel}>Resources</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.grade_level?.includes('University') ? 'Advanced' : 'Growing'}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>🔥</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    padding: 18,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primaryText,
    marginBottom: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  welcomeCard: {
    backgroundColor: Colors.primary,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  quoteContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  quote: {
    fontSize: 13,
    color: Colors.white,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
});