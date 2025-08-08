import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { MainTabParamList } from '../../types/navigation';
import { CustomTabHeader } from '../common';
import HomeStack from './HomeStack';
import ResourcesStack from './ResourcesStack';
import StudyGroupsStack from './StudyGroupsStack';
import ProfileStack from './ProfileStack';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Resources') {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === 'StudyGroups') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primaryLight, // green for active tab
        tabBarInactiveTintColor: Colors.disabled, // gray for inactive tab
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
        },
        headerStyle: {
          backgroundColor: Colors.surface,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          header: () => (
            <CustomTabHeader
              title="Home"
              showUserGreeting={true}
              subtitle='Welcome back to your learning space. . .'
            />
          )
        }}
      />
      <Tab.Screen
        name="Resources"
        component={ResourcesStack}
        options={{
          headerShown: false
        }}
      />
      <Tab.Screen
        name="StudyGroups"
        component={StudyGroupsStack}
        options={{
          headerShown: false
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          header: () => (
            <CustomTabHeader
              title="Profile"
              subtitle="Manage your account and settings"
            />
          )
        }}
      />
    </Tab.Navigator>
  );
}