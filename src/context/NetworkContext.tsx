import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { NetworkManager, NetworkState } from '../utils/networkUtils';

interface NetworkContextType {
  networkState: NetworkState;
  isOnline: boolean;
  isOffline: boolean;
  connectionType: string | null;
  checkConnectivity: () => Promise<boolean>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [networkState, setNetworkState] = useState<NetworkState>(
    NetworkManager.getCurrentState()
  );
  const [isOnline, setIsOnline] = useState<boolean>(NetworkManager.isOnline());

  useEffect(() => {
    // Initialize NetworkManager
    NetworkManager.initialize();

    // Subscribe to network changes
    const unsubscribe = NetworkManager.addListener((state: NetworkState) => {
      setNetworkState(state);
      setIsOnline(NetworkManager.isOnline());
    });

    return unsubscribe;
  }, []);

  const checkConnectivity = async (): Promise<boolean> => {
    return await NetworkManager.checkConnectivity();
  };

  const value: NetworkContextType = {
    networkState,
    isOnline,
    isOffline: !isOnline,
    connectionType: networkState.type,
    checkConnectivity,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};