import { useEffect, useRef, useState } from 'react';
import logger from '../utils/logger';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { secureStorage, TokenStorage } from '../utils/secureStorage';
import ENV from '../../config/env';

export type UsePushNotificationsOptions = {
  onNotification?: (payload: Notifications.Notification) => void;
  onNotificationResponse?: (data: any) => void; // called when user taps the notification
  enabled?: boolean;
};

export const usePushNotifications = ({
  onNotification,
  onNotificationResponse,
  enabled = true,
}: UsePushNotificationsOptions) => {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const receivedListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    const register = async () => {
      try {
        if (!Device.isDevice) {
          logger.warn('Push notifications are not supported on emulators. Use a physical device.');
        }

        const existing = await Notifications.getPermissionsAsync();
        let finalStatus = existing.status;

        if (existing.status !== 'granted') {
          const request = await Notifications.requestPermissionsAsync();
          finalStatus = request.status;
        }

        setPermissionStatus(finalStatus);

        if (finalStatus !== 'granted') {
          logger.warn('Permission for push notifications not granted');
          return;
        }

        // Create Android channel and await it before proceeding
        if (Platform.OS === 'android') {
          try {
            await Notifications.setNotificationChannelAsync('default', {
              name: 'default',
              importance: Notifications.AndroidImportance.MAX,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: '#FF231F7C',
            });
          } catch (e) {
            if (ENV.ENABLE_LOGGING && __DEV__) logger.warn('Failed to create notification channel', e);
          }
        }

        // Prefer device/native token (FCM/APNs) then fallback to Expo push token
        try {
          // getDevicePushTokenAsync returns native token when configured in bare workflow
          // In managed Expo, getExpoPushTokenAsync is typically used.
          const deviceToken = await Notifications.getDevicePushTokenAsync();
            if (deviceToken && deviceToken.data) {
            if (mounted) {
              setPushToken(deviceToken.data);
              // Persist token securely for later retrieval
              try { await TokenStorage.setPushToken(deviceToken.data); } catch {}
            }
          }
        } catch (err) {
          try {
            const expoToken = await Notifications.getExpoPushTokenAsync();
            if (expoToken && expoToken.data && mounted) {
              setPushToken(expoToken.data);
              try { await TokenStorage.setPushToken(expoToken.data); } catch {}
            }
          } catch (err2) {
            logger.warn('Failed to get push token:', err2);
          }
        }
      } catch (e) {
        logger.warn('Failed to register for push notifications', e);
      }
    };

    register();

    // Foreground notification handler
    receivedListener.current = Notifications.addNotificationReceivedListener((notification) => {
      // Default behaviour: call callback and show an Alert
      onNotification?.(notification);

      // If no custom handler provided, show a simple alert with possible booking info
      if (!onNotification) {
        const data = notification.request.content.data || {};
        const title = notification.request.content.title || 'Notification';
        const body = notification.request.content.body || '';

        // If it contains bookingId, surface it
        if (data.bookingId) {
          Alert.alert(title, body || `Booking ${data.bookingId}`, [
            { text: 'Dismiss' },
            { text: 'View', onPress: () => onNotificationResponse?.(data) },
          ]);
        } else {
          Alert.alert(title, body || 'You have a new notification');
        }
      }
    });

    // When user interacts with a notification (tap)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data || {};
      onNotificationResponse?.(data);
    });

    return () => {
      mounted = false;
      try {
        if (receivedListener.current && typeof receivedListener.current.remove === 'function') {
          receivedListener.current.remove();
        }
      } catch {}

      try {
        if (responseListener.current && typeof responseListener.current.remove === 'function') {
          responseListener.current.remove();
        }
      } catch {}
    };
  }, [enabled, onNotification, onNotificationResponse]);

  const refreshPermissions = async () => {
    const p = await Notifications.getPermissionsAsync();
    setPermissionStatus(p.status);
    return p;
  };

  return {
    pushToken,
    permissionStatus,
    refreshPermissions,
  } as const;
};

export default usePushNotifications;
