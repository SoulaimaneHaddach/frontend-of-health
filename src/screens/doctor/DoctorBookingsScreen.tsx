// src/screens/doctor/DoctorBookingsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../shared/constants/theme';
import { BookingResponse, BookingStatus } from '../../types/booking';
import ApiService from '../../services/api';

type DoctorBookingsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type FilterType = 'all' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'DONE' | 'CANCELED';

const STATUS_CONFIG: Record<BookingStatus, { color: string; icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  PENDING: { color: '#F59E0B', icon: 'time', label: 'Pending' },
  ACCEPTED: { color: '#10B981', icon: 'checkmark-circle', label: 'Accepted' },
  REJECTED: { color: '#EF4444', icon: 'close-circle', label: 'Rejected' },
  DONE: { color: '#8B5CF6', icon: 'checkmark-done-circle', label: 'Completed' },
  CANCELED: { color: '#6B7280', icon: 'ban', label: 'Canceled' },
};

export const DoctorBookingsScreen: React.FC<DoctorBookingsScreenProps> = ({ navigation }) => {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [doctorId, setDoctorId] = useState<string | null>(null);

  useEffect(() => {
    loadDoctorId();
  }, []);

  useEffect(() => {
    if (doctorId) {
      fetchBookings();
    }
  }, [doctorId]);

  const loadDoctorId = async () => {
    try {
      const id = await AsyncStorage.getItem('doctorId');
      if (id) {
        setDoctorId(id);
      } else {
        Alert.alert('Error', 'Doctor ID not found. Please log in again.', [
          { text: 'OK', onPress: () => navigation.replace('DoctorLogin') },
        ]);
      }
    } catch (error) {
      console.error('Failed to load doctor ID:', error);
    }
  };

  const fetchBookings = async () => {
    if (!doctorId) return;

    try {
      setLoading(true);
      const data = await ApiService.getBookingsByDoctorId(doctorId);
      setBookings(data);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      await ApiService.updateBookingStatus(bookingId, newStatus);
      
      // Update local state
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );

      const statusLabel = STATUS_CONFIG[newStatus].label;
      Alert.alert('Success', `Booking ${statusLabel.toLowerCase()} successfully.`);
    } catch (error: any) {
      console.error('Error updating booking:', error);
      Alert.alert('Error', 'Failed to update booking status. Please try again.');
    }
  };

  const confirmStatusUpdate = (booking: BookingResponse, newStatus: BookingStatus) => {
    const statusLabel = STATUS_CONFIG[newStatus].label;
    Alert.alert(
      `${statusLabel} Booking`,
      `Are you sure you want to ${statusLabel.toLowerCase()} this appointment with ${booking.nameUser}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: statusLabel, onPress: () => handleStatusUpdate(booking.id, newStatus) },
      ]
    );
  };

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter((b) => b.status === filter);

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    };
  };

  const renderBookingCard = ({ item }: { item: BookingResponse }) => {
    const { date, time } = formatDateTime(item.appointmentTime);
    const statusConfig = STATUS_CONFIG[item.status];

    return (
      <View style={styles.bookingCard}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.patientInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.nameUser.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.patientName}>{item.nameUser}</Text>
              <View style={styles.dateTimeRow}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.dateText}>{date}</Text>
                <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} style={{ marginLeft: 8 }} />
                <Text style={styles.timeText}>{time}</Text>
              </View>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
            <Ionicons name={statusConfig.icon} size={16} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.contactInfo}>
          <View style={styles.contactRow}>
            <Ionicons name="call" size={16} color={COLORS.textSecondary} />
            <Text style={styles.contactText}>{item.phoneNumberUser}</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="mail" size={16} color={COLORS.textSecondary} />
            <Text style={styles.contactText} numberOfLines={1}>{item.emailUser}</Text>
          </View>
        </View>

        {/* Actions */}
        {item.status === 'PENDING' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => confirmStatusUpdate(item, 'ACCEPTED')}
            >
              <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => confirmStatusUpdate(item, 'REJECTED')}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'ACCEPTED' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.doneButton]}
              onPress={() => confirmStatusUpdate(item, 'DONE')}
            >
              <Ionicons name="checkmark-done-circle" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Mark as Done</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => confirmStatusUpdate(item, 'CANCELED')}
            >
              <Ionicons name="ban" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="calendar-outline" size={64} color={COLORS.textLight} />
      </View>
      <Text style={styles.emptyText}>No bookings found</Text>
      <Text style={styles.emptySubText}>
        {filter === 'all'
          ? 'You don\'t have any bookings yet'
          : `No ${filter.toLowerCase()} bookings`}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({bookings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, filter === 'PENDING' && styles.filterPillActive]}
          onPress={() => setFilter('PENDING')}
        >
          <Text style={[styles.filterText, filter === 'PENDING' && styles.filterTextActive]}>
            Pending ({bookings.filter((b) => b.status === 'PENDING').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, filter === 'ACCEPTED' && styles.filterPillActive]}
          onPress={() => setFilter('ACCEPTED')}
        >
          <Text style={[styles.filterText, filter === 'ACCEPTED' && styles.filterTextActive]}>
            Accepted ({bookings.filter((b) => b.status === 'ACCEPTED').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      <FlatList
        data={filteredBookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  refreshButton: {
    padding: SPACING.xs,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  listContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  patientName: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  timeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  contactInfo: {
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  contactText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  doneButton: {
    backgroundColor: '#8B5CF6',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
  },
  actionButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.white,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 4,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  emptyText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptySubText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
});
