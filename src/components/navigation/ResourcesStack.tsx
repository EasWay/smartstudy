import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ResourcesStackParamList } from '../../types/navigation';
import { ResourcesScreen } from '../../screens/main';
import ResourceManagementScreen from '../../screens/main/ResourceManagementScreen';
import ResourcePreviewScreen from '../../screens/main/ResourcePreviewScreen';
import DownloadsScreen from '../../screens/main/DownloadsScreen';
import { Colors } from '../../constants/colors';

const Stack = createStackNavigator<ResourcesStackParamList>();

export default function ResourcesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="ResourcesScreen" 
        component={ResourcesScreen}
        options={{ title: 'Resources' }}
      />
      <Stack.Screen 
        name="ResourceManagement" 
        component={ResourceManagementScreen}
        options={{ 
          title: 'Manage Resources',
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors.surface,
          },
          headerTintColor: Colors.primaryText,
          headerTitleStyle: {
            color: Colors.primaryText,
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen 
        name="ResourcePreview" 
        component={ResourcePreviewScreen}
        options={{ 
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="Downloads" 
        component={DownloadsScreen}
        options={{ 
          title: 'Downloads',
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors.surface,
          },
          headerTintColor: Colors.primaryText,
          headerTitleStyle: {
            color: Colors.primaryText,
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
}