

import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_SIZES, SPACING, RADIUS } from '../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import logger from '../utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: React.ErrorInfo, resetError: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error to an error reporting service
    logger.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error,
          this.state.errorInfo!,
          this.resetError
        );
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}


interface DefaultErrorFallbackProps {
  error: Error;
  errorInfo: React.ErrorInfo | null;
  resetError: () => void;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
}) => {
  const isDev = __DEV__;
  const { colors } = useTheme();
  const styles = createStyles();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.content, { backgroundColor: colors.card }]}> 
        {/* Error Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="alert-circle" size={80} color={colors.error} />
        </View>

        {/* Error Title */}
        <Text style={[styles.title, { color: colors.text }]}>Oops! Something went wrong</Text>

        {/* Error Message */}
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          We're sorry for the inconvenience. The app encountered an unexpected error.
        </Text>

        {/* Development Error Details */}
        {isDev && (
          <ScrollView style={styles.errorDetails}>
            <Text style={[styles.errorDetailsTitle, { color: colors.error }]}>Error Details (Dev Only):</Text>
            <Text style={[styles.errorDetailsText, { color: colors.textSecondary }]}> 
              <Text style={[styles.errorDetailsLabel, { color: colors.text }]}>Error: </Text>
              {error.toString()}
            </Text>
            {error.stack && (
                <Text style={[styles.errorDetailsText, { color: colors.textSecondary }]}> 
                  <Text style={[styles.errorDetailsLabel, { color: colors.text }]}>Stack: </Text>
                  {error.stack}
                </Text>
            )}
            {errorInfo?.componentStack && (
                <Text style={[styles.errorDetailsText, { color: colors.textSecondary }]}> 
                  <Text style={[styles.errorDetailsLabel, { color: colors.text }]}>Component Stack: </Text>
                  {errorInfo.componentStack}
                </Text>
            )}
          </ScrollView>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={resetError}>
            <Ionicons name="refresh" size={20} color={colors.white} style={styles.buttonIcon} />
            <Text style={[styles.buttonText, { color: colors.white }]}>Try Again</Text>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <Text style={[styles.helpText, { color: colors.textSecondary }]}>If this problem persists, please contact support.</Text>
      </View>
    </View>
  );
};

const createStyles = () => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  content: {
    width: '100%',
    maxWidth: 500,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  message: {
    fontSize: FONT_SIZES.lg,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  errorDetails: {
    width: '100%',
    maxHeight: 200,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorDetailsTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  errorDetailsLabel: {
    fontWeight: '600',
  },
  errorDetailsText: {
    fontSize: FONT_SIZES.xs,
    marginBottom: SPACING.sm,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: SPACING.sm,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  helpText: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
});

export default ErrorBoundary;
