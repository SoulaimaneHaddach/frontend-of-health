// src/services/websocket.ts
// WebSocket/STOMP helper for real-time booking notifications
// Requires: npm install @stomp/stompjs

import { Client, StompSubscription } from '@stomp/stompjs';
import { networkService } from '../shared/services/networkService';
import { TokenStorage } from '../shared/utils/secureStorage';
import { errorLoggingService, ErrorSeverity } from '../shared/services/errorLoggingService';
import logger from '../shared/utils/logger';

export interface WebSocketConfig {
  baseUrl?: string;
  doctorId: string;
  onBookingReceived: (booking: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  backoffBaseMs?: number;
}


export class BookingWebSocketService {
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private config: WebSocketConfig;
  private isManualDisconnect: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private backoffBaseMs: number = 1000;
  private networkUnsubscribe: (() => void) | null = null;
  private cooldownTimer: NodeJS.Timeout | null = null;

  constructor(config: WebSocketConfig) {
    this.config = {
      autoReconnect: true,
      ...config,
    };
    if (typeof config.maxReconnectAttempts === 'number') this.maxReconnectAttempts = config.maxReconnectAttempts;
    if (typeof config.backoffBaseMs === 'number') this.backoffBaseMs = config.backoffBaseMs;
    
    // Listen to network changes
    this.setupNetworkListener();
  }


