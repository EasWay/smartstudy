import { useState, useCallback } from 'react';
import { useNetwork } from '../context/NetworkContext';

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isFromCache: boolean;
  lastUpdated: Date | null;
}

export interface ApiStateActions<T> {
  setLoading: (loading: boolean) => void;
  setData: (data: T, isFromCache?: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  retry: () => Promise<void>;
}

export function useApiState<T>(
  apiCall: () => Promise<T>,
  initialData: T | null = null
): [ApiState<T>, ApiStateActions<T>] {
  const { isOnline } = useNetwork();
  
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
    isFromCache: false,
    lastUpdated: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setData = useCallback((data: T, isFromCache: boolean = false) => {
    setState(prev => ({
      ...prev,
      data,
      loading: false,
      error: null,
      isFromCache,
      lastUpdated: new Date(),
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error,
      loading: false,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
      isFromCache: false,
      lastUpdated: null,
    });
  }, [initialData]);

  const retry = useCallback(async () => {
    if (!isOnline) {
      setError('No internet connection. Please check your network and try again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result, false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    }
  }, [apiCall, isOnline, setLoading, setData, setError]);

  return [state, { setLoading, setData, setError, reset, retry }];
}

export default useApiState;