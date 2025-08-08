import React from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

interface LoadingPlaceholderProps {
  type?: 'card' | 'list' | 'text' | 'image' | 'profile';
  count?: number;
  height?: number;
}

const LoadingPlaceholder: React.FC<LoadingPlaceholderProps> = ({ 
  type = 'card', 
  count = 1,
  height = 100 
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const renderPlaceholder = () => {
    switch (type) {
      case 'card':
        return (
          <Animated.View style={[styles.card, { opacity }]}>
            <View style={styles.cardImage} />
            <View style={styles.cardContent}>
              <View style={styles.titleLine} />
              <View style={styles.subtitleLine} />
              <View style={styles.shortLine} />
            </View>
          </Animated.View>
        );
      
      case 'list':
        return (
          <Animated.View style={[styles.listItem, { opacity }]}>
            <View style={styles.avatar} />
            <View style={styles.listContent}>
              <View style={styles.titleLine} />
              <View style={styles.subtitleLine} />
            </View>
          </Animated.View>
        );
      
      case 'text':
        return (
          <Animated.View style={[styles.textContainer, { opacity }]}>
            <View style={styles.titleLine} />
            <View style={styles.subtitleLine} />
            <View style={styles.shortLine} />
          </Animated.View>
        );
      
      case 'image':
        return (
          <Animated.View style={[styles.imagePlaceholder, { height, opacity }]} />
        );
      
      case 'profile':
        return (
          <Animated.View style={[styles.profileContainer, { opacity }]}>
            <View style={styles.profileAvatar} />
            <View style={styles.profileInfo}>
              <View style={styles.titleLine} />
              <View style={styles.shortLine} />
            </View>
          </Animated.View>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.item}>
          {renderPlaceholder()}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
  },
  cardImage: {
    width: '100%',
    height: 120,
    backgroundColor: colors.border,
    borderRadius: 8,
    marginBottom: 12,
  },
  cardContent: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
    marginRight: 12,
  },
  listContent: {
    flex: 1,
    gap: 6,
  },
  textContainer: {
    padding: 16,
    gap: 8,
  },
  imagePlaceholder: {
    width: '100%',
    backgroundColor: colors.border,
    borderRadius: 8,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.border,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
    gap: 8,
  },
  titleLine: {
    height: 16,
    backgroundColor: colors.border,
    borderRadius: 4,
    width: '80%',
  },
  subtitleLine: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 4,
    width: '60%',
  },
  shortLine: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 4,
    width: '40%',
  },
});

export default LoadingPlaceholder;