  private setupNetworkListener(): void {
    // Reconnect when network comes back online
    this.networkUnsubscribe = networkService.addListener((state) => {
      if (state.isConnected && !this.isConnected() && !this.isManualDisconnect) {
        logger.debug('🔄 Network reconnected, attempting to reconnect WebSocket...');
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
      logger.debug('⚠️ WebSocket already connected');
      return;
    }

    // Check network connectivity
    if (!networkService.isConnected()) {
      logger.debug('⚠️ No internet connection, WebSocket connection postponed');
      return;
    }

    const wsUrl = this.getWebSocketUrl();
    const destination = this.getDestination();

    logger.debug('🔌 Connecting to WebSocket:', wsUrl);
    logger.debug('📡 Subscribing to:', destination);

    this.isManualDisconnect = false;

    // Attempt to include Authorization header if token is available
    const attachClientWithAuth = async () => {
      const token = await TokenStorage.getToken();
      // Print the token before connecting (developer debug)
      logger.debug('🔑 WebSocket auth token:', token);
      const connectHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

      this.client = new Client({
        brokerURL: wsUrl,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        connectHeaders,

        onConnect: () => {
          logger.debug('✅ WebSocket connected');
          // Log underlying WebSocket instance if accessible
          try {
            const wsInstance: any = (this.client as any)?._transport?._ws || (this.client as any)?._websocket;
            if (wsInstance) {
              logger.debug('🔓 Underlying WebSocket state onConnect', { readyState: wsInstance.readyState, url: wsInstance.url });
            }
          } catch (e) {
            logger.debug('🔓 Could not access raw WebSocket instance on connect', e);
          }
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
            logger.debug('📩 STOMP message received (raw):', { headers: message.headers, body: message.body });
            const booking = JSON.parse(message.body);
            logger.debug('📬 New booking parsed:', booking);
            
            // Log breadcrumb
            errorLoggingService.addBreadcrumb({
              category: 'network',
              message: 'New booking notification received',
              level: ErrorSeverity.INFO,
              data: { bookingId: booking.id },
            });

            this.config.onBookingReceived(booking);
          } catch (error) {
            logger.error('❌ Failed to parse booking message:', error);
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
        logger.error('❌ STOMP error:', frame.headers['message']);
        logger.error('Details:', frame.body);
        
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
          try {
            const code = (event && (event as any).code) || (event && (event as any).wasClean ? 1000 : undefined);
            const reason = (event && (event as any).reason) || undefined;
            logger.debug('🔌 WebSocket disconnected', { code, reason });
            if (code === 1006) {
              logger.error('❗ WebSocket closed with abnormal closure (1006) — possible network/server reject');
              errorLoggingService.addBreadcrumb({ category: 'network', message: 'WebSocket closed with code 1006', level: ErrorSeverity.ERROR, data: { url: wsUrl } });
            }
          } catch {
            logger.debug('🔌 WebSocket disconnected');
          }
        
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
          logger.error('❌ WebSocket error event:', event);
          try {
            const raw = (this.client as any)?._transport?._ws || (this.client as any)?._websocket;
            if (raw) {
              logger.debug('🔎 Raw socket state on error', { readyState: raw.readyState, url: raw.url });
            }
          } catch (e) {
            logger.debug('🔎 Could not read raw socket state on error', e);
          }

          // Log with context
          errorLoggingService.logError(
            new Error('WebSocket connection error'),
            ErrorSeverity.ERROR,
            { action: 'websocket_error', extra: { url: wsUrl, reconnectAttempts: this.reconnectAttempts } },
            false
          );

          // Try reconnect flow (will respect max attempts and network state)
          this.handleReconnect();
        },

        // StompJS does not officially expose onWebSocketOpen in types; attach via beforeConnect hook
        beforeConnect: () => {
        try {
          // Attempt to access underlying WebSocket if available
          const wsInstance: any = (this.client as any)?._transport?._ws || (this.client as any)?._websocket;
          if (wsInstance) {
            const socketInfo = { readyState: wsInstance.readyState, url: wsInstance.url };
            logger.debug('🔓 Raw WebSocket (pre-connect) info', socketInfo);
            errorLoggingService.addBreadcrumb({ category: 'network', message: 'Raw WebSocket pre-connect', level: ErrorSeverity.INFO, data: socketInfo });
          }
        } catch {
          // ignore
        }
      },
      });

      this.client.activate();
    };

    // Fire and forget attaching client; errors handled inside client callbacks
    attachClientWithAuth().catch((e) => {
      logger.error('❌ Failed to initialize WebSocket client with auth', e);
      // fallback to unauthenticated client initialization
      try {
        this.client = new Client({
          brokerURL: wsUrl,
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
          onConnect: () => logger.debug('✅ WebSocket connected (fallback, no auth)'),
          onWebSocketClose: (event) => {
            const code = (event && (event as any).code) || undefined;
            logger.debug('🔌 WebSocket disconnected (fallback)', { code });
            if (code === 1006) logger.error('❗ WebSocket fallback closed with 1006');
          },
          onWebSocketError: (ev) => logger.error('❌ WebSocket error (fallback):', ev),
          beforeConnect: () => {
            try {
              const wsInstance: any = (this.client as any)?._transport?._ws || (this.client as any)?._websocket;
              if (wsInstance) logger.debug('🔓 Raw WebSocket (fallback pre-connect)', { readyState: wsInstance.readyState, url: wsInstance.url });
            } catch {}
          },
        });
        this.client.activate();
      } catch (err) {
        logger.error('❌ Fallback unauthenticated WebSocket init failed', err);
      }
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('❌ Max reconnection attempts reached');
      errorLoggingService.logError(
        new Error('WebSocket max reconnection attempts reached'),
        ErrorSeverity.ERROR,
        { action: 'websocket_max_reconnect', extra: { attempts: this.reconnectAttempts } },
        false
      );

      // Notify via callback if provided
      this.config.onError?.(new Error('WebSocket max reconnection attempts reached'));

      // Start a cooldown timer to allow future reconnect attempts (e.g., 5 minutes)
      try { if (this.cooldownTimer) clearTimeout(this.cooldownTimer); } catch {}
      this.cooldownTimer = setTimeout(() => {
        logger.debug('🔁 Reconnect cooldown expired, resetting reconnectAttempts');
        this.reconnectAttempts = 0;
        this.cooldownTimer = null;
      }, 5 * 60 * 1000);

      return;
    }

    this.reconnectAttempts++;

    // Exponential backoff with jitter
    const base = this.backoffBaseMs || 1000;
    const expo = Math.min(base * Math.pow(2, this.reconnectAttempts - 1), 30000);
    const jitter = Math.floor(Math.random() * Math.min(1000, Math.floor(expo / 4)));
    const delay = expo + jitter;

    logger.debug(`🔄 Reconnecting in ${(delay / 1000).toFixed(1)}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (!this.isManualDisconnect && !this.isConnected() && networkService.isConnected()) {
        this.connect();
      } else {
        // If still offline, schedule another reconnect attempt when network resumes
        if (!networkService.isConnected()) {
          logger.debug('⚠️ Still offline — waiting for network before reconnecting');
        }
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

    logger.debug('🔌 WebSocket manually disconnected');
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
