import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../types/navigation';
import { ProfileScreen } from '../../screens/main';
import EditProfileScreen from '../../screens/main/EditProfileScreen';
import { Colors } from '../../constants/colors';
import { CustomTabHeader } from '../common';

const Stack = createStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="ProfileScreen" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ 
          title: 'Edit Profile',
          headerShown: true,
          gestureEnabled: false,
          header: () => (
            <CustomTabHeader
              title="Edit Profile"
              subtitle="Update your profile information"
            />
          ),
        }}
      />
    </Stack.Navigator>
  );
}