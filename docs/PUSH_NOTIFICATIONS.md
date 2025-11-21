# Push Notifications (expo-notifications) — Setup & Testing

This document explains how the app integrates push notifications and the steps needed to enable push delivery on Android (FCM) and iOS (APNs). The repository includes a `usePushNotifications` hook at `src/shared/hooks/usePushNotifications.ts` and the hook is mounted in `src/navigation/AppNavigator.tsx` to handle notification taps and navigate to `DoctorBookings`.

Important: this project appears to use the native Android/iOS folders (bare or prebuild). You must complete native configuration steps below. If you are using Expo Managed workflow, follow the managed-specific steps instead.

## What the hook does

- Requests notification permissions.
- Creates an Android notification channel named `default`.
- Retrieves a push token (prefers device/native token via `getDevicePushTokenAsync`, falls back to Expo token).
- Adds listeners:
  - `addNotificationReceivedListener` — handles foreground notifications (shows an Alert by default).
  - `addNotificationResponseReceivedListener` — handles taps on system notifications and calls the provided callback so the app can navigate.

The notification payload should include `bookingId` and any other fields you need. Example payload data object:

{
  "title": "New booking",
  "body": "A booking was created",
  "data": { "bookingId": "12345", "someOther": "x" }
}

When the user taps the notification, the app will try to navigate to `DoctorBookings`. If you have a dedicated booking details route, update the navigation call in `AppNavigator.tsx` to deep-link with the `bookingId`.

## Code locations

- Hook: `src/shared/hooks/usePushNotifications.ts`
- App mount: `src/navigation/AppNavigator.tsx` (it calls the hook and navigates on notification tap)

## Install packages

From the repo root, install the required packages:

```powershell
npm install expo-notifications expo-device
# or
yarn add expo-notifications expo-device
```

If your app is using the Expo managed workflow, also ensure `expo` is present and configured.

## Android (FCM) — bare / prebuild notes

1. Add `google-services.json` to `android/app/` (from your Firebase project).
2. Add the Firebase Android Gradle plugin and `apply plugin: 'com.google.gms.google-services'` in Gradle files — follow Firebase docs.
3. Add the `com.google.firebase:firebase-messaging` dependency (if using manual native setup) or configure through Expo config plugin if using prebuild.
4. In `AndroidManifest.xml`, ensure the proper services/permissions are added (Firebase will guide you). For `expo-notifications` in bare workflow follow the Expo docs: https://docs.expo.dev/push-notifications/using-fcm/

If you use the Expo Application Services (EAS) build, follow Expo's FCM setup and upload `google-services.json` via `eas.json` or EAS upload flows.

## iOS (APNs)

1. Configure APNs in Apple Developer portal and create a push key/certificate.
2. Add the push credentials to your app entitlements and Xcode project.
3. For Expo-managed workflow, follow Expo docs for push credentials; for bare, configure Xcode with the APNs key and capabilities.

## Server payloads and testing

- For Expo push service (expo push token): use the Expo push API with the push token returned by `getExpoPushTokenAsync`.
- For native FCM tokens: use your FCM server key to send messages to the device token. Example FCM HTTP v1 simplified body:

```json
{
  "message": {
    "token": "<device-token>",
    "notification": { "title": "New booking", "body": "You have a booking" },
    "data": { "bookingId": "12345" }
  }
}
```

If you are using the Expo push service, include the `data` property as shown below when calling their API.

## Testing flow

1. Install the app on a physical device (simulators/emulators may not receive real push tokens reliably).
2. Allow notifications when prompted.
3. Save or log the push token from the app (update the hook or store it via your API) so your server can target the device.
4. Send a background push from your server to the saved token.
   - App background/closed: system notification appears. Tap -> app opens -> `addNotificationResponseReceivedListener` triggers -> navigates to `DoctorBookings`.
   - App foreground: `addNotificationReceivedListener` triggers -> hook shows Alert with 'View' button (default behavior). Pressing 'View' calls the response handler.

## Next steps / things that must match your project

- Confirm whether you want to use Expo's push service (expo tokens) or native FCM/APNs tokens. The hook tries `getDevicePushTokenAsync` then falls back to Expo token — you should pick one strategy and make the server use that token type.
- Ensure your backend includes `bookingId` in the `data` payload so the app can deep-link correctly.
- If you want to navigate to a booking details screen (not just `DoctorBookings`), update `AppNavigator.tsx` to call `navigationRef.current?.navigate('BookingDetails', { bookingId: data.bookingId })` and add that route to your navigator.

## References

- Expo Notifications docs: https://docs.expo.dev/versions/latest/sdk/notifications/
- Expo FCM setup: https://docs.expo.dev/push-notifications/using-fcm/
- Firebase Cloud Messaging docs: https://firebase.google.com/docs/cloud-messaging
