// src/screens/doctor/DoctorBookingsScreen.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Animated,
  Modal,
  Pressable,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestQueueService } from '../../shared/services/requestQueueService';
import { FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../shared/constants/theme';
import { withOpacity } from '../../shared/utils/themeUtils';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { ms } from '../../shared/constants/responsive';
import { BookingResponse, BookingStatus } from '../../shared/types/booking';
import ApiService from '../../services/api';
import logger from '../../shared/utils/logger';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type Props = { navigation: NativeStackNavigationProp<any> };
type FilterType = 'all' | 'PENDING' | 'ACCEPTED' | 'DONE';

const CACHE_KEY = 'doctor_bookings_cache';
const CACHE_DURATION = 2 * 60 * 1000;
const PAGE_SIZE = 15;
const DEBOUNCE_MS = 300;

const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
};

const AnimatedCard = React.memo(({ children, index }: { children: React.ReactNode; index: number }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 300, delay: Math.min(index * 50, 300), useNativeDriver: true }).start();
  }, [anim, index]);
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }] }}>
      {children}
    </Animated.View>
  );
});

export const DoctorBookingsScreen: React.FC<Props> = ({ navigation }) => {
  const { isDarkMode, colors } = useTheme();
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingResponse | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  const pendingRequestsRef = useRef<Set<string>>(new Set());
  const bookingsRef = useRef<BookingResponse[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pageRef = useRef<number>(page);
  
  const modalSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const STATUS_CONFIG = React.useMemo(() => ({
    PENDING: { color: (colors as any).warning || '#F59E0B', bg: withOpacity((colors as any).warning || '#F59E0B', 0.12), icon: 'time' as const, label: t.pending },
    ACCEPTED: { color: (colors as any).success || '#10B981', bg: withOpacity((colors as any).success || '#10B981', 0.12), icon: 'checkmark-circle' as const, label: t.confirmed },
    REJECTED: { color: (colors as any).error || '#EF4444', bg: withOpacity((colors as any).error || '#EF4444', 0.12), icon: 'close-circle' as const, label: t.rejectBooking },
    DONE: { color: (colors as any).success || '#10B981', bg: withOpacity((colors as any).success || '#10B981', 0.12), icon: 'checkmark-done-circle' as const, label: t.completeBooking },
    CANCELED: { color: (colors as any).muted || '#6B7280', bg: withOpacity(colors.surface || '#F3F4F6', 0.06), icon: 'ban' as const, label: t.canceled },
  }), [colors, t]);

  const DEFAULT_STATUS_CFG = React.useMemo(() => ({
    color: colors.text,
    bg: colors.card,
    icon: 'time' as const,
    label: '',
  }), [colors]);

  const loadDoctorId = useCallback(async () => {
    try {
      const id = await AsyncStorage.getItem('doctorId');
      if (id) setDoctorId(id);
      else Alert.alert(t.error, t.doctorIdNotFound, [{ text: t.ok, onPress: () => navigation.replace('DoctorLogin') }]);
    } catch (e) { logger.error(e); }
  }, [navigation, t]);

  const fetchBookings = useCallback(async (reset = false) => {
    if (!doctorId) return;
    if (pendingRequestsRef.current.has('fetch')) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const currentPage = reset ? 1 : pageRef.current;

    try {
      pendingRequestsRef.current.add('fetch');
      setPendingRequests(prev => { const n = new Set(prev); n.add('fetch'); return n; });

      if (reset) setLoading(prev => (prev && bookings.length === 0) ? true : false);
      else setLoadingMore(true);

      const data = await ApiService.getBookingsByDoctorId(doctorId, {
        page: currentPage,
        limit: PAGE_SIZE,
        signal: abortControllerRef.current.signal,
      });

      const normalized = data
        .map((b: BookingResponse) => ({
          ...b,
          nameUser: (b.nameUser ?? '').toString(),
          phoneNumberUser: (b.phoneNumberUser ?? '').toString(),
          appointmentTime: (b.appointmentTime ?? '').toString(),
        }))
        .filter((b: BookingResponse) => Boolean(b && b.id && b.appointmentTime));

      setBookings(prev => {
        if (reset) {
          return normalized;
        }
        const ids = new Set(normalized.map((b) => b.id));
        const merged = [...normalized, ...prev.filter((p) => !ids.has(p.id))];
        return merged;
      });

      const nextPage = currentPage + 1;
      setPage(nextPage);
      pageRef.current = nextPage;

      setHasMore(data.length === PAGE_SIZE);
      setLastUpdated(new Date());
      setIsOnline(true);

      if (reset) {
        saveToCache(normalized);
      }

    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      logger.error('Fetch error:', e);
      setIsOnline(false);
      setBookings(prev => {
        if (prev.length === 0) {
          Alert.alert(t.error, t.failedLoadAppointments);
        }
        return prev;
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
      pendingRequestsRef.current.delete('fetch');
      setPendingRequests(prev => { const n = new Set(prev); n.delete('fetch'); return n; });
    }
  }, [doctorId, t, bookings.length]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // keep a mutable ref of the latest bookings to avoid stale closures
  useEffect(() => {
    bookingsRef.current = bookings;
  }, [bookings]);

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    loadDoctorId();
  }, [loadDoctorId, headerAnim]);

  useEffect(() => { 
    if (doctorId) {
      loadCachedData();
      fetchBookings(true);
    }
  }, [doctorId, fetchBookings]);

  useEffect(() => {
    const unsubscribe = requestQueueService.addListener('requestCompleted', (_payload: any) => {
      try {
        const { request, response } = _payload || {};
        if (!request || !response) return;
        if (typeof request.url === 'string' && request.url.includes('/bookings') && (request.method || '').toUpperCase() === 'POST') {
          const clientLocalId = request.body?.clientLocalId;
          if (!clientLocalId) return;
          const placeholderId = `pending-${clientLocalId}`;
          setBookings((prev) => {
            let replaced = false;
            const next = prev.map((b) => { if (b.id === placeholderId) { replaced = true; return response as BookingResponse; } return b; });
            if (!replaced) return [response as BookingResponse, ...prev];
            return next;
          });
        }
      } catch (e) { logger.warn('Error reconciling:', e); }
    });
    return () => { try { if (typeof unsubscribe === 'function') unsubscribe(); } catch {} };
  }, []);

  const loadCachedData = async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        if (age < CACHE_DURATION) {
          setBookings(data);
          setLastUpdated(new Date(timestamp));
          setLoading(false);
        }
      }
    } catch (e) { logger.warn('Cache load error:', e); }
  };

  const saveToCache = async (data: BookingResponse[]) => {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) { logger.warn('Cache save error:', e); }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    await fetchBookings(true);
    setRefreshing(false);
  };

  const loadMore = useDebounce(() => {
    if (!loadingMore && hasMore && !loading) {
      fetchBookings(false);
    }
  }, DEBOUNCE_MS);

  const handleEndReached = () => {
    if (hasMore && !loadingMore && !loading) {
      loadMore();
    }
  };

  const openDetail = useCallback((booking: BookingResponse) => {
    setSelectedBooking(booking);
    setShowDetail(true);
    Animated.parallel([
      Animated.timing(modalOpacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(modalSlideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 })
    ]).start();
  }, [modalSlideAnim, modalOpacityAnim]);

  const closeDetail = useCallback(() => {
    Animated.parallel([
      Animated.timing(modalOpacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(modalSlideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true })
    ]).start(() => {
      setShowDetail(false);
      setSelectedBooking(null);
    });
  }, [modalSlideAnim, modalOpacityAnim]);

  const handleStatusUpdate = async (bookingId: string, newStatus: BookingStatus) => {
    if (pendingRequests.has(bookingId)) return;
    
    const previousBookings = [...bookingsRef.current];
    const booking = bookingsRef.current.find(b => b.id === bookingId);
    if (!booking) return;

    // Prepare the updated bookings array from the latest ref to avoid stale closures
    const updatedBookings = bookingsRef.current.map(b => b.id === bookingId ? { ...b, status: newStatus } : b);

    closeDetail();

    // Apply optimistic UI update
    setBookings(updatedBookings);
    setPendingRequests(prev => { const n = new Set(prev); n.add(bookingId); return n; });

    try {
      await ApiService.updateBookingStatus(bookingId, newStatus);
      // Save the exact updated array we rendered to cache
      saveToCache(updatedBookings);
    } catch (err) {
      // Rollback optimistic update on failure
      setBookings(previousBookings);
      Alert.alert(t.error || 'Error', t.bookingFailed || 'Failed to update. Please try again.');
      logger.error('Update booking status failed', err);
    } finally {
      setPendingRequests(prev => { const n = new Set(prev); n.delete(bookingId); return n; });
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (pendingRequests.has(bookingId)) return;
    
    const previousBookings = [...bookings];
    closeDetail();
    
    setBookings(prev => prev.filter(b => b.id !== bookingId));
    setPendingRequests(prev => new Set(prev).add(bookingId));

    try {
      await ApiService.deleteBooking(bookingId);
      saveToCache(bookings.filter(b => b.id !== bookingId));
    } catch {
      setBookings(previousBookings);
      Alert.alert('Error', 'Failed to delete. Please try again.');
    } finally {
      setPendingRequests(prev => { const n = new Set(prev); n.delete(bookingId); return n; });
    }
  };

  const callPatient = (phone: string) => Linking.openURL(`tel:${phone}`);

  const filteredBookings = React.useMemo(() => {
    return filter === 'all' ? bookings : bookings.filter(b => b.status === filter);
  }, [bookings, filter]);

  const getCount = useCallback((s: BookingStatus) => bookings.filter(b => b.status === s).length, [bookings]);
  
  const getTodayCount = useCallback(() => {
    const today = new Date().toDateString();
    return bookings.filter(b => new Date(b.appointmentTime).toDateString() === today).length;
  }, [bookings]);

  const formatDate = useCallback((iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (d.toDateString() === today.toDateString()) dateStr = t.today;
    else if (d.toDateString() === tomorrow.toDateString()) dateStr = t.tomorrow;
    
    return { date: dateStr, time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), full: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) };
  }, [t]);

  const renderCard = useCallback(({ item, index }: { item: BookingResponse; index: number }) => {
    const { date, time } = formatDate(item.appointmentTime);
    const cfg = STATUS_CONFIG[item.status] ?? DEFAULT_STATUS_CFG;
    const isPending = item.status === 'PENDING';
    const isUpdating = pendingRequests.has(item.id);

    return (
      <AnimatedCard index={index}>
        <TouchableOpacity 
          style={[styles.card, isPending && styles.cardPending, isUpdating && styles.cardUpdating]} 
          activeOpacity={0.7} 
          onPress={() => openDetail(item)}
          disabled={isUpdating}
        >
          <View style={[styles.cardAccent, { backgroundColor: cfg.color || colors.primary }]} />
          
          <View style={styles.cardContent}>
            <View style={styles.cardTop}>
              <View style={styles.patientRow}>
                <View style={[styles.avatar, { backgroundColor: cfg.bg || colors.card }]}>
                  <Text style={[styles.avatarText, { color: cfg.color || colors.text }]}>{item.nameUser.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName} numberOfLines={1}>{item.nameUser}</Text>
                  <View style={styles.phoneRow}>
                    <Ionicons name="call-outline" size={ms(12)} color={colors.textSecondary} />
                    <Text style={styles.phoneText}>{item.phoneNumberUser}</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: cfg.bg || colors.card }]}>
                {isUpdating ? (
                  <ActivityIndicator size="small" color={cfg.color} />
                ) : (
                  <>
                    <Ionicons name={cfg.icon ?? 'time'} size={ms(14)} color={cfg.color || colors.text} />
                    <Text style={[styles.statusText, { color: cfg.color || colors.text }]}>{cfg.label || item.status}</Text>
                  </>
                )}
              </View>
            </View>

            <View style={styles.cardBottom}>
              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeItem}>
                  <Ionicons name="calendar-outline" size={ms(14)} color={colors.primary} />
                  <Text style={styles.dateTimeText}>{date}</Text>
                </View>
                <View style={styles.dateTimeDivider} />
                <View style={styles.dateTimeItem}>
                  <Ionicons name="time-outline" size={ms(14)} color={colors.primary} />
                  <Text style={styles.dateTimeText}>{time}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={ms(18)} color={colors.textSecondary} />
            </View>
          </View>
        </TouchableOpacity>
      </AnimatedCard>
    );
  }, [colors, formatDate, pendingRequests, styles, STATUS_CONFIG, DEFAULT_STATUS_CFG, openDetail]);

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingMoreText}>{t.loadingMore}</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="calendar-outline" size={ms(40)} color={colors.textSecondary} />
      </View>
      <Text style={styles.emptyTitle}>{t.noBookings}</Text>
      <Text style={styles.emptyText}>
        {filter === 'all' ? t.scheduleClear : t.noAppointmentsFiltered.replace('{type}', filter.toLowerCase())}
      </Text>
    </View>
  );

  const renderDetailModal = () => {
    if (!selectedBooking) return null;
    const { date, time, full } = formatDate(selectedBooking.appointmentTime);
    const cfg = STATUS_CONFIG[selectedBooking.status] ?? DEFAULT_STATUS_CFG;
    const isUpdating = pendingRequests.has(selectedBooking.id);

    return (
      <Modal visible={showDetail} transparent animationType="none" onRequestClose={closeDetail}>
        <Animated.View style={[styles.modalOverlay, { opacity: modalOpacityAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDetail} />
        </Animated.View>

        <Animated.View 
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: modalSlideAnim }]
            }
          ]}
        >
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          {/* Header with Status */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerTop}>
              <Text style={styles.sheetTitle}>Appointment Details</Text>
              <TouchableOpacity onPress={closeDetail} style={styles.closeBtn}>
                <Ionicons name="close" size={ms(24)} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
              <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>

          {/* Patient Info Card */}
          <View style={styles.patientCard}>
            <View style={[styles.patientAvatar, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.patientAvatarText, { color: cfg.color }]}>
                {selectedBooking.nameUser.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.patientDetails}>
              <Text style={styles.patientCardName}>{selectedBooking.nameUser}</Text>
              <TouchableOpacity 
                style={styles.phoneButton} 
                onPress={() => callPatient(selectedBooking.phoneNumberUser)}
                activeOpacity={0.7}
              >
                <Ionicons name="call" size={ms(16)} color={colors.primary} />
                <Text style={styles.phoneButtonText}>{selectedBooking.phoneNumberUser}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date & Time Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <View style={[styles.detailIconBox, { backgroundColor: withOpacity(colors.primary, 0.1) }]}>
                <Ionicons name="calendar" size={ms(20)} color={colors.primary} />
              </View>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{date}</Text>
            </View>

            <View style={styles.detailCard}>
              <View style={[styles.detailIconBox, { backgroundColor: withOpacity(colors.primary, 0.1) }]}>
                <Ionicons name="time" size={ms(20)} color={colors.primary} />
              </View>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{time}</Text>
            </View>
          </View>

          <View style={styles.fullDateContainer}>
            <Ionicons name="information-circle" size={ms(16)} color={colors.textSecondary} />
            <Text style={styles.fullDateLabel}>{full}</Text>
          </View>

          {/* Action Buttons */}
          {selectedBooking.status === 'PENDING' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.primaryActionBtn, { backgroundColor: '#10B981' }]}
                onPress={() => handleStatusUpdate(selectedBooking.id, 'ACCEPTED')}
                disabled={isUpdating}
                activeOpacity={0.8}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={ms(22)} color="#fff" />
                    <Text style={styles.primaryActionText}>Accept</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.secondaryActionBtn, { borderColor: '#EF4444' }]}
                onPress={() => handleStatusUpdate(selectedBooking.id, 'REJECTED')}
                disabled={isUpdating}
                activeOpacity={0.8}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#EF4444" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={ms(22)} color="#EF4444" />
                    <Text style={[styles.secondaryActionText, { color: '#EF4444' }]}>Reject</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {selectedBooking.status === 'ACCEPTED' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
                onPress={() => handleStatusUpdate(selectedBooking.id, 'DONE')}
                disabled={isUpdating}
                activeOpacity={0.8}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done-circle" size={ms(22)} color="#fff" />
                    <Text style={styles.primaryActionText}>Complete</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.secondaryActionBtn, { borderColor: colors.textSecondary }]}
                onPress={() => handleStatusUpdate(selectedBooking.id, 'CANCELED')}
                disabled={isUpdating}
                activeOpacity={0.8}
              >
                {isUpdating ? (
                  <ActivityIndicator color={colors.textSecondary} />
                ) : (
                  <>
                    <Ionicons name="ban" size={ms(22)} color={colors.textSecondary} />
                    <Text style={[styles.secondaryActionText, { color: colors.textSecondary }]}>Cancel</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {(selectedBooking.status === 'DONE' || selectedBooking.status === 'REJECTED' || selectedBooking.status === 'CANCELED') && (
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDelete(selectedBooking.id)}
              disabled={isUpdating}
              activeOpacity={0.8}
            >
              {isUpdating ? (
                <ActivityIndicator color="#EF4444" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={ms(20)} color="#EF4444" />
                  <Text style={styles.deleteButtonText}>Delete Record</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </Animated.View>
      </Modal>
    );
  };

  if (loading && bookings.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t.loadingAppointments}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={ms(16)} color="#fff" />
          <Text style={styles.offlineText}>{t.offlineCached}</Text>
        </View>
      )}

      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={ms(22)} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t.myBookings}</Text>
          <Text style={styles.headerSubtitle}>
            {lastUpdated ? t.updated.replace('{time}', lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })) : t.patients.replace('{count}', String(bookings.length))}
          </Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.headerBtn} activeOpacity={0.7} disabled={refreshing}>
          {refreshing ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="refresh" size={ms(22)} color={colors.primary} />}
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={[styles.statCount, { color: colors.primary }]}>{getTodayCount()}</Text>
          <Text style={styles.statLabel}>{t.today}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statCount, { color: STATUS_CONFIG.DONE?.color || colors.primary || '#6366F1' }]}>{getCount('DONE')}</Text>
          <Text style={styles.statLabel}>{t.completeBooking}</Text>
        </View>
      </View>

      <View style={styles.filters}>
        {[
          { key: 'all', label: t.all },
          { key: 'PENDING', label: t.pending },
          { key: 'ACCEPTED', label: t.confirmed },
          { key: 'DONE', label: t.completeBooking },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterActive]}
            onPress={() => setFilter(f.key as FilterType)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredBookings}
        renderItem={renderCard}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
        getItemLayout={(_, index) => ({ length: ms(110), offset: ms(110) * index, index })}
      />

      {renderDetailModal()}
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  loadingText: { color: colors.textSecondary, fontSize: FONT_SIZES.sm },

  offlineBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F59E0B', paddingVertical: SPACING.xs },
  offlineText: { color: '#fff', fontSize: FONT_SIZES.xs, fontWeight: '600' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: colors.card },
  headerBtn: { width: ms(42), height: ms(42), borderRadius: ms(21), justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: colors.text },
  headerSubtitle: { fontSize: FONT_SIZES.xs, color: colors.textSecondary, marginTop: 2 },

  statsBar: { flexDirection: 'row', backgroundColor: colors.card, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  statItem: { flex: 1, alignItems: 'center' },
  statCount: { fontSize: ms(22), fontWeight: '700' },
  statLabel: { fontSize: FONT_SIZES.xs, color: colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },

  filters: { flexDirection: 'row', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.xs },
  filterBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.full, backgroundColor: colors.card },
  filterActive: { backgroundColor: colors.primary },
  filterText: { fontSize: FONT_SIZES.sm, color: colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: '#fff' },

  list: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xl * 2 },
  loadingMore: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: SPACING.md, gap: SPACING.sm },
  loadingMoreText: { fontSize: FONT_SIZES.sm, color: colors.textSecondary },

  card: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: RADIUS.lg, overflow: 'hidden', ...SHADOWS.small },
  cardPending: { borderWidth: 1, borderColor: withOpacity(colors.warning || '#F59E0B', 0.3) },
  cardUpdating: { opacity: 0.7 },
  cardAccent: { width: 4 },
  cardContent: { flex: 1, padding: SPACING.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  patientRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: ms(42), height: ms(42), borderRadius: ms(21), justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: FONT_SIZES.lg, fontWeight: '700' },
  patientInfo: { marginLeft: SPACING.sm, flex: 1 },
  patientName: { fontSize: FONT_SIZES.base, fontWeight: '600', color: colors.text },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  phoneText: { fontSize: FONT_SIZES.xs, color: colors.textSecondary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full, gap: 4, minWidth: ms(80), justifyContent: 'center' },
  statusText: { fontSize: FONT_SIZES.xs, fontWeight: '600' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: withOpacity(colors.border, 0.5) },
  dateTimeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  dateTimeItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateTimeText: { fontSize: FONT_SIZES.sm, color: colors.text, fontWeight: '500' },
  dateTimeDivider: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.border },

  empty: { alignItems: 'center', paddingVertical: SPACING.xl * 2 },
  emptyIcon: { width: ms(72), height: ms(72), borderRadius: ms(36), backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: '600', color: colors.text },
  emptyText: { fontSize: FONT_SIZES.sm, color: colors.textSecondary, marginTop: 4 },

  // REDESIGNED BOTTOM SHEET MODAL
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: ms(28),
    borderTopRightRadius: ms(28),
    paddingBottom: SPACING.xl,
    ...SHADOWS.large,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  handleBar: {
    width: ms(40),
    height: ms(4),
    backgroundColor: colors.border,
    borderRadius: ms(2),
    alignSelf: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sheetHeader: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sheetTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: colors.text,
  },
  closeBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  statusDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
  },
  statusPillText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  patientAvatar: {
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientAvatarText: {
    fontSize: ms(24),
    fontWeight: '700',
  },
  patientDetails: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  patientCardName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: SPACING.xs,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  phoneButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: colors.primary,
  },
  detailsGrid: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  detailCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
  },
  detailIconBox: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  detailLabel: {
    fontSize: FONT_SIZES.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: colors.text,
  },
  fullDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  fullDateLabel: {
    fontSize: FONT_SIZES.xs,
    color: colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.lg,
    ...SHADOWS.small,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.lg,
    backgroundColor: colors.background,
    borderWidth: 2,
  },
  secondaryActionText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.lg,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
  },
});

export default DoctorBookingsScreen;