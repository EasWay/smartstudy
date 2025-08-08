import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export const useWebOptimizations = () => {
  const [isWebOptimized, setIsWebOptimized] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Register service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered:', registration);
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });
      }

      // Enable web app install prompt
      let deferredPrompt: any;
      
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        deferredPrompt = e;
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // Optimize for web performance
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          setIsWebOptimized(true);
        });
      } else {
        setTimeout(() => setIsWebOptimized(true), 100);
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    } else {
      setIsWebOptimized(true);
    }
  }, []);

  const installApp = async () => {
    if (Platform.OS === 'web' && 'deferredPrompt' in window) {
      const deferredPrompt = (window as any).deferredPrompt;
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        (window as any).deferredPrompt = null;
      }
    }
  };

  return {
    isWebOptimized,
    installApp,
    isWeb: Platform.OS === 'web',
  };
};

export const useWebPerformance = () => {
  const [metrics, setMetrics] = useState<any>({});

  useEffect(() => {
    if (Platform.OS === 'web' && 'performance' in window) {
      // Measure performance metrics
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            setMetrics((prev: any) => ({
              ...prev,
              loadTime: entry.loadEventEnd - entry.loadEventStart,
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            }));
          }
        });
      });

      observer.observe({ entryTypes: ['navigation'] });

      return () => observer.disconnect();
    }
  }, []);

  return metrics;
};