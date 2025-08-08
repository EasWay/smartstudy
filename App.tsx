import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { AppNavigator } from './src/components/navigation';
import { AuthProvider, ToastProvider } from './src/context';
import { NetworkProvider } from './src/context/NetworkContext';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { OfflineIndicator } from './src/components/common/OfflineIndicator';
import { NetworkManager } from './src/utils/networkUtils';
import { OfflineManager } from './src/utils/offlineManager';
import { useWebOptimizations } from './src/hooks/useWebOptimizations';
// import { initializeColorSystem, getEmergencyColor } from './src/utils/colorInitializer'; // Not needed for basic functionality

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const { isWebOptimized } = useWebOptimizations();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Starting app initialization...');
        
        // Initialize network and offline managers
        await NetworkManager.initialize();
        await OfflineManager.initialize();

        // Wait for web optimizations if on web
        if (Platform.OS === 'web' && !isWebOptimized) {
          console.log('⏳ Waiting for web optimizations...');
          return;
        }

        setAppReady(true);
        console.log('✅ App initialization complete');
        
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        // Continue anyway - the app can still function
        setAppReady(true);
      }
    };

    initializeApp();
  }, [isWebOptimized]);

  // Show loading screen while initializing
  if (!appReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Initializing...
        </Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <NetworkProvider>
        <AuthProvider>
          <ToastProvider>
            <OfflineIndicator />
            <AppNavigator />
            <StatusBar style="auto" />
          </ToastProvider>
        </AuthProvider>
      </NetworkProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1C1221',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#FFFFFF',
  },
});