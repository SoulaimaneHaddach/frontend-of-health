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

export default function App() {
  useEffect(() => {
    // Initialize global error handler
    globalErrorHandler.initialize();
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