import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { useNetwork } from '../../context/NetworkContext';

interface OfflineStateProps {
  message?: string;
  onRetry?: () => void;
  style?: ViewStyle;
  showCachedContent?: boolean;
  cachedContentMessage?: string;
}

export const OfflineState: React.FC<OfflineStateProps> = ({
  message = 'You are currently offline. Some content may not be up to date.',
  onRetry,
  style,
  showCachedContent = true,
  cachedContentMessage = 'Showing cached content',
}) => {
  const { isOnline, checkConnectivity } = useNetwork();

  const handleRetry = async () => {
    const isConnected = await checkConnectivity();
    if (isConnected && onRetry) {
      onRetry();
    }
  };

  if (isOnline) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>📡</Text>
      <Text style={styles.title}>Offline Mode</Text>
      <Text style={styles.message}>{message}</Text>
      
      {showCachedContent && (
        <View style={styles.cachedBanner}>
          <Text style={styles.cachedText}>{cachedContentMessage}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
        <Text style={styles.retryText}>Check Connection</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
  },
  icon: {
    fontSize: 32,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  cachedBanner: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  cachedText: {
    fontSize: 12,
    color: Colors.warning,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '500',
  },
});