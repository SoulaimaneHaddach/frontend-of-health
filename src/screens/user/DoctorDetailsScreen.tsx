// src/screens/user/DoctorDetailsScreen.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  StatusBar,
  Share,
  Animated,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import {
  COLORS,
  FONT_SIZES,
  SPACING,
  RADIUS,
} from "../../constants/theme";
import { DoctorResponseDto } from "../../types";
import { BookingModal } from "../../components/BookingModal";

type DoctorDetailsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: {
    params: {
      doctor: DoctorResponseDto;
    };
  };
};

export const DoctorDetailsScreen: React.FC<DoctorDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const { doctor } = route.params;
  const { isDarkMode, colors } = useTheme();
  const [scrollY] = useState(new Animated.Value(0));
  const [isScrolled, setIsScrolled] = useState(false);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);

  const handleCall = useCallback(() => {
    if (doctor.phoneNumber) {
      Alert.alert(
        "Call Doctor",
        `Call Dr. ${doctor.name}?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Call", onPress: () => Linking.openURL(`tel:${doctor.phoneNumber}`) }
        ]
      );
    }
  }, [doctor.phoneNumber, doctor.name]);

  const handleEmail = useCallback(() => {
    if (doctor.email) {
      Linking.openURL(`mailto:${doctor.email}`);
    }
  }, [doctor.email]);

  const handleDirections = useCallback(() => {
    if (doctor.location?.latitude && doctor.location?.longitude) {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${doctor.location.latitude},${doctor.location.longitude}`
      );
    }
  }, [doctor.location]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out Dr. ${doctor.name} - ${doctor.specialization}\n${doctor.phoneNumber ? `Phone: ${doctor.phoneNumber}` : ''}${doctor.email ? `\nEmail: ${doctor.email}` : ''}`,
        title: `Dr. ${doctor.name}`,
      });
    } catch (error) {
      console.log(error);
    }
  }, [doctor.name, doctor.specialization, doctor.phoneNumber, doctor.email]);

  const quickActions = useMemo(() => [
    { 
      icon: "call" as const, 
      label: "Call",
      color: "#10B981", 
      onPress: handleCall,
      available: !!doctor.phoneNumber 
    },
    { 
      icon: "mail" as const,
      label: "Email", 
      color: "#3B82F6", 
      onPress: handleEmail,
      available: !!doctor.email 
    },
    { 
      icon: "navigate" as const,
      label: "Navigate", 
      color: "#EF4444", 
      onPress: handleDirections,
      available: !!(doctor.location?.latitude && doctor.location?.longitude)
    },
    { 
      icon: "share-social" as const,
      label: "Share", 
      color: "#F59E0B", 
      onPress: handleShare,
      available: true 
    },
  ].filter(action => action.available), [handleCall, handleEmail, handleDirections, handleShare, doctor]);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const fixedButtonsOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor="transparent"
        translucent
      />

      {/* Fixed Back/Share Buttons */}
      <Animated.View style={[
        styles.fixedHeader,
        { opacity: fixedButtonsOpacity }
      ]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          activeOpacity={0.6}
          style={[styles.headerBtn, { backgroundColor: colors.card + 'DD' }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={handleShare}
          activeOpacity={0.6}
          style={[styles.headerBtn, { backgroundColor: colors.card + 'DD' }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="share-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { 
            useNativeDriver: true,
            listener: (event: any) => {
              const offsetY = event.nativeEvent.contentOffset.y;
              setIsScrolled(offsetY > 50);
            }
          }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatarCircle, { 
            backgroundColor: colors.primary + '20',
            borderWidth: 3,
            borderColor: colors.primary + '30',
          }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {doctor.name.charAt(0)}
            </Text>
          </View>
          
          <Text style={[styles.doctorName, { color: colors.text }]}>
            Dr. {doctor.name}
          </Text>
          
          <View style={[styles.chip, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="medical" size={14} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.chipText, { color: colors.primary }]}>
              {doctor.specialization}
            </Text>
          </View>
        </View>

        {/* Quick Actions with Labels */}
        <View style={styles.actionsContainer}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionWrapper}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.actionPill, { backgroundColor: action.color + '15' }]}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* About */}
        {doctor.about && (
          <View style={styles.contentSection}>
            <Text style={[styles.miniTitle, { color: colors.textSecondary }]}>ABOUT</Text>
            <Text style={[styles.bodyText, { color: colors.text }]}>
              {doctor.about}
            </Text>
          </View>
        )}

        {/* Contact Info */}
        <View style={styles.contentSection}>
          <Text style={[styles.miniTitle, { color: colors.textSecondary }]}>CONTACT</Text>
          
          {doctor.phoneNumber && (
            <TouchableOpacity 
              style={[styles.compactCard, { backgroundColor: colors.card }]}
              onPress={handleCall}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#10B981' + '15' }]}>
                <Ionicons name="call" size={18} color="#10B981" />
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Phone</Text>
                <Text style={[styles.cardValue, { color: colors.text }]}>{doctor.phoneNumber}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          
          {doctor.email && (
            <TouchableOpacity 
              style={[styles.compactCard, { backgroundColor: colors.card }]}
              onPress={handleEmail}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#3B82F6' + '15' }]}>
                <Ionicons name="mail" size={18} color="#3B82F6" />
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Email</Text>
                <Text style={[styles.cardValue, { color: colors.text }]} numberOfLines={1}>
                  {doctor.email}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          
          {doctor.location?.address && (
            <TouchableOpacity 
              style={[styles.compactCard, { backgroundColor: colors.card }]}
              onPress={handleDirections}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#EF4444' + '15' }]}>
                <Ionicons name="location" size={18} color="#EF4444" />
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Location</Text>
                <Text style={[styles.cardValue, { color: colors.text }]} numberOfLines={1}>
                  {doctor.location.address}
                </Text>
              </View>
              <Ionicons name="navigate" size={18} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>

        {/* Working Hours */}
        {doctor.hours && Array.isArray(doctor.hours) && doctor.hours.length > 0 && (
          <View style={styles.contentSection}>
            <Text style={[styles.miniTitle, { color: colors.textSecondary }]}>HOURS</Text>
            <View style={[styles.hoursGrid, { backgroundColor: colors.card }]}>
              {doctor.hours.map((hour, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  <HourItem 
                    day={hour.day} 
                    time={hour.isClosed ? "Closed" : `${hour.openTime} - ${hour.closeTime}`}
                    colors={colors} 
                    isClosed={hour.isClosed}
                  />
                </React.Fragment>
              ))}
            </View>
          </View>
        )}

        {/* Services */}
        {doctor.services && Array.isArray(doctor.services) && doctor.services.length > 0 && (
          <View style={styles.contentSection}>
            <Text style={[styles.miniTitle, { color: colors.textSecondary }]}>SERVICES</Text>
            <View style={[styles.servicesList, { backgroundColor: colors.card }]}>
              {doctor.services.map((service, index) => (
                <ServiceTag key={index} text={service} colors={colors} />
              ))}
            </View>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Booking Modal */}
      <BookingModal
        visible={bookingModalVisible}
        doctor={doctor}
        onClose={() => setBookingModalVisible(false)}
      />

      {/* Book Appointment FAB */}
      <TouchableOpacity 
        style={[styles.bookFab, { 
          backgroundColor: COLORS.success || '#10B981',
          shadowColor: COLORS.success || '#10B981',
        }]} 
        onPress={() => setBookingModalVisible(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="calendar" size={24} color={COLORS.white} />
        <Text style={styles.bookFabText}>Book</Text>
      </TouchableOpacity>

      {/* Call FAB (secondary action, smaller) */}
      {doctor.phoneNumber && (
        <TouchableOpacity 
          style={[styles.fab, { 
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          }]} 
          onPress={handleCall}
          activeOpacity={0.85}
        >
          <Ionicons name="call" size={24} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

// Hour Item
const HourItem = React.memo<{
  day: string;
  time: string;
  colors: any;
  isClosed?: boolean;
}>(({ day, time, colors, isClosed }) => (
  <View style={styles.hourItem}>
    <Text style={[styles.hourDay, { color: colors.text }]}>{day}</Text>
    <Text style={[styles.hourTime, { 
      color: isClosed ? colors.error : colors.primary,
      fontWeight: '600'
    }]}>
      {time}
    </Text>
  </View>
));

// Service Tag
const ServiceTag = React.memo<{
  text: string;
  colors: any;
}>(({ text, colors }) => (
  <View style={[styles.serviceTag, { backgroundColor: colors.background }]}>
    <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
    <Text style={[styles.serviceTagText, { color: colors.text }]}>{text}</Text>
  </View>
));

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    height: 56,
    elevation: 5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    marginHorizontal: SPACING.md,
    textAlign: 'center',
  },
  fixedHeader: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollContent: { 
    paddingTop: 56,
  },
  profileHeader: {
    alignItems: "center",
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "700",
  },
  doctorName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  actionWrapper: {
    alignItems: 'center',
  },
  actionPill: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
  },
  actionLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  contentSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  miniTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  bodyText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    opacity: 0.8,
  },
  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: FONT_SIZES.xs,
    marginBottom: 2,
    fontWeight: "500",
  },
  cardValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "500",
  },
  hoursGrid: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  hourItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.xs,
  },
  hourDay: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "500",
  },
  hourTime: {
    fontSize: FONT_SIZES.sm,
  },
  divider: {
    height: 1,
    marginVertical: SPACING.xs,
    opacity: 0.1,
  },
  servicesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  serviceTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 20,
  },
  serviceTagText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "500",
  },
  bookFab: {
    position: "absolute",
    bottom: SPACING.xl,
    right: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 28,
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bookFabText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.white,
  },
  fab: {
    position: "absolute",
    bottom: SPACING.xl,
    right: SPACING.xl + 120, // Offset left of Book button
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});