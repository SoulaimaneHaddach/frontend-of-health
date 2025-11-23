/**
 * Offline Indicator Component
 * 
 * Shows network connectivity status to the user
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { networkService } from '../services/networkService';
import { NetworkState } from '../types/network.types';
import { FONT_SIZES } from '../constants/theme';
import { useTheme } from '../../context/ThemeContext';

// ============================================================================
// Offline Indicator Component
// ============================================================================

export const OfflineIndicator: React.FC = () => {
  const [networkState, setNetworkState] = useState<NetworkState | null>(null);
  const [slideAnim] = useState(new Animated.Value(-50));

  const { colors } = useTheme();

  useEffect(() => {
    // Subscribe to network changes
    const unsubscribe = networkService.addListener((state) => {
      setNetworkState(state);

      // Animate in/out based on connection status
      if (!state.isConnected) {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      } else {
        // Delay hiding to show "Back online" message
        setTimeout(() => {
          Animated.spring(slideAnim, {
            toValue: -50,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
        }, 2000);
      }
    });

    return unsubscribe;
  }, [slideAnim]);

  if (!networkState) {
    return null;
  }

  const isOffline = !networkState.isConnected;
  const backgroundColor = isOffline ? colors.error : colors.success;
  const message = isOffline ? 'No Internet Connection' : 'Back Online';

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Text style={[styles.text, { color: colors.white }]}>{message}</Text>
    </Animated.View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 10,
  },
  text: {
    /* color set inline from theme */
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
});

export default OfflineIndicator;
