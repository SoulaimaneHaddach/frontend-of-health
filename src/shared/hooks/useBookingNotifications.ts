/**
 * useBookingNotifications Hook
 * 
 * Easy-to-use hook for real-time booking notifications
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import logger from '../utils/logger';
import { BookingWebSocketService } from '../../services/websocket';
import { errorLoggingService, ErrorSeverity } from '../services/errorLoggingService';

export interface BookingNotification {
  id: string;
  doctorId: string;
  nameUser: string;
  phoneNumberUser: string;
  appointmentTime: string;
  status: string;
  createdAt: string;
}

export interface UseBookingNotificationsOptions {
  doctorId: string;
  enabled?: boolean;
  onNewBooking?: (booking: BookingNotification) => void;
  showAlert?: boolean;
  baseUrl?: string;
  onBookingClick?: (booking: BookingNotification) => void;
}

export interface UseBookingNotificationsReturn {
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  lastBooking: BookingNotification | null;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useBookingNotifications(
  options: UseBookingNotificationsOptions
): UseBookingNotificationsReturn {
  const {
    doctorId,
    enabled = true,
    onNewBooking,
    showAlert = true,
    baseUrl,
    onBookingClick,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [lastBooking, setLastBooking] = useState<BookingNotification | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const wsServiceRef = useRef<BookingWebSocketService | null>(null);

  const handleBookingReceived = useCallback(
    (booking: BookingNotification) => {
      logger.debug('📬 New booking notification:', booking);

      // Update state
      setLastBooking(booking);
      setError(null);

      // Call custom handler
      onNewBooking?.(booking);

      // Show alert if enabled
      if (showAlert) {
        const message = `New booking from ${booking.nameUser}\n${new Date(booking.appointmentTime).toLocaleString()}`;
        
        if (Platform.OS === 'web') {
          alert(`New Booking!\n${message}`);
        } else {
          Alert.alert(
            '🔔 New Booking!',
            message,
            [
              {
                text: 'View',
                onPress: () => {
                  try {
                    onBookingClick?.(booking);
                  } catch (e) {
                    logger.warn('onBookingClick handler error', e);
                  }
                },
              },
              { text: 'OK' },
            ]
          );
        }
      }

      // Log to analytics/error tracking
      errorLoggingService.addBreadcrumb({
        category: 'user',
        message: 'New booking notification received',
        level: ErrorSeverity.INFO,
        data: {
          bookingId: booking.id,
          patientName: booking.nameUser,
        },
      });
    }, [onNewBooking, showAlert, onBookingClick]);

  const connect = useCallback(() => {
    if (!doctorId) {
      logger.warn('⚠️ Cannot connect: doctorId is required');
      return;
    }

    if (wsServiceRef.current?.isConnected()) {
      logger.debug('⚠️ WebSocket already connected');
      return;
    }

    logger.debug('🔌 Connecting to booking notifications...');
    setConnectionStatus('connecting');

    wsServiceRef.current = new BookingWebSocketService({
      doctorId,
      baseUrl,
      onBookingReceived: handleBookingReceived,
        onConnect: () => {
        logger.debug('✅ Connected to booking notifications');
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
      },
      onDisconnect: () => {
        logger.debug('🔌 Disconnected from booking notifications');
        setIsConnected(false);
        setConnectionStatus('disconnected');
      },
      onError: (err: any) => {
        logger.error('❌ WebSocket error:', err);
        const error = new Error('WebSocket connection error');
        setError(error);
        setConnectionStatus('disconnected');

        errorLoggingService.logError(
          error,
          ErrorSeverity.ERROR,
          { action: 'websocket_connection_error' },
          false
        );
      },
      autoReconnect: true,
    });

    // Activate connection
    try {
      wsServiceRef.current.connect();
    } catch (e) {
      logger.warn('WebSocket connect error', e);
    }
  }, [doctorId, baseUrl, handleBookingReceived]);

  const disconnect = useCallback(() => {
    logger.debug('🔌 Disconnecting from booking notifications...');
    wsServiceRef.current?.disconnect();
    wsServiceRef.current = null;
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const reconnect = useCallback(() => {
    logger.debug('🔄 Reconnecting to booking notifications...');
    disconnect();
    setTimeout(() => connect(), 500);
  }, [connect, disconnect]);

  // Auto-connect when enabled
  useEffect(() => {
    if (enabled && doctorId) {
      connect();
    }

    return () => {
      if (enabled) {
        disconnect();
      }
    };
  }, [enabled, doctorId, connect, disconnect]); // Include stable callbacks

  // Update doctor ID if changed
  useEffect(() => {
    if (wsServiceRef.current && doctorId && enabled) {
      wsServiceRef.current.updateDoctorId(doctorId);
    }
  }, [doctorId, enabled]);

  return {
    isConnected,
    connectionStatus,
    lastBooking,
    error,
    connect,
    disconnect,
    reconnect,
  };
}
