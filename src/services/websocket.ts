// src/services/websocket.ts
// WebSocket/STOMP helper for real-time booking notifications
// Requires: npm install @stomp/stompjs

import { Client, StompSubscription } from '@stomp/stompjs';

export interface WebSocketConfig {
  baseUrl?: string;
  doctorId: string;
  onBookingReceived: (booking: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

/**
 * WebSocket service for real-time booking notifications
 * Backend sends messages to: /user/{doctorId}/queue/bookings
 */
export class BookingWebSocketService {
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private config: WebSocketConfig;

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  /**
   * Convert HTTP(S) base URL to WS(S) URL
   */
  private getWebSocketUrl(): string {
    const baseUrl = this.config.baseUrl || 'http://localhost:8080';
    try {
      const url = new URL(baseUrl);
      const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${url.host}/ws`;
    } catch {
      return 'ws://localhost:8080/ws';
    }
  }

  /**
   * Get the STOMP destination for doctor's booking queue
   */
  private getDestination(): string {
    return `/user/${this.config.doctorId}/queue/bookings`;
  }

  /**
   * Connect to WebSocket and subscribe to booking notifications
   */
  connect(): void {
    const wsUrl = this.getWebSocketUrl();
    const destination = this.getDestination();

    console.log('🔌 Connecting to WebSocket:', wsUrl);
    console.log('📡 Subscribing to:', destination);

    this.client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      
      onConnect: () => {
        console.log('✅ WebSocket connected');
        this.config.onConnect?.();

        // Subscribe to doctor's booking queue
        this.subscription = this.client!.subscribe(destination, (message) => {
          try {
            const booking = JSON.parse(message.body);
            console.log('📬 New booking received:', booking);
            this.config.onBookingReceived(booking);
          } catch (error) {
            console.error('❌ Failed to parse booking message:', error);
          }
        });
      },

      onStompError: (frame) => {
        console.error('❌ STOMP error:', frame.headers['message']);
        console.error('Details:', frame.body);
        this.config.onError?.(frame);
      },

      onWebSocketClose: () => {
        console.log('🔌 WebSocket disconnected');
        this.config.onDisconnect?.();
      },
    });

    this.client.activate();
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }

    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }

    console.log('🔌 WebSocket disconnected');
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.client?.connected ?? false;
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
