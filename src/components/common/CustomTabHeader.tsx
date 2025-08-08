import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context';
import { getUserDisplayName, getUserInitials } from '../../utils';
import { OfflineIndicator } from './OfflineIndicator';

interface CustomTabHeaderProps {
  title: string;
  showUserGreeting?: boolean;
  subtitle?: string;
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 17) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

export default function CustomTabHeader({
  title,
  showUserGreeting = false,
  subtitle
}: CustomTabHeaderProps) {
  const { user } = useAuth();
  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);

  if (showUserGreeting) {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.greetingSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.greeting}>
              {getTimeBasedGreeting()}, {displayName}!
            </Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>
        <OfflineIndicator size={10} style={styles.offlineIndicator} />
      </View>
    );
  }

  return (
    <View style={styles.headerContainer}>
      <View style={styles.titleSection}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <OfflineIndicator size={10} style={styles.offlineIndicator} />
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 80, // Consistent height across all headers
    borderBottomWidth: 0, // Remove the white line
    justifyContent: 'center',
    position: 'relative',
  },
  greetingSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primaryText,
  },
  textContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primaryText,
    marginBottom: 2,
  },
  titleSection: {
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primaryText,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  offlineIndicator: {
    position: 'absolute',
    top: 20,
    right: 16,
  },
});