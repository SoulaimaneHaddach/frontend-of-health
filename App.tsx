// App.tsx
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { AnalyticsProvider } from './src/context/AnalyticsContext';
import { ErrorBoundary } from './src/shared/components/ErrorBoundary';
import { OfflineIndicator } from './src/shared/components/OfflineIndicator';
import { AppNavigator } from './src/navigation/AppNavigator';
import { globalErrorHandler } from './src/shared/services/globalErrorHandler';
import { errorLoggingService, ErrorSeverity } from './src/shared/services/errorLoggingService';
import { ADS } from './src/shared/config/ads';

export default function App() {
  useEffect(() => {
    // Initialize global error handler
    globalErrorHandler.initialize();
    // Try to initialize Google Mobile Ads if native module is available
    try {
      // lazy require to avoid crashing in Expo Go
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ads = require('react-native-google-mobile-ads');
      const mobileAds = (ads && (ads.mobileAds || ads)) as any;
      if (mobileAds && typeof mobileAds().initialize === 'function') {
        mobileAds().initialize().then(() => {
          // set non-personalized + test-device config when developing
          try {
            if (typeof mobileAds().setRequestConfiguration === 'function') {
              const cfg: any = { requestNonPersonalizedAdsOnly: true };
              if (__DEV__) {
                cfg.testDeviceIds = [mobileAds.TestIds?.EMULATOR || 'EMULATOR'];
              }
              mobileAds().setRequestConfiguration(cfg);
            }
          } catch (e) {}
        }).catch(() => {});
      }
    } catch (e) {
      // ignore if native module not present (Expo Go)
    }
  }, []);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log error to error logging service
        errorLoggingService.logError(
          error,
          ErrorSeverity.FATAL,
          {
            action: 'component_error',
            extra: { componentStack: errorInfo.componentStack },
          },
          false
        );
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <LanguageProvider>
            <ThemeProvider>
              <AnalyticsProvider debug={__DEV__}>
                <OfflineIndicator />
                <AppNavigator />
              </AnalyticsProvider>
            </ThemeProvider>
          </LanguageProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}