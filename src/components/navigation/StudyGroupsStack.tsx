import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { StudyGroupsStackParamList } from '../../types/navigation';
import { StudyGroupsScreen, GroupChatScreen } from '../../screens/main';

const Stack = createStackNavigator<StudyGroupsStackParamList>();

export default function StudyGroupsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="StudyGroupsScreen"
        component={StudyGroupsScreen}
        options={{ title: 'Study Groups' }}
      />
      <Stack.Screen
        name="GroupChat"
        component={GroupChatScreen}
        options={{ title: 'Group Chat' }}
      />
    </Stack.Navigator>
  );
}
