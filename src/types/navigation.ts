// Navigation related types
import { Resource } from './resources';
export type RootStackParamList = {
  Auth: undefined;
  ProfileSetup: undefined;
  Main: undefined;
  Loading: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Resources: undefined;
  StudyGroups: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
};

export type ResourcesStackParamList = {
  ResourcesScreen: undefined;
  ResourceManagement: undefined;
  ResourceDetail: { resourceId: string };
  ResourcePreview: { resource: Resource };
  Downloads: undefined;
};

export type StudyGroupsStackParamList = {
  StudyGroupsScreen: undefined;
  MyGroupsScreen: undefined;
  GroupDetail: { groupId: string };
  GroupChat: { groupId: string };
};

export type StudyGroupsTabParamList = {
  AllGroups: undefined;
  MyGroups: undefined;
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  EditProfile: undefined;
  Settings: undefined;
};