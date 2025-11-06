/**
 * useBookingNotifications Hook
 * 
 * Easy-to-use hook for real-time booking notifications
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { BookingWebSocketService } from '../../services/websocket';
import { errorLoggingService, ErrorSeverity } from '../services/errorLoggingService';

export interface BookingNotification {
  id: string;
  doctorId: string;
  nameUser: string;
  emailUser: string;
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
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [lastBooking, setLastBooking] = useState<BookingNotification | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const wsServiceRef = useRef<BookingWebSocketService | null>(null);

  const handleBookingReceived = useCallback(
    (booking: BookingNotification) => {
      console.log('📬 New booking notification:', booking);

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
                  // Navigate to booking details
                  console.log('Navigate to booking:', booking.id);
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
    },
    [onNewBooking, showAlert]
  );

  const connect = useCallback(() => {
    if (!doctorId) {
      console.warn('⚠️ Cannot connect: doctorId is required');
      return;
    }

    if (wsServiceRef.current?.isConnected()) {
      console.log('⚠️ WebSocket already connected');
      return;
    }

    console.log('🔌 Connecting to booking notifications...');
    setConnectionStatus('connecting');

    wsServiceRef.current = new BookingWebSocketService({
      doctorId,
      baseUrl,
      onBookingReceived: handleBookingReceived,
      onConnect: () => {
        console.log('✅ Connected to booking notifications');
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
      },
      onDisconnect: () => {
        console.log('🔌 Disconnected from booking notifications');
        setIsConnected(false);
        setConnectionStatus('disconnected');
      },
      onError: (err: any) => {
        console.error('❌ WebSocket error:', err);
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

    wsServiceRef.current.connect();
  }, [doctorId, baseUrl, handleBookingReceived]);

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting from booking notifications...');
    wsServiceRef.current?.disconnect();
    wsServiceRef.current = null;
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const reconnect = useCallback(() => {
    console.log('🔄 Reconnecting to booking notifications...');
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
  }, [enabled, doctorId]); // Only reconnect if these change

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
