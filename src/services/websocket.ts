// src/services/websocket.ts
// WebSocket/STOMP helper for real-time booking notifications
// Requires: npm install @stomp/stompjs

import { Client, StompSubscription } from '@stomp/stompjs';
import { networkService } from '../shared/services/networkService';
import { errorLoggingService, ErrorSeverity } from '../shared/services/errorLoggingService';

export interface WebSocketConfig {
  baseUrl?: string;
  doctorId: string;
  onBookingReceived: (booking: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  autoReconnect?: boolean;
}


export class BookingWebSocketService {
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private config: WebSocketConfig;
  private isManualDisconnect: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private networkUnsubscribe: (() => void) | null = null;

  constructor(config: WebSocketConfig) {
    this.config = {
      autoReconnect: true,
      ...config,
    };
    
    // Listen to network changes
    this.setupNetworkListener();
  }


  private setupNetworkListener(): void {
    // Reconnect when network comes back online
    this.networkUnsubscribe = networkService.addListener((state) => {
      if (state.isConnected && !this.isConnected() && !this.isManualDisconnect) {
        console.log('🔄 Network reconnected, attempting to reconnect WebSocket...');
        this.connect();
      }
    });
  }

  private getWebSocketUrl(): string {
    const baseUrl = this.config.baseUrl || 'https://vsrwljl6-8080.uks1.devtunnels.ms';
    try {
      const url = new URL(baseUrl);
      const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${url.host}/ws`;
    } catch {
      return 'wss://vsrwljl6-8080.uks1.devtunnels.ms/ws';
    }
  }


  private getDestination(): string {
    return `/user/${this.config.doctorId}/queue/bookings`;
  }
  connect(): void {
    // Check if already connected
    if (this.isConnected()) {
      console.log('⚠️ WebSocket already connected');
      return;
    }

    // Check network connectivity
    if (!networkService.isConnected()) {
      console.log('⚠️ No internet connection, WebSocket connection postponed');
      return;
    }

    const wsUrl = this.getWebSocketUrl();
    const destination = this.getDestination();

    console.log('🔌 Connecting to WebSocket:', wsUrl);
    console.log('📡 Subscribing to:', destination);

    this.isManualDisconnect = false;

    this.client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      
      onConnect: () => {
        console.log('✅ WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Log success
        errorLoggingService.addBreadcrumb({
          category: 'network',
          message: 'WebSocket connected successfully',
          level: ErrorSeverity.INFO,
        });

        this.config.onConnect?.();

        // Subscribe to doctor's booking queue
        this.subscription = this.client!.subscribe(destination, (message) => {
          try {
            const booking = JSON.parse(message.body);
            console.log('📬 New booking received:', booking);
            
            // Log breadcrumb
            errorLoggingService.addBreadcrumb({
              category: 'network',
              message: 'New booking notification received',
              level: ErrorSeverity.INFO,
              data: { bookingId: booking.id },
            });

            this.config.onBookingReceived(booking);
          } catch (error) {
            console.error('❌ Failed to parse booking message:', error);
            errorLoggingService.logError(
              error instanceof Error ? error : new Error('Failed to parse booking'),
              ErrorSeverity.WARNING,
              { action: 'websocket_parse_booking' },
              false
            );
          }
        });
      },

      onStompError: (frame) => {
        console.error('❌ STOMP error:', frame.headers['message']);
        console.error('Details:', frame.body);
        
        // Log error
        errorLoggingService.logError(
          new Error(`STOMP error: ${frame.headers['message']}`),
          ErrorSeverity.ERROR,
          {
            action: 'websocket_stomp_error',
            extra: { frameBody: frame.body },
          },
          false
        );

        this.config.onError?.(frame);
        this.handleReconnect();
      },

      onWebSocketClose: (event) => {
        console.log('🔌 WebSocket disconnected');
        
        // Log disconnection
        errorLoggingService.addBreadcrumb({
          category: 'network',
          message: 'WebSocket disconnected',
          level: ErrorSeverity.WARNING,
        });

        this.config.onDisconnect?.();
        
        if (!this.isManualDisconnect && this.config.autoReconnect) {
          this.handleReconnect();
        }
      },

      onWebSocketError: (event) => {
        console.error('❌ WebSocket error:', event);
        
        errorLoggingService.logError(
          new Error('WebSocket connection error'),
          ErrorSeverity.ERROR,
          { action: 'websocket_error' },
          false
        );
      },
    });

    this.client.activate();
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      errorLoggingService.logError(
        new Error('WebSocket max reconnection attempts reached'),
        ErrorSeverity.ERROR,
        { action: 'websocket_max_reconnect' },
        false
      );
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`🔄 Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.isManualDisconnect && !this.isConnected()) {
        this.connect();
      }
    }, delay);
  }
  disconnect(): void {
    this.isManualDisconnect = true;
    
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }

    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }

    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }

    console.log('🔌 WebSocket manually disconnected');
  }

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  updateDoctorId(doctorId: string): void {
    const wasConnected = this.isConnected();
    
    // Disconnect current connection
    if (wasConnected) {
      this.disconnect();
    }

    // Update doctor ID
    this.config.doctorId = doctorId;

    // Reconnect if was previously connected
    if (wasConnected) {
      this.isManualDisconnect = false;
      this.connect();
    }
  }

  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (!this.client) return 'disconnected';
    if (this.client.connected) return 'connected';
    if (this.client.active) return 'connecting';
    return 'disconnected';
  }
}

/**
 * Quick setup function for booking notifications
 * 
 * @example
 * const ws = setupBookingWebSocket({
 *   doctorId: 'abc-123',
 *   onBookingReceived: (booking) => {
 *     console.log('New booking:', booking);
 *     // Update your UI, show notification, etc.
 *   }
 * });
 * 
 * // Later, when doctor logs out or component unmounts:
 * ws.disconnect();
 */
export function setupBookingWebSocket(config: WebSocketConfig): BookingWebSocketService {
  const service = new BookingWebSocketService(config);
  service.connect();
  return service;
}
