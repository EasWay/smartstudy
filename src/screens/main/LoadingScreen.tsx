import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Image, Text } from 'react-native';
import { useData } from '../../context/DataContext';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';

export default function LoadingScreen() {
  const { loadAllData, loading, error } = useData();
  const navigation = useNavigation();

  useEffect(() => {
    const bootstrap = async () => {
      await loadAllData();
      // After loading, navigate to the main app.
      // The navigation logic will be handled in the AppNavigator.
      // This screen just triggers the load.
    };
    bootstrap();
  }, [loadAllData]);

  useEffect(() => {
    if (!loading) {
      // This assumes the AppNavigator will handle the switch
      // based on some state in the Auth or Data context.
      // Let's explicitly navigate for now.
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }], // Assuming 'Main' is the name of your TabNavigator stack
      });
    }
  }, [loading, navigation]);

  return (
    <View style={styles.container}>
      <Image source={require('../../../assets/splash-icon.png')} style={styles.logo} />
      <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 40,
  },
  spinner: {
    transform: [{ scale: 1.5 }],
  },
  errorText: {
    marginTop: 20,
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});
