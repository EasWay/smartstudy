import NetInfo from '@react-native-community/netinfo';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

export class NetworkManager {
  private static listeners: ((state: NetworkState) => void)[] = [];
  private static currentState: NetworkState = {
    isConnected: false,
    isInternetReachable: null,
    type: null,
  };

  static async initialize(): Promise<void> {
    // Get initial network state
    const state = await NetInfo.fetch();
    this.currentState = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
    };

    // Subscribe to network state changes
    NetInfo.addEventListener((state) => {
      const newState: NetworkState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      };

      this.currentState = newState;
      this.notifyListeners(newState);
    });
  }

  static getCurrentState(): NetworkState {
    return this.currentState;
  }

  static isOnline(): boolean {
    return this.currentState.isConnected && this.currentState.isInternetReachable !== false;
  }

  static isOffline(): boolean {
    return !this.isOnline();
  }

  static addListener(callback: (state: NetworkState) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private static notifyListeners(state: NetworkState): void {
    this.listeners.forEach(listener => listener(state));
  }

  static getConnectionType(): string {
    return this.currentState.type || 'unknown';
  }

  static async checkConnectivity(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected ?? false;
    } catch (error) {
      console.error('Error checking connectivity:', error);
      return false;
    }
  }
}