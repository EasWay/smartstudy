import { Platform, Dimensions } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isNative = Platform.OS !== 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

export const getScreenDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

export const isTablet = () => {
  const { width, height } = getScreenDimensions();
  const aspectRatio = width / height;
  return Math.min(width, height) >= 768 && (aspectRatio > 1.2 || aspectRatio < 0.9);
};

export const isDesktop = () => {
  if (!isWeb) return false;
  const { width } = getScreenDimensions();
  return width >= 1024;
};

export const isMobile = () => {
  if (isNative) return true;
  const { width } = getScreenDimensions();
  return width < 768;
};

// Web-specific utilities
export const getWebUserAgent = () => {
  if (!isWeb) return '';
  return typeof navigator !== 'undefined' ? navigator.userAgent : '';
};

export const isTouchDevice = () => {
  if (isNative) return true;
  if (!isWeb) return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Platform-specific file handling
export const createWebFile = (blob: Blob, filename: string): File => {
  if (!isWeb) throw new Error('createWebFile only available on web');
  return new File([blob], filename, { type: blob.type });
};

export const getFileFromUri = async (uri: string): Promise<Blob | File> => {
  if (isWeb) {
    const response = await fetch(uri);
    return response.blob();
  } else {
    // For React Native, return the URI as is for now
    // This would need platform-specific handling
    throw new Error('getFileFromUri not implemented for native platforms');
  }
};

// Responsive breakpoints
export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
};

export const getBreakpoint = () => {
  const { width } = getScreenDimensions();
  if (width >= breakpoints.wide) return 'wide';
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'mobile';
};