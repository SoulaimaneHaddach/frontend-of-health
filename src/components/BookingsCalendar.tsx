// src/components/BookingsCalendar.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_SIZES, SPACING, RADIUS } from '../shared/constants/theme';
import { withOpacity } from '../shared/utils/themeUtils';
import { BookingResponse } from '../shared/types/booking';
import ApiService from '../services/api';
import { useTheme } from '../context/ThemeContext';
import logger from '../shared/utils/logger';
import { useLanguage } from '../context/LanguageContext';

interface BookingsCalendarProps {
  doctorId: string;
  colors?: any;
}

export const BookingsCalendar: React.FC<BookingsCalendarProps> = ({ doctorId, colors: colorsProp }) => {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const { colors } = useTheme();
  const { t } = useLanguage();
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchBookings = useCallback(async (reqId?: number, signal?: AbortSignal) => {
    try {
      setLoading(true);
      const data = await ApiService.getBookingsByDoctorId(doctorId, { page: 1, limit: 100, signal: signal as AbortSignal });

      // Normalize known fields and remove invalid entries
      const normalized = data
        .map((b) => ({
          ...b,
          id: b.id,
          nameUser: (b.nameUser ?? '').toString(),
          phoneNumberUser: (b.phoneNumberUser ?? '').toString(),
          appointmentTime: (b.appointmentTime ?? '').toString(),
        }))
        .filter((b) => Boolean(b && b.id && b.appointmentTime));

      // Deduplicate by id - keep the first occurrence from server (stable order)
      const seen = new Set<string>();
      const deduped: BookingResponse[] = [];
      for (const b of normalized) {
        if (!seen.has(b.id)) {
          seen.add(b.id);
          deduped.push(b);
        }
      }

      // Filter to only accepted/pending bookings in the future
      const futureBookings = deduped.filter((b) => {
        const appointmentDate = new Date(b.appointmentTime);
        return appointmentDate > new Date() && (b.status === 'ACCEPTED' || b.status === 'PENDING');
      });

      const sorted = futureBookings.sort((a, b) => new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime());

      // Only update state if component still mounted and this is the latest request
      if (mountedRef.current && (reqId === undefined || reqId === requestIdRef.current)) {
        setBookings(sorted);
      }
    } catch (error) {
      logger.error('Error fetching bookings:', error);
      if (mountedRef.current) setBookings([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    mountedRef.current = true;
    // increment request id so stale responses are ignored
    // cancel previous request
    if (abortControllerRef.current) {
      try { abortControllerRef.current.abort(); } catch {}
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    fetchBookings(currentRequestId, controller.signal);
    return () => {
      mountedRef.current = false;
      try { controller.abort(); } catch {}
    };
  }, [doctorId, fetchBookings]);

  

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
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }
  if (bookings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={32} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t.noUpcomingAppointments}</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {displayedBookings.map((booking) => {
        const { day, date, month, time } = formatDate(booking.appointmentTime);
        const isAccepted = booking.status === 'ACCEPTED';
        return (
          <View
            key={booking.id}
            style={[
              styles.bookingItem,
              { backgroundColor: colorsProp?.card || colors.card }
            ]}
          >
            <View style={[
              styles.dateBox,
              { backgroundColor: isAccepted ? withOpacity((colors as any).success || '#10B981', 0.08) : withOpacity((colors as any).warning || '#F59E0B', 0.08) }
            ]}>
              <Text style={[styles.dayText, { color: isAccepted ? (colors as any).success || '#10B981' : (colors as any).warning || '#F59E0B' }]}>
                {day}
              </Text>
              <Text style={[styles.dateText, { color: isAccepted ? (colors as any).success || '#10B981' : (colors as any).warning || '#F59E0B' }]}>
                {date}
              </Text>
              <Text style={[styles.monthText, { color: isAccepted ? (colors as any).success || '#10B981' : (colors as any).warning || '#F59E0B' }]}>
                {month}
              </Text>
            </View>
            <View style={styles.bookingDetails}>
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.timeText, { color: colors.textSecondary }]}>{time}</Text>
              </View>
              <Text style={[styles.patientName, { color: colors.text }]} numberOfLines={1}>{booking.nameUser}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: isAccepted ? withOpacity((colors as any).success || '#10B981', 0.12) : withOpacity((colors as any).warning || '#F59E0B', 0.12) }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: isAccepted ? (colors as any).success || '#10B981' : (colors as any).warning || '#F59E0B' }
                ]}>
                  {isAccepted ? t.confirmed : t.pending}
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
          <Text style={[styles.showMoreText, { color: colors.primary }]}> 
            {showAll ? t.showLess : t.showMore.replace('{count}', String(bookings.length - 3))}
          </Text>
          <Ionicons
            name={showAll ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.primary}
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
  },
  patientName: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
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
  },
});
