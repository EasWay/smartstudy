import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { FeaturedBooks } from './FeaturedBooks';
import { UserProfile } from '../../types/profile';

interface FeaturedBooksCardProps {
  user?: UserProfile;
  limit?: number;
  horizontal?: boolean;
}

export const FeaturedBooksCard: React.FC<FeaturedBooksCardProps> = ({ 
  user, 
  limit = 6, 
  horizontal = false 
}) => {
  const getPersonalizedTitle = () => {
    if (user?.subjects_of_interest && user.subjects_of_interest.length > 0) {
      const primarySubject = user.subjects_of_interest[0];
      return `📚 ${primarySubject} Books for You`;
    }
    if (user?.grade_level) {
      return `📚 Books for ${user.grade_level} Students`;
    }
    return '📚 Featured Educational Books';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{getPersonalizedTitle()}</Text>
      <FeaturedBooks
        title=""
        limit={limit}
        horizontal={horizontal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primaryText,
    marginBottom: 12,
    marginLeft: 4,
  },
});