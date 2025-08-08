import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../../constants/colors';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type: ToastType;
  duration?: number;
  onHide: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type,
  duration = 3000,
  onHide,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current; // Start from right

  useEffect(() => {
    if (visible) {
      // Slide in from right and fade in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0.85, // More transparent
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 300, // Slide out to right
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: `${colors.success}40`, // 25% opacity - much more faded
          borderColor: `${colors.success}60`, // 37% opacity border
          borderWidth: 0.5,
        };
      case 'error':
        return {
          backgroundColor: `${colors.error}40`, // 25% opacity - much more faded
          borderColor: `${colors.error}60`, // 37% opacity border
          borderWidth: 0.5,
        };
      case 'warning':
        return {
          backgroundColor: `${colors.warning}40`, // 25% opacity - much more faded
          borderColor: `${colors.warning}60`, // 37% opacity border
          borderWidth: 0.5,
        };
      case 'info':
      default:
        return {
          backgroundColor: `${colors.primary}40`, // 25% opacity - much more faded
          borderColor: `${colors.primary}60`, // 37% opacity border
          borderWidth: 0.5,
        };
    }
  };

  const getIcon = () => {
    // Since messages now include emojis, we can use simpler icons or none
    switch (type) {
      case 'success':
        return '🎉';
      case 'error':
        return '😅';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return '💡';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.toast, getToastStyle()]}
        onPress={hideToast}
        activeOpacity={0.8}
      >
        <Text style={styles.icon}>{getIcon()}</Text>
        <Text style={styles.message} numberOfLines={1}>
          {message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100, // Above tab bar
    right: 16, // Position from right
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20, // Rounded edges
    maxWidth: width * 0.75, // 75% of screen width
    minWidth: 160,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    fontSize: 14,
    color: colors.white,
    marginRight: 6,
    fontWeight: '600',
  },
  message: {
    flex: 1,
    fontSize: 12,
    color: colors.white,
    fontWeight: '500',
    lineHeight: 16,
  },
});