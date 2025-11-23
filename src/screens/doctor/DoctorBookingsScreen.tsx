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

type Props = { navigation: NativeStackNavigationProp<any> };
type FilterType = 'all' | 'PENDING' | 'ACCEPTED' | 'DONE';

// STATUS_CONFIG will be created per-render using theme colors inside the component

const CACHE_KEY = 'doctor_bookings_cache';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const PAGE_SIZE = 15;
const DEBOUNCE_MS = 300;

// Debounce hook
const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
};

// Animated List Item
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
  
  // Request management
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  const pendingRequestsRef = useRef<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);
  const pageRef = useRef<number>(page);
  
  const modalAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  const styles = React.useMemo(() => createStyles(colors), [colors]);

  // Make status colors/theme available at runtime so design tokens can adapt
  const STATUS_CONFIG = React.useMemo(() => ({
    PENDING: { color: (colors as any).warning || '#F59E0B', bg: withOpacity((colors as any).warning || '#F59E0B', 0.12), icon: 'time' as const, label: t.pending },
    ACCEPTED: { color: (colors as any).success || '#10B981', bg: withOpacity((colors as any).success || '#10B981', 0.12), icon: 'checkmark-circle' as const, label: t.confirmed },
    REJECTED: { color: (colors as any).error || '#EF4444', bg: withOpacity((colors as any).error || '#EF4444', 0.12), icon: 'close-circle' as const, label: t.rejectBooking },
    // Use success for DONE so it contrasts with typical primary/blue themes
    DONE: { color: (colors as any).success || '#10B981', bg: withOpacity((colors as any).success || '#10B981', 0.12), icon: 'checkmark-done-circle' as const, label: t.completeBooking },
    CANCELED: { color: (colors as any).muted || '#6B7280', bg: withOpacity(colors.surface || '#F3F4F6', 0.06), icon: 'ban' as const, label: t.canceled },
  }), [colors, t]);

  const DEFAULT_STATUS_CFG = React.useMemo(() => ({
    color: colors.text,
    bg: colors.card,
    icon: 'time' as const,
    label: '',
  }), [colors]);

  // loadDoctorId moved above effects to satisfy hook/order constraints
  const loadDoctorId = useCallback(async () => {
    try {
      const id = await AsyncStorage.getItem('doctorId');
      if (id) setDoctorId(id);
      else Alert.alert(t.error, t.doctorIdNotFound, [{ text: t.ok, onPress: () => navigation.replace('DoctorLogin') }]);
    } catch (e) { logger.error(e); }
  }, [navigation, t]);

  // fetchBookings as stable callback so effects can depend on it
  // Stable fetchBookings: use refs to avoid re-creating the callback when `bookings` changes
  const fetchBookings = useCallback(async (reset = false) => {
    if (!doctorId) return;
    if (pendingRequestsRef.current.has('fetch')) return; // Prevent duplicate requests

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const currentPage = reset ? 1 : pageRef.current;

    try {
      // mark pending
      pendingRequestsRef.current.add('fetch');
      setPendingRequests(prev => { const n = new Set(prev); n.add('fetch'); return n; });

      if (reset) setLoading(prev => (prev && bookings.length === 0) ? true : false);
      else setLoadingMore(true);

      const data = await ApiService.getBookingsByDoctorId(doctorId, {
        page: currentPage,
        limit: PAGE_SIZE,
        signal: abortControllerRef.current.signal,
      });

      // Normalize known nullable fields and deduplicate: prefer server-returned items from `data`
      const normalized = data
        .map((b: BookingResponse) => ({
          ...b,
          nameUser: (b.nameUser ?? '').toString(),
          phoneNumberUser: (b.phoneNumberUser ?? '').toString(),
          appointmentTime: (b.appointmentTime ?? '').toString(),
        }))
        // filter out invalid entries with missing id or appointmentTime
        .filter((b: BookingResponse) => Boolean(b && b.id && b.appointmentTime));

      setBookings(prev => {
        if (reset) {
          const next = normalized;
          return next;
        }
        // merge: put newest server items first, then append older items that aren't in the new page
        const ids = new Set(normalized.map((b) => b.id));
        const merged = [...normalized, ...prev.filter((p) => !ids.has(p.id))];
        return merged;
      });

      // advance page
      const nextPage = currentPage + 1;
      setPage(nextPage);
      pageRef.current = nextPage;

      setHasMore(data.length === PAGE_SIZE);
      setLastUpdated(new Date());
      setIsOnline(true);

      // Cache the data when resetting
      if (reset) {
        // Use the latest bookings from state by reading after setBookings;
        // best-effort: save normalized results for the page when reset
        saveToCache(normalized);
      }

    } catch (e: any) {
      if (e?.name === 'AbortError') return; // Ignore aborted requests
      logger.error('Fetch error:', e);
      setIsOnline(false);
      // if we have no visible data, show an alert
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

  // Cancel pending requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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

  // Load cached data first for instant UI
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

  // Save to cache
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

  // Debounced load more
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
    Animated.spring(modalAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 9 }).start();
  }, [modalAnim]);

  const closeDetail = useCallback(() => {
    Animated.timing(modalAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setShowDetail(false);
      setSelectedBooking(null);
    });
  }, [modalAnim]);

  // Optimistic update with rollback
  const handleStatusUpdate = async (bookingId: string, newStatus: BookingStatus) => {
    if (pendingRequests.has(bookingId)) return; // Prevent duplicate
    
    const previousBookings = [...bookings];
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    closeDetail();
    
    // Optimistic update
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
    setPendingRequests(prev => new Set(prev).add(bookingId));

    try {
      await ApiService.updateBookingStatus(bookingId, newStatus);
      // Update cache
      saveToCache(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
    } catch {
      // Rollback on error
      setBookings(previousBookings);
      Alert.alert('Error', 'Failed to update. Please try again.');
    } finally {
      setPendingRequests(prev => { const n = new Set(prev); n.delete(bookingId); return n; });
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (pendingRequests.has(bookingId)) return;
    
    const previousBookings = [...bookings];
    closeDetail();
    
    // Optimistic delete
    setBookings(prev => prev.filter(b => b.id !== bookingId));
    setPendingRequests(prev => new Set(prev).add(bookingId));

    try {
      await ApiService.deleteBooking(bookingId);
      saveToCache(bookings.filter(b => b.id !== bookingId));
    } catch {
      // Rollback
      setBookings(previousBookings);
      Alert.alert('Error', 'Failed to delete. Please try again.');
    } finally {
      setPendingRequests(prev => { const n = new Set(prev); n.delete(bookingId); return n; });
    }
  };

  const callPatient = (phone: string) => Linking.openURL(`tel:${phone}`);

  // Memoized filtered data
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

  // Memoized card renderer
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
        <Pressable style={styles.overlay} onPress={closeDetail}>
          <Animated.View style={[styles.modal, { transform: [{ scale: modalAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }, { translateY: modalAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }], opacity: modalAnim }]}>
            <Pressable>
              <TouchableOpacity style={styles.modalClose} onPress={closeDetail}>
                <Ionicons name="close" size={ms(22)} color={colors.textSecondary} />
              </TouchableOpacity>

              <View style={styles.modalHeader}>
                <View style={[styles.modalAvatar, { backgroundColor: cfg.bg || colors.card }]}>
                  <Text style={[styles.modalAvatarText, { color: cfg.color || colors.text }]}>{selectedBooking.nameUser.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.modalName}>{selectedBooking.nameUser}</Text>
                <View style={[styles.modalStatus, { backgroundColor: cfg.bg || colors.card }]}>
                  <Ionicons name={cfg.icon ?? 'time'} size={ms(14)} color={cfg.color || colors.text} />
                  <Text style={[styles.modalStatusText, { color: cfg.color || colors.text }]}>{cfg.label || selectedBooking.status}</Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoCard}>
                  <View style={[styles.infoIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="calendar" size={ms(18)} color={colors.primary} />
                  </View>
                    <Text style={styles.infoLabel}>{t.date}</Text>
                    <Text style={styles.infoValue}>{date}</Text>
                </View>
                <View style={styles.infoCard}>
                  <View style={[styles.infoIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="time" size={ms(18)} color={colors.primary} />
                  </View>
                    <Text style={styles.infoLabel}>{t.time}</Text>
                    <Text style={styles.infoValue}>{time}</Text>
                </View>
              </View>

              <View style={styles.fullDateRow}>
                <Ionicons name="information-circle-outline" size={ms(16)} color={colors.textSecondary} />
                <Text style={styles.fullDateText}>{full}</Text>
              </View>

              <TouchableOpacity style={styles.callBtn} onPress={() => callPatient(selectedBooking.phoneNumberUser)} activeOpacity={0.8}>
                <Ionicons name="call" size={ms(18)} color={colors.primary} />
                <Text style={styles.callBtnText}>{selectedBooking.phoneNumberUser}</Text>
                <View style={styles.callBtnArrow}>
                  <Ionicons name="arrow-forward" size={ms(14)} color={colors.primary} />
                </View>
              </TouchableOpacity>

              {selectedBooking.status === 'PENDING' && (
                <View style={styles.actions}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B981' }]} onPress={() => handleStatusUpdate(selectedBooking.id, 'ACCEPTED')} activeOpacity={0.85} disabled={isUpdating}>
                    {isUpdating ? <ActivityIndicator color="#fff" size="small" /> : <><Ionicons name="checkmark-circle" size={ms(20)} color="#fff" /><Text style={styles.actionBtnText}>{t.confirm}</Text></>}
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EF4444' }]} onPress={() => handleStatusUpdate(selectedBooking.id, 'REJECTED')} activeOpacity={0.85} disabled={isUpdating}>
                    {isUpdating ? <ActivityIndicator color="#fff" size="small" /> : <><Ionicons name="close-circle" size={ms(20)} color="#fff" /><Text style={styles.actionBtnText}>{t.rejectBooking}</Text></>}
                  </TouchableOpacity>
                </View>
              )}

              {selectedBooking.status === 'ACCEPTED' && (
                <View style={styles.actions}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#6366F1' }]} onPress={() => handleStatusUpdate(selectedBooking.id, 'DONE')} activeOpacity={0.85} disabled={isUpdating}>
                    {isUpdating ? <ActivityIndicator color="#fff" size="small" /> : <><Ionicons name="checkmark-done-circle" size={ms(20)} color="#fff" /><Text style={styles.actionBtnText}>{t.completeBooking}</Text></>}
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#6B7280' }]} onPress={() => handleStatusUpdate(selectedBooking.id, 'CANCELED')} activeOpacity={0.85} disabled={isUpdating}>
                    {isUpdating ? <ActivityIndicator color="#fff" size="small" /> : <><Ionicons name="ban" size={ms(20)} color="#fff" /><Text style={styles.actionBtnText}>{t.cancel}</Text></>}
                  </TouchableOpacity>
                </View>
              )}

              {(selectedBooking.status === 'DONE' || selectedBooking.status === 'REJECTED' || selectedBooking.status === 'CANCELED') && (
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(selectedBooking.id)} activeOpacity={0.8} disabled={isUpdating}>
                  {isUpdating ? <ActivityIndicator color="#EF4444" size="small" /> : <><Ionicons name="trash-outline" size={ms(18)} color="#EF4444" /><Text style={styles.deleteBtnText}>{t.deleteRecord}</Text></>}
                </TouchableOpacity>
              )}
            </Pressable>
          </Animated.View>
        </Pressable>
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

      {/* Offline Banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={ms(16)} color="#fff" />
          <Text style={styles.offlineText}>{t.offlineCached}</Text>
        </View>
      )}

      {/* Header */}
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

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={[styles.statCount, { color: STATUS_CONFIG.PENDING?.color || colors.warning || '#F59E0B' }]}>{getCount('PENDING')}</Text>
          <Text style={styles.statLabel}>{t.pending}</Text>
        </View>
        <View style={styles.statDivider} />
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

      {/* Filters */}
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

      {/* List */}
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

  // Offline Banner
  offlineBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F59E0B', paddingVertical: SPACING.xs },
  offlineText: { color: '#fff', fontSize: FONT_SIZES.xs, fontWeight: '600' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: colors.card },
  headerBtn: { width: ms(42), height: ms(42), borderRadius: ms(21), justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: colors.text },
  headerSubtitle: { fontSize: FONT_SIZES.xs, color: colors.textSecondary, marginTop: 2 },

  // Stats Bar
  statsBar: { flexDirection: 'row', backgroundColor: colors.card, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  statItem: { flex: 1, alignItems: 'center' },
  statCount: { fontSize: ms(22), fontWeight: '700' },
  statLabel: { fontSize: FONT_SIZES.xs, color: colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },

  // Filters
  filters: { flexDirection: 'row', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.xs },
  filterBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.full, backgroundColor: colors.card },
  filterActive: { backgroundColor: colors.primary },
  filterText: { fontSize: FONT_SIZES.sm, color: colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: '#fff' },

  // List
  list: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xl * 2 },
  loadingMore: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: SPACING.md, gap: SPACING.sm },
  loadingMoreText: { fontSize: FONT_SIZES.sm, color: colors.textSecondary },

  // Card
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

  // Empty
  empty: { alignItems: 'center', paddingVertical: SPACING.xl * 2 },
  emptyIcon: { width: ms(72), height: ms(72), borderRadius: ms(36), backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: '600', color: colors.text },
  emptyText: { fontSize: FONT_SIZES.sm, color: colors.textSecondary, marginTop: 4 },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACING.lg },
  modal: { backgroundColor: colors.card, borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOWS.large },
  modalClose: { position: 'absolute', top: SPACING.sm, right: SPACING.sm, zIndex: 10, width: ms(36), height: ms(36), borderRadius: ms(18), backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  modalHeader: { alignItems: 'center', marginBottom: SPACING.lg, paddingTop: SPACING.sm },
  modalAvatar: { width: ms(64), height: ms(64), borderRadius: ms(32), justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  modalAvatarText: { fontSize: ms(26), fontWeight: '700' },
  modalName: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: colors.text, marginBottom: SPACING.xs },
  modalStatus: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full, gap: 6 },
  modalStatusText: { fontSize: FONT_SIZES.sm, fontWeight: '600' },

  // Info Grid
  infoGrid: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  infoCard: { flex: 1, backgroundColor: colors.background, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  infoIcon: { width: ms(40), height: ms(40), borderRadius: ms(20), justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xs },
  infoLabel: { fontSize: FONT_SIZES.xs, color: colors.textSecondary },
  infoValue: { fontSize: FONT_SIZES.base, fontWeight: '700', color: colors.text, marginTop: 2 },

  // Full Date
  fullDateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: SPACING.md },
  fullDateText: { fontSize: FONT_SIZES.xs, color: colors.textSecondary },

  // Call Button
  callBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: withOpacity(colors.primary, 0.08), padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md },
  callBtnText: { flex: 1, fontSize: FONT_SIZES.base, fontWeight: '600', color: colors.primary, marginLeft: SPACING.sm },
  callBtnArrow: { width: ms(28), height: ms(28), borderRadius: ms(14), backgroundColor: withOpacity(colors.primary, 0.12), justifyContent: 'center', alignItems: 'center' },

  // Actions
  actions: { flexDirection: 'row', gap: SPACING.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.md, borderRadius: RADIUS.md },
  actionBtnText: { color: '#fff', fontSize: FONT_SIZES.sm, fontWeight: '700' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.md, backgroundColor: '#FEF2F2', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#FECACA' },
  deleteBtnText: { color: '#EF4444', fontSize: FONT_SIZES.sm, fontWeight: '600' },
});

export default DoctorBookingsScreen;