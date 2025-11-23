/**
 * Network Service
 * 
 * Monitors network connectivity and quality
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import {
  NetworkState,
  ConnectionType,
  NetworkQuality,
  NetworkListener,
  NetworkEvent,
  NetworkEventData,
  NetworkEventListener,
} from '../types/network.types';
import { errorLoggingService, ErrorSeverity } from './errorLoggingService';
import logger from '../utils/logger';

// ============================================================================
// Network Service Class
// ============================================================================

class NetworkService {
  private currentState: NetworkState | null = null;
  private listeners: Set<NetworkListener> = new Set();
  private eventListeners: Map<NetworkEvent, Set<NetworkEventListener>> = new Map();
  private initialized: boolean = false;
  private unsubscribe: (() => void) | null = null;

  // ==========================================================================
  // Initialization
  // ==========================================================================

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Get initial network state
      const netInfoState = await NetInfo.fetch();
      this.currentState = this.mapNetInfoState(netInfoState);

      // Subscribe to network state changes
      this.unsubscribe = NetInfo.addEventListener((state) => {
        this.handleStateChange(state);
      });

      this.initialized = true;
      logger.debug('[NetworkService] Initialized successfully');
    } catch (error) {
      logger.error('[NetworkService] Initialization failed:', error);
      errorLoggingService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.ERROR,
        { action: 'network_service_init' },
        false
      );
    }
  }

  // ==========================================================================
  // State Management
  // ==========================================================================

  private handleStateChange(netInfoState: NetInfoState): void {
    const previousState = this.currentState;
    const newState = this.mapNetInfoState(netInfoState);

    // Update current state
    this.currentState = newState;

    // Notify listeners
    this.notifyListeners(newState);

    // Emit specific events
    if (previousState) {
      this.emitNetworkEvents(previousState, newState);
    }
  }

  private mapNetInfoState(state: NetInfoState): NetworkState {
    const details = state.details as any;
    
    return {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: this.mapConnectionType(state.type),
      quality: this.determineNetworkQuality(state),
      details: {
        isConnectionExpensive: details?.isConnectionExpensive ?? false,
        cellularGeneration: details?.cellularGeneration || null,
      },
    };
  }

  private mapConnectionType(type: string): ConnectionType {
    switch (type.toLowerCase()) {
      case 'wifi':
        return ConnectionType.WIFI;
      case 'cellular':
        return ConnectionType.CELLULAR;
      case 'ethernet':
        return ConnectionType.ETHERNET;
      case 'bluetooth':
        return ConnectionType.BLUETOOTH;
      case 'none':
        return ConnectionType.NONE;
      default:
        return ConnectionType.UNKNOWN;
    }
  }

  private determineNetworkQuality(state: NetInfoState): NetworkQuality {
    if (!state.isConnected) {
      return NetworkQuality.OFFLINE;
    }

    const details = state.details as any;

    // Estimate based on connection type and details
    if (state.type === 'wifi') {
      return NetworkQuality.EXCELLENT;
    }

    if (state.type === 'cellular') {
      const generation = details?.cellularGeneration;
      switch (generation) {
        case '5g':
          return NetworkQuality.EXCELLENT;
        case '4g':
          return NetworkQuality.GOOD;
        case '3g':
          return NetworkQuality.FAIR;
        case '2g':
          return NetworkQuality.POOR;
        default:
          return NetworkQuality.GOOD;
      }
    }

    if (state.type === 'ethernet') {
      return NetworkQuality.EXCELLENT;
    }

    return NetworkQuality.GOOD;
  }

  // ==========================================================================
  // Event Emission
  // ==========================================================================

  private emitNetworkEvents(previousState: NetworkState, newState: NetworkState): void {
    const timestamp = Date.now();

    // Connection status changed
    if (previousState.isConnected !== newState.isConnected) {
      const event = newState.isConnected ? NetworkEvent.CONNECTED : NetworkEvent.DISCONNECTED;
      this.emitEvent(event, { event, state: newState, previousState, timestamp });
    }

    // Network quality changed
    if (previousState.quality !== newState.quality) {
      this.emitEvent(NetworkEvent.QUALITY_CHANGED, {
        event: NetworkEvent.QUALITY_CHANGED,
        state: newState,
        previousState,
        timestamp,
      });
    }

    // Connection type changed
    if (previousState.type !== newState.type) {
      this.emitEvent(NetworkEvent.TYPE_CHANGED, {
        event: NetworkEvent.TYPE_CHANGED,
        state: newState,
        previousState,
        timestamp,
      });
    }
  }

  private emitEvent(event: NetworkEvent, data: NetworkEventData): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          logger.error(`[NetworkService] Error in event listener:`, error);
        }
      });
    }
  }

  // ==========================================================================
  // Listeners
  // ==========================================================================

  addListener(listener: NetworkListener): () => void {
    this.listeners.add(listener);

    // Immediately call with current state if available
    if (this.currentState) {
      listener(this.currentState);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  addEventListener(event: NetworkEvent, listener: NetworkEventListener): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(event)?.delete(listener);
    };
  }

  private notifyListeners(state: NetworkState): void {
      this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        logger.error('[NetworkService] Error in listener:', error);
      }
    });
  }

  // ==========================================================================
  // Getters
  // ==========================================================================

  getState(): NetworkState | null {
    return this.currentState;
  }

  isConnected(): boolean {
    return this.currentState?.isConnected ?? false;
  }

  isInternetReachable(): boolean {
    return this.currentState?.isInternetReachable ?? false;
  }

  getConnectionType(): ConnectionType {
    return this.currentState?.type ?? ConnectionType.UNKNOWN;
  }

  getNetworkQuality(): NetworkQuality {
    return this.currentState?.quality ?? NetworkQuality.OFFLINE;
  }

  isHighQuality(): boolean {
    const quality = this.getNetworkQuality();
    return quality === NetworkQuality.EXCELLENT || quality === NetworkQuality.GOOD;
  }

  isConnectionExpensive(): boolean {
    return this.currentState?.details.isConnectionExpensive ?? false;
  }

  // ==========================================================================
  // Refresh
  // ==========================================================================

  async refresh(): Promise<NetworkState> {
    try {
      const netInfoState = await NetInfo.fetch();
      const newState = this.mapNetInfoState(netInfoState);
      
      const previousState = this.currentState;
      this.currentState = newState;

      // Notify listeners
      this.notifyListeners(newState);

      // Emit events if state changed
      if (previousState) {
        this.emitNetworkEvents(previousState, newState);
      }

      return newState;
    } catch (error) {
      logger.error('[NetworkService] Refresh failed:', error);
      errorLoggingService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.ERROR,
        { action: 'network_refresh' },
        false
      );
      throw error;
    }
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    this.listeners.clear();
    this.eventListeners.clear();
    this.initialized = false;

    logger.debug('[NetworkService] Cleaned up');
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const networkService = new NetworkService();
export default networkService;
