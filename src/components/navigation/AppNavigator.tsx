import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../context';
import { Colors } from '../../constants/colors';
import { DatabaseService } from '../../services/supabase/database';
import TabNavigator from './TabNavigator';
import AuthNavigator from './AuthNavigator';
import { ProfileSetupScreen } from '../../screens/auth';

const Stack = createStackNavigator<RootStackParamList>();

// Loading component to avoid inline function performance issues
const LoadingScreen = () => (
  <View style={{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background
  }}>
    <ActivityIndicator size="large" color={Colors.primary} />
  </View>
);

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(false);

  const isAuthenticated = !!user;

  console.log('AppNavigator - User:', user?.username || user?.fullName || 'Anonymous', 'Loading:', loading, 'Authenticated:', isAuthenticated);
  console.log('AppNavigator - Profile completed:', profileCompleted, 'Checking profile:', checkingProfile);

  // Check if user has completed profile setup
  useEffect(() => {
    async function checkProfileCompletion() {
      if (user && !loading) {
        console.log('Checking profile completion for user:', user.id);
        setCheckingProfile(true);
        try {
          const completed = await DatabaseService.hasCompletedProfile(user.id);
          console.log('Profile completion check result:', completed);
          setProfileCompleted(completed);
        } catch (error) {
          console.error('Error checking profile completion:', error);
          setProfileCompleted(false);
        } finally {
          setCheckingProfile(false);
        }
      } else {
        setProfileCompleted(null);
      }
    }

    checkProfileCompletion();

    // Set up an interval to periodically check profile completion
    const interval = setInterval(() => {
      if (user && !loading && profileCompleted === false) {
        console.log('Rechecking profile completion...');
        checkProfileCompletion();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [user, loading, profileCompleted]);

  // Show loading screen while checking auth state or profile completion
  if (loading || (isAuthenticated && checkingProfile && profileCompleted === null)) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background
      }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              gestureEnabled: true,
              cardStyleInterpolator: ({ current, layouts }) => {
                return {
                  cardStyle: {
                    transform: [
                      {
                        translateX: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [layouts.screen.width, 0],
                        }),
                      },
                    ],
                  },
                };
              },
            }}
          >
            {!isAuthenticated ? (
              // Not authenticated: Show Auth flow (Login/Register)
              <Stack.Screen
                name="Auth"
                component={AuthNavigator}
                options={{ title: 'Authentication' }}
              />
            ) : profileCompleted === false ? (
              // Authenticated but no profile: Show ProfileSetup
              <Stack.Screen
                name="ProfileSetup"
                component={ProfileSetupScreen}
                options={{ title: 'Complete Profile' }}
              />
            ) : profileCompleted === true ? (
              // Authenticated with profile: Show Main App
              <Stack.Screen
                name="Main"
                component={TabNavigator}
                options={{ title: 'Stem Education App' }}
              />
            ) : (
              // Loading state
              <Stack.Screen
                name="Loading"
                component={LoadingScreen}
                options={{ title: 'Loading' }}
              />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}