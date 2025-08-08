import { Platform } from 'react-native';

export interface WebNetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

export class WebNetworkManager {
  private static listeners: ((state: WebNetworkState) => void)[] = [];
  private static currentState: WebNetworkState = {
    isConnected: true, // Default to true on web
    isInternetReachable: true,
    type: 'unknown',
  };

  static async initialize(): Promise<void> {
    if (Platform.OS !== 'web') return;

    // Initialize with current state
    this.updateNetworkState();

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      
      // Listen for connection changes if available
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          connection.addEventListener('change', this.handleConnectionChange);
          this.currentState.type = connection.effectiveType || 'unknown';
        }
      }
    }
  }

  private static handleOnline = () => {
    this.currentState = {
      ...this.currentState,
      isConnected: true,
      isInternetReachable: true,
    };
    this.notifyListeners(this.currentState);
  };

  private static handleOffline = () => {
    this.currentState = {
      ...this.currentState,
      isConnected: false,
      isInternetReachable: false,
    };
    this.notifyListeners(this.currentState);
  };

  private static handleConnectionChange = () => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        this.currentState = {
          ...this.currentState,
          type: connection.effectiveType || 'unknown',
        };
        this.notifyListeners(this.currentState);
      }
    }
  };

  private static updateNetworkState(): void {
    if (typeof navigator !== 'undefined') {
      this.currentState = {
        isConnected: navigator.onLine,
        isInternetReachable: navigator.onLine,
        type: 'unknown',
      };

      // Get connection type if available
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          this.currentState.type = connection.effectiveType || 'unknown';
        }
      }
    }
  }

  static getCurrentState(): WebNetworkState {
    return this.currentState;
  }

  static isOnline(): boolean {
    return this.currentState.isConnected && this.currentState.isInternetReachable !== false;
  }

  static isOffline(): boolean {
    return !this.isOnline();
  }

  static addListener(callback: (state: WebNetworkState) => void): () => void {
    this.listeners.push(callback);
    
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private static notifyListeners(state: WebNetworkState): void {
    this.listeners.forEach(listener => listener(state));
  }

  static getConnectionType(): string {
    return this.currentState.type || 'unknown';
  }

  static async checkConnectivity(): Promise<boolean> {
    try {
      if (Platform.OS !== 'web') return true;
      
      // Simple connectivity check
      const response = await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors'
      });
      return true;
    } catch (error) {
      console.error('Web connectivity check failed:', error);
      return navigator.onLine;
    }
  }

  static cleanup(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          connection.removeEventListener('change', this.handleConnectionChange);
        }
      }
    }
  }
}