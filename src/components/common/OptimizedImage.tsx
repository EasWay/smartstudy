import React, { useState, useCallback } from 'react';
import { View, Image, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { colors } from '../../constants/colors';
import LoadingPlaceholder from './LoadingPlaceholder';

interface OptimizedImageProps {
  source: { uri: string } | number;
  style?: any;
  placeholder?: boolean;
  fallbackSource?: { uri: string } | number;
  onLoad?: () => void;
  onError?: () => void;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  placeholder = true,
  fallbackSource,
  onLoad,
  onError,
  resizeMode = 'cover',
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSource, setImageSource] = useState(source);

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
    
    if (fallbackSource && imageSource !== fallbackSource) {
      setImageSource(fallbackSource);
      setLoading(true);
      setError(false);
    } else {
      onError?.();
    }
  }, [fallbackSource, imageSource, onError]);

  const handleLoadStart = useCallback(() => {
    setLoading(true);
  }, []);

  const webImageProps = Platform.OS === 'web' ? {
    loading: 'lazy' as any,
    decoding: 'async' as any,
  } : {};

  return (
    <View style={[styles.container, style]}>
      <Image
        source={imageSource}
        style={[styles.image, style]}
        onLoad={handleLoad}
        onError={handleError}
        onLoadStart={handleLoadStart}
        resizeMode={resizeMode}
        fadeDuration={Platform.OS === 'web' ? 0 : 300}
        {...webImageProps}
      />
      
      {loading && placeholder && (
        <View style={[styles.placeholder, style]}>
          <LoadingPlaceholder type="image" height={style?.height || 200} />
        </View>
      )}
      
      {error && !loading && (
        <View style={[styles.errorContainer, style]}>
          <View style={styles.errorPlaceholder} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  errorPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.border,
    borderRadius: 8,
  },
});

export default OptimizedImage;