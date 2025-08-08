// App configuration constants
export const APP_CONFIG = {
  NAME: 'Stem',
  VERSION: '1.0.0',
  DESCRIPTION: 'Ghana Education App',
} as const;

// Tab navigation configuration
export const TAB_CONFIG = {
  HOME: {
    name: 'Home',
    icon: 'home',
  },
  RESOURCES: {
    name: 'Resources',
    icon: 'book',
  },
  STUDY_GROUPS: {
    name: 'Study Groups',
    icon: 'people',
  },
  PROFILE: {
    name: 'Profile',
    icon: 'person',
  },
} as const;