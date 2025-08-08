import { useState, useEffect } from 'react';
import { NetworkManager, NetworkState } from '../utils/networkUtils';

export const useNetworkState = () => {
  const [networkState, setNetworkState] = useState<NetworkState>(
    NetworkManager.getCurrentState()
  );
  const [isOnline, setIsOnline] = useState<boolean>(NetworkManager.isOnline());

  useEffect(() => {
    const unsubscribe = NetworkManager.addListener((state: NetworkState) => {
      setNetworkState(state);
      setIsOnline(NetworkManager.isOnline());
    });

    return unsubscribe;
  }, []);

  return {
    networkState,
    isOnline,
    isOffline: !isOnline,
    connectionType: networkState.type,
    isInternetReachable: networkState.isInternetReachable,
  };
};

export const useOfflineDetection = () => {
  const { isOnline, isOffline } = useNetworkState();
  
  return {
    isOnline,
    isOffline,
  };
};