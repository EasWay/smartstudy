import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context';
import { getUserDisplayName, getUserInitials } from '../../utils';

interface UserGreetingProps {
  showAvatar?: boolean;
  greeting?: string;
  subtitle?: string;
  useTimeBasedGreeting?: boolean;
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

export default function UserGreeting({ 
  showAvatar = false, 
  greeting,
  subtitle,
  useTimeBasedGreeting = false
}: UserGreetingProps) {
  const { user } = useAuth();
  const displayName = getUserDisplayName(user);
  
  let defaultGreeting = greeting;
  if (!defaultGreeting) {
    if (useTimeBasedGreeting) {
      defaultGreeting = `${getTimeBasedGreeting()}, ${displayName}!`;
    } else {
      defaultGreeting = `Hello, ${displayName}!`;
    }
  }
  
  const initials = getUserInitials(user);

  return (
    <View style={styles.container}>
      {showAvatar ? (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      ) : null}
      <View style={styles.textContainer}>
        <Text style={styles.greeting}>{defaultGreeting}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primaryText,
  },
  textContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primaryText,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});