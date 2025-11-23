/**
 * WebSocket Test Screen
 * 
 * Use this screen to test WebSocket notifications without needing real bookings
 * Add to your navigation stack temporarily for testing
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBookingNotifications } from '../shared/hooks/useBookingNotifications';
import { FONT_SIZES, SPACING, RADIUS } from '../shared/constants/theme';
import { useTheme } from '../context/ThemeContext';

export function WebSocketTestScreen() {
  const { colors } = useTheme();
  const [testDoctorId] = useState('test-doctor-123');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  const {
    isConnected,
    connectionStatus,
    lastBooking,
    error,
    connect,
    disconnect,
    reconnect,
  } = useBookingNotifications({
    doctorId: testDoctorId,
    enabled: false, // Manual control
    showAlert: true,
    onNewBooking: (booking) => {
      addLog(`📬 Booking received: ${booking.nameUser}`);
    },
  });

  const simulateBooking = () => {
    addLog('🔔 Simulating booking notification...');
    
    // Simulate what the backend would send
    const mockBooking = {
      id: `booking-${Date.now()}`,
      doctorId: testDoctorId,
      nameUser: 'Test Patient',
      phoneNumberUser: '+1234567890',
      appointmentTime: new Date(Date.now() + 86400000).toISOString(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    // Show alert manually
    Alert.alert(
      '🔔 Simulated Booking!',
      `Patient: ${mockBooking.nameUser}\nTime: ${new Date(mockBooking.appointmentTime).toLocaleString()}`,
      [{ text: 'OK' }]
    );

    addLog('✅ Simulation complete');
  };

  const getStatusColor = () => {
    if (isConnected) return colors.success;
    if (connectionStatus === 'connecting') return '#f59e0b';
    return colors.textSecondary;
  };

  const getStatusIcon = () => {
    if (isConnected) return 'checkmark-circle';
    if (connectionStatus === 'connecting') return 'sync';
    return 'alert-circle';
  };
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="bug" size={32} color={colors.primary} />
          <Text style={styles.title}>WebSocket Test</Text>
          <Text style={styles.subtitle}>
            Test real-time notifications
          </Text>
        </View>

        {/* Connection Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Ionicons 
                name={getStatusIcon()} 
                size={24} 
                color={getStatusColor()} 
              />
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>Status</Text>
                <Text style={[styles.statusValue, { color: getStatusColor() }]}>
                  {connectionStatus.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statusRow}>
              <Ionicons 
                name="wifi" 
                size={24} 
                color={isConnected ? colors.success : colors.textSecondary} 
              />
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>Connected</Text>
                <Text style={styles.statusValue}>
                  {isConnected ? 'Yes ✅' : 'No ❌'}
                </Text>
              </View>
            </View>

            {error && (
              <>
                <View style={styles.divider} />
                <View style={styles.errorBox}>
                  <Ionicons name="warning" size={20} color={colors.error} />
                  <Text style={styles.errorText}>{error.message}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Controls</Text>
          
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={() => {
              connect();
              addLog('🔌 Connecting to WebSocket...');
            }}
            disabled={isConnected}
          >
            <Ionicons name="power" size={20} color={colors.white} />
            <Text style={styles.buttonText}>Connect</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => {
              disconnect();
              addLog('🔌 Disconnected');
            }}
            disabled={!isConnected}
          >
            <Ionicons name="power-outline" size={20} color={colors.primary} />
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
              Disconnect
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => {
              reconnect();
              addLog('🔄 Reconnecting...');
            }}
          >
            <Ionicons name="refresh" size={20} color={colors.primary} />
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
              Reconnect
            </Text>
          </TouchableOpacity>
        </View>

        {/* Test Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Actions</Text>
          
          <TouchableOpacity
            style={[styles.button, styles.buttonSuccess]}
            onPress={simulateBooking}
          >
            <Ionicons name="notifications" size={20} color={colors.white} />
            <Text style={styles.buttonText}>Simulate Booking Alert</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => {
              setLogs([]);
              addLog('🗑️ Logs cleared');
            }}
          >
            <Ionicons name="trash-outline" size={20} color={colors.primary} />
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
              Clear Logs
            </Text>
          </TouchableOpacity>
        </View>

        {/* Last Booking */}
        {lastBooking && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Last Booking</Text>
            <View style={styles.bookingCard}>
              <Text style={styles.bookingText}>
                👤 {lastBooking.nameUser}
              </Text>
              {/* email removed from booking model */}
              <Text style={styles.bookingText}>
                📞 {lastBooking.phoneNumberUser}
              </Text>
              <Text style={styles.bookingText}>
                📅 {new Date(lastBooking.appointmentTime).toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {/* Logs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logs ({logs.length})</Text>
          <View style={styles.logsContainer}>
            {logs.length === 0 ? (
              <Text style={styles.noLogsText}>No logs yet...</Text>
            ) : (
              logs.map((log, index) => (
                <Text key={index} style={styles.logText}>
                  {log}
                </Text>
              ))
            )}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Test</Text>
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionText}>
              1️⃣ Click "Connect" to start WebSocket connection
            </Text>
            <Text style={styles.instructionText}>
              2️⃣ Wait for status to show "CONNECTED"
            </Text>
            <Text style={styles.instructionText}>
              3️⃣ Click "Simulate Booking Alert" to test notifications
            </Text>
            <Text style={styles.instructionText}>
              4️⃣ OR create a real booking via backend/Postman
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: colors.text,
    marginTop: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
    marginTop: SPACING.xs,
  },
  section: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: SPACING.md,
  },
  statusCard: {
    backgroundColor: colors.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  statusInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  statusLabel: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
  },
  statusValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: SPACING.sm,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: colors.error,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  buttonSuccess: {
    backgroundColor: colors.success,
  },
  buttonText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: colors.white,
  },
  buttonTextSecondary: {
    color: colors.primary,
  },
  bookingCard: {
    backgroundColor: colors.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  bookingText: {
    fontSize: FONT_SIZES.base,
    color: colors.text,
    marginBottom: SPACING.xs,
  },
  logsContainer: {
    backgroundColor: '#1f2937',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    maxHeight: 300,
  },
  logText: {
    fontSize: FONT_SIZES.sm,
    color: '#10b981',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  noLogsText: {
    fontSize: FONT_SIZES.sm,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  instructionsCard: {
    backgroundColor: '#eff6ff',
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  instructionText: {
    fontSize: FONT_SIZES.base,
    color: colors.text,
    marginBottom: SPACING.sm,
  },
});
