// src/components/BookingsCalendar.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../shared/constants/theme';
import { BookingResponse } from '../shared/types/booking';
import ApiService from '../services/api';

interface BookingsCalendarProps {
  doctorId: string;
  colors?: any;
}

export const BookingsCalendar: React.FC<BookingsCalendarProps> = ({ doctorId, colors }) => {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [doctorId]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getBookingsByDoctorId(doctorId);
      // Filter to only accepted/pending bookings in the future
      const futureBookings = data.filter(b => {
        const appointmentDate = new Date(b.appointmentTime);
        return appointmentDate > new Date() && (b.status === 'ACCEPTED' || b.status === 'PENDING');
      });
      setBookings(futureBookings.sort((a, b) => 
        new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime()
      ));
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const displayedBookings = showAll ? bookings : bookings.slice(0, 3);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }
  if (bookings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={32} color={COLORS.textLight} />
        <Text style={styles.emptyText}>No upcoming appointments</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {displayedBookings.map((booking, index) => {
        const { day, date, month, time } = formatDate(booking.appointmentTime);
        const isAccepted = booking.status === 'ACCEPTED';
        return (
          <View
            key={booking.id}
            style={[
              styles.bookingItem,
              { backgroundColor: colors?.card || COLORS.white }
            ]}
          >
            <View style={[
              styles.dateBox,
              { backgroundColor: isAccepted ? '#10B981' + '15' : '#F59E0B' + '15' }
            ]}>
              <Text style={[styles.dayText, { color: isAccepted ? '#10B981' : '#F59E0B' }]}>
                {day}
              </Text>
              <Text style={[styles.dateText, { color: isAccepted ? '#10B981' : '#F59E0B' }]}>
                {date}
              </Text>
              <Text style={[styles.monthText, { color: isAccepted ? '#10B981' : '#F59E0B' }]}>
                {month}
              </Text>
            </View>
            <View style={styles.bookingDetails}>
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.timeText}>{time}</Text>
              </View>
              <Text style={styles.patientName} numberOfLines={1}>{booking.nameUser}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: isAccepted ? '#10B981' + '20' : '#F59E0B' + '20' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: isAccepted ? '#10B981' : '#F59E0B' }
                ]}>
                  {isAccepted ? 'Confirmed' : 'Pending'}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
      {bookings.length > 3 && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={() => setShowAll(!showAll)}
        >
          <Text style={styles.showMoreText}>
            {showAll ? 'Show Less' : `Show ${bookings.length - 3} More`}
          </Text>
          <Ionicons
            name={showAll ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.md,
  },
  dateBox: {
    width: 60,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  dayText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  dateText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
  },
  monthText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  bookingDetails: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  timeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  patientName: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: SPACING.sm,
  },
  showMoreText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
