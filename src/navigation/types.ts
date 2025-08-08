import { Resource } from '../types/resources';

export type RootStackParamList = {
  ResourcePreview: { resource: Resource };
  Downloads: undefined;
  ResourceManagement: undefined;
  // Add other routes as needed
};

// Extend this type as you add more screens
export default RootStackParamList;