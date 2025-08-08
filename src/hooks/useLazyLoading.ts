import { useState, useEffect, useRef, useCallback } from 'react';
import { Dimensions } from 'react-native';

interface UseLazyLoadingOptions {
  threshold?: number;
  rootMargin?: number;
  enabled?: boolean;
}

interface LazyLoadingResult {
  isVisible: boolean;
  ref: React.RefObject<any>;
  hasBeenVisible: boolean;
}

const { height: screenHeight } = Dimensions.get('window');

export const useLazyLoading = (options: UseLazyLoadingOptions = {}): LazyLoadingResult => {
  const {
    threshold = 0.1,
    rootMargin = screenHeight * 0.5,
    enabled = true
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const ref = useRef<any>(null);
  const observerRef = useRef<any>(null);

  const handleVisibilityChange = useCallback((visible: boolean) => {
    setIsVisible(visible);
    if (visible && !hasBeenVisible) {
      setHasBeenVisible(true);
    }
  }, [hasBeenVisible]);

  useEffect(() => {
    if (!enabled || !ref.current) return;

    // Simple visibility detection for React Native
    const checkVisibility = () => {
      if (ref.current && ref.current.measure) {
        ref.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
          const isInViewport = pageY < screenHeight + rootMargin && pageY + height > -rootMargin;
          handleVisibilityChange(isInViewport);
        });
      }
    };

    // Initial check
    checkVisibility();

    // Set up periodic checking (could be optimized with scroll listeners)
    const interval = setInterval(checkVisibility, 500);

    return () => {
      clearInterval(interval);
    };
  }, [enabled, rootMargin, handleVisibilityChange]);

  return {
    isVisible,
    ref,
    hasBeenVisible
  };
};

export default useLazyLoading;