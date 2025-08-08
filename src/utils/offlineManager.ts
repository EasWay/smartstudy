import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkManager } from './networkUtils';

interface QueuedAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

export class OfflineManager {
  private static readonly QUEUE_KEY = '@offline_queue';
  private static readonly MAX_RETRIES = 3;
  private static actionQueue: QueuedAction[] = [];
  private static isProcessing = false;

  static async initialize(): Promise<void> {
    await this.loadQueue();
    
    // Listen for network changes to process queue when online
    NetworkManager.addListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        this.processQueue();
      }
    });
  }

  static async queueAction(type: string, data: any): Promise<void> {
    const action: QueuedAction = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.actionQueue.push(action);
    await this.saveQueue();

    // Try to process immediately if online
    if (NetworkManager.isOnline()) {
      this.processQueue();
    }
  }

  static async processQueue(): Promise<void> {
    if (this.isProcessing || this.actionQueue.length === 0 || NetworkManager.isOffline()) {
      return;
    }

    this.isProcessing = true;

    const actionsToProcess = [...this.actionQueue];
    const failedActions: QueuedAction[] = [];

    for (const action of actionsToProcess) {
      try {
        const success = await this.executeAction(action);
        
        if (!success) {
          action.retryCount++;
          if (action.retryCount < this.MAX_RETRIES) {
            failedActions.push(action);
          }
        }
      } catch (error) {
        console.error('Error processing queued action:', error);
        action.retryCount++;
        if (action.retryCount < this.MAX_RETRIES) {
          failedActions.push(action);
        }
      }
    }

    this.actionQueue = failedActions;
    await this.saveQueue();
    this.isProcessing = false;
  }

  private static async executeAction(action: QueuedAction): Promise<boolean> {
    // This would be implemented based on the specific action types
    // For now, we'll just log the action
    console.log('Executing queued action:', action.type, action.data);
    
    // Return true if successful, false if should retry
    return true;
  }

  private static async loadQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(this.QUEUE_KEY);
      if (queueData) {
        this.actionQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
      this.actionQueue = [];
    }
  }

  private static async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.actionQueue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  static getQueueLength(): number {
    return this.actionQueue.length;
  }

  static async clearQueue(): Promise<void> {
    this.actionQueue = [];
    await AsyncStorage.removeItem(this.QUEUE_KEY);
  }

  static getQueuedActions(): QueuedAction[] {
    return [...this.actionQueue];
  }
}