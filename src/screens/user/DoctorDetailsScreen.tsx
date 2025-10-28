// src/screens/user/DoctorDetailsScreen.tsx
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  StatusBar,
  Animated,
  Share,
  Alert,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { CustomButton } from "../../components/CustomButton";
import {
  COLORS,
  FONT_SIZES,
  SPACING,
  RADIUS,
  SHADOWS,
} from "../../constants/theme";
import { DoctorResponseDto } from "../../types";

const { width } = Dimensions.get("window");

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
  const [isFavorite, setIsFavorite] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const favoriteScale = useRef(new Animated.Value(1)).current;

  // Parallax effect for header
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, -50],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100, 150],
    outputRange: [0, 0.5, 1],
    extrapolate: "clamp",
  });

  const profileScale = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.7],
    extrapolate: "clamp",
  });

  const handleCall = () => {
    if (doctor.phoneNumber) {
      Alert.alert(
        "Call Doctor",
        `Do you want to call Dr. ${doctor.name}?`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Call", 
            onPress: () => Linking.openURL(`tel:${doctor.phoneNumber}`),
            style: "default"
          },
        ]
      );
    }
  };

  const handleEmail = () => {
    if (doctor.email) {
      Alert.alert(
        "Send Email",
        `Send an email to Dr. ${doctor.name}?`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Send", 
            onPress: () => Linking.openURL(`mailto:${doctor.email}`),
            style: "default"
          },
        ]
      );
    }
  };

  const handleDirections = () => {
    if (doctor.location?.latitude && doctor.location?.longitude) {
      Alert.alert(
        "Get Directions",
        "Open in Maps?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Open", 
            onPress: () => Linking.openURL(
              `https://www.google.com/maps/dir/?api=1&destination=${doctor.location.latitude},${doctor.location.longitude}`
            ),
            style: "default"
          },
        ]
      );
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out Dr. ${doctor.name}, ${doctor.specialization}\nPhone: ${doctor.phoneNumber || "N/A"}\nEmail: ${doctor.email || "N/A"}`,
        title: `Dr. ${doctor.name} - ${doctor.specialization}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  // TODO: Implement booking feature
  // const handleBookAppointment = () => {
  //   navigation.navigate("BookAppointment", { doctor });
  // };

  const toggleFavorite = () => {
    // Animate the favorite button
    Animated.sequence([
      Animated.timing(favoriteScale, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(favoriteScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setIsFavorite(!isFavorite);
    // Here you would typically save to backend/storage
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const quickActions: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    color: string;
    onPress: () => void;
    available: boolean;
  }[] = [
    { 
      icon: "call" as keyof typeof Ionicons.glyphMap, 
      label: "Call", 
      color: COLORS.success, 
      onPress: handleCall,
      available: !!doctor.phoneNumber 
    },
    { 
      icon: "mail" as keyof typeof Ionicons.glyphMap, 
      label: "Email", 
      color: COLORS.primary, 
      onPress: handleEmail,
      available: !!doctor.email 
    },
    { 
      icon: "location" as keyof typeof Ionicons.glyphMap, 
      label: "Direction", 
      color: COLORS.error, 
      onPress: handleDirections,
      available: !!(doctor.location?.latitude && doctor.location?.longitude)
    },
    { 
      icon: "share-social" as keyof typeof Ionicons.glyphMap, 
      label: "Share", 
      color: COLORS.warning, 
      onPress: handleShare,
      available: true 
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor="transparent"
        translucent
      />

      {/* Floating Animated Header */}
      <Animated.View 
        style={[
          styles.floatingHeader, 
          { 
            backgroundColor: colors.background,
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
          }
        ]}
      >
        <TouchableOpacity 
          style={[styles.headerButton, { backgroundColor: colors.card }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Animated.Text 
          style={[
            styles.headerTitle, 
            { color: colors.text, opacity: headerOpacity }
          ]}
        >
          Dr. {doctor.name}
        </Animated.Text>
        <TouchableOpacity 
          style={[styles.headerButton, { backgroundColor: colors.card }]}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Animated Profile Section */}
        <Animated.View 
          style={[
            styles.profileSection, 
            { 
              backgroundColor: colors.background,
              transform: [{ scale: profileScale }]
            }
          ]}
        >
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Ionicons name="person" size={60} color={COLORS.white} />
              <View style={[styles.onlineIndicator, { backgroundColor: COLORS.success }]} />
            </View>
            {/* <Animated.View style={{ transform: [{ scale: favoriteScale }] }}>
              <TouchableOpacity 
                style={[styles.favoriteButton, { backgroundColor: colors.card }]}
                onPress={toggleFavorite}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={isFavorite ? "heart" : "heart-outline"} 
                  size={20} 
                  color={isFavorite ? COLORS.error : colors.text} 
                />
              </TouchableOpacity>
            </Animated.View> */}
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: colors.text }]}>
              Dr. {doctor.name}
            </Text>
            <View style={[styles.specialtyBadge, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="medical" size={16} color={colors.primary} />
              <Text style={[styles.specialty, { color: colors.primary }]}>
                {doctor.specialization}
              </Text>
            </View>
            
            {/* TODO: Implement stats feature (rating, patients, experience) */}
            {/* <View style={styles.statsRow}>
              <StatCard 
                icon="star" 
                value="4.8" 
                label="Rating" 
                colors={colors} 
              />
              <StatCard 
                icon="people" 
                value="500+" 
                label="Patients" 
                colors={colors} 
              />
              <StatCard 
                icon="time" 
                value="10y" 
                label="Experience" 
                colors={colors} 
              />
            </View> */}
          </View>
        </Animated.View>

        {/* Quick Actions Grid */}
        <View style={styles.quickActionsContainer}>
          {quickActions.filter(action => action.available).map((action, index) => (
            <QuickActionButton
              key={index}
              icon={action.icon}
              label={action.label}
              color={action.color}
              onPress={action.onPress}
              colors={colors}
              delay={index * 100}
            />
          ))}
        </View>

        {/* About Section - Expandable */}
        <ExpandableSection
          title="About Doctor"
          icon="information-circle"
          isExpanded={expandedSection === "about"}
          onToggle={() => toggleSection("about")}
          colors={colors}
        >
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
            Dr. {doctor.name} is a highly qualified {doctor.specialization} with extensive 
            experience in providing top-notch medical care. Committed to patient well-being 
            and using the latest medical techniques and technologies to ensure the best 
            possible outcomes for every patient.
          </Text>
        </ExpandableSection>

        {/* Contact Information - Enhanced */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call-outline" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Contact Information
            </Text>
          </View>
          {doctor.phoneNumber && (
            <InfoRow
              icon="call"
              label="Phone Number"
              value={doctor.phoneNumber}
              onPress={handleCall}
              colors={colors}
            />
          )}
          {doctor.email && (
            <InfoRow
              icon="mail"
              label="Email Address"
              value={doctor.email}
              onPress={handleEmail}
              colors={colors}
            />
          )}
          {doctor.location?.address && (
            <InfoRow
              icon="location"
              label="Clinic Address"
              value={doctor.location.address}
              onPress={handleDirections}
              colors={colors}
            />
          )}
        </View>

        {/* Working Hours - Expandable */}
        <ExpandableSection
          title="Working Hours"
          icon="time"
          isExpanded={expandedSection === "hours"}
          onToggle={() => toggleSection("hours")}
          colors={colors}
        >
          <WorkingHoursRow day="Monday - Friday" time="09:00 AM - 05:00 PM" colors={colors} />
          <WorkingHoursRow day="Saturday" time="09:00 AM - 01:00 PM" colors={colors} />
          <WorkingHoursRow day="Sunday" time="Closed" colors={colors} isLast />
        </ExpandableSection>

        {/* Services - New Section */}
        <ExpandableSection
          title="Services Offered"
          icon="medical"
          isExpanded={expandedSection === "services"}
          onToggle={() => toggleSection("services")}
          colors={colors}
        >
          <ServiceItem 
            icon="checkmark-circle" 
            text="General Consultation" 
            colors={colors} 
          />
          <ServiceItem 
            icon="checkmark-circle" 
            text="Health Checkups" 
            colors={colors} 
          />
          <ServiceItem 
            icon="checkmark-circle" 
            text="Medical Prescriptions" 
            colors={colors} 
          />
          <ServiceItem 
            icon="checkmark-circle" 
            text="Follow-up Care" 
            colors={colors} 
            isLast 
          />
        </ExpandableSection>
      </Animated.ScrollView>

      {/* Floating Action Button */}
      {doctor.phoneNumber && (
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: colors.primary }]} 
          onPress={handleCall}
          activeOpacity={0.9}
        >
          <Ionicons name="call" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* Action Footer */}
      {/* <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        {doctor.phoneNumber && (
          <TouchableOpacity 
            style={[styles.callButton, { backgroundColor: colors.card }]} 
            onPress={handleCall}
          >
            <Ionicons name="call" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
        TODO: Implement booking feature
        <TouchableOpacity 
          style={[styles.bookButton, { backgroundColor: colors.primary }]}
          onPress={handleBookAppointment}
        >
          <Text style={styles.bookButtonText}>Book Appointment</Text>
        </TouchableOpacity>
      </View> */}
    </SafeAreaView>
  );
};

// Quick Action Button Component with Animation
const QuickActionButton: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  colors: any;
  delay: number;
}> = ({ icon, label, color, onPress, colors, delay }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => onPress());
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity 
        style={[styles.quickAction, { backgroundColor: colors.card }]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={[styles.quickActionLabel, { color: colors.text }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Expandable Section Component
const ExpandableSection: React.FC<{
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  isExpanded: boolean;
  onToggle: () => void;
  colors: any;
  children: React.ReactNode;
}> = ({ title, icon, isExpanded, onToggle, colors, children }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <TouchableOpacity 
        style={styles.sectionHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Ionicons name={icon} size={24} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {title}
          </Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Ionicons name="chevron-down" size={24} color={colors.textSecondary} />
        </Animated.View>
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.expandedContent}>
          {children}
        </View>
      )}
    </View>
  );
};

// Service Item Component
const ServiceItem: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  colors: any;
  isLast?: boolean;
}> = ({ icon, text, colors, isLast }) => (
  <View style={[styles.serviceItem, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
    <Ionicons name={icon} size={20} color={colors.primary} />
    <Text style={[styles.serviceText, { color: colors.text }]}>{text}</Text>
  </View>
);

// Stat Card Component
const StatCard: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  colors: any;
}> = ({ icon, value, label, colors }) => (
  <View style={[styles.statCard, { backgroundColor: colors.card }]}>
    <Ionicons name={icon} size={20} color={colors.primary} />
    <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
  </View>
);

// Info Row Component
const InfoRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
  colors: any;
}> = ({ icon, label, value, onPress, colors }) => (
  <TouchableOpacity
    style={[styles.infoRow, { borderBottomColor: colors.border }]}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.6 : 1}
  >
    <View style={[styles.infoIcon, { backgroundColor: colors.background }]}>
      <Ionicons name={icon} size={22} color={colors.primary} />
    </View>
    <View style={styles.infoContent}>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
    {onPress && (
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    )}
  </TouchableOpacity>
);

// Working Hours Row Component
const WorkingHoursRow: React.FC<{
  day: string;
  time: string;
  colors: any;
  isLast?: boolean;
}> = ({ day, time, colors, isLast }) => (
  <View style={[styles.hoursRow, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
    <Text style={[styles.hoursDay, { color: colors.text }]}>{day}</Text>
    <Text style={[styles.hoursTime, { color: colors.textSecondary }]}>{time}</Text>
  </View>
);

// Styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  floatingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingTop: Platform.OS === 'android' ? SPACING.xl + 10 : 100,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomWidth: 0.2,
    ...SHADOWS.medium,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.small,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
  },
  scrollContent: { 
    paddingTop: Platform.OS === 'android' ? 80 : 70,
    paddingBottom: SPACING.xxl + 40,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: COLORS.white,
    ...SHADOWS.large,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  // favoriteButton: {
  //   position: "absolute",
  //   bottom: -5,
  //   right: -5,
  //   width: 40,
  //   height: 40,
  //   borderRadius: RADIUS.full,
  //   alignItems: "center",
  //   justifyContent: "center",
  //   borderWidth: 2,
  //   borderColor: COLORS.white,
  //   ...SHADOWS.medium,
  // },
  profileInfo: { alignItems: "center", width: '100%' },
  name: {
    fontSize: FONT_SIZES.xxl + 2,
    fontWeight: "800",
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  specialtyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  specialty: {
    fontSize: FONT_SIZES.base,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  statCard: {
    alignItems: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    minWidth: 90,
    ...SHADOWS.small,
  },
  statValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "bold",
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  quickActionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  quickAction: {
    width: (width - SPACING.lg * 2 - SPACING.sm) / 2,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    ...SHADOWS.small,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  quickActionLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
  },
  section: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    ...SHADOWS.small,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
    flex: 1,
  },
  expandedContent: {
    marginTop: SPACING.md,
  },
  aboutText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
    borderBottomWidth: 1,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: FONT_SIZES.xs,
    marginBottom: SPACING.xs,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  hoursDay: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
  },
  hoursTime: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "500",
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  serviceText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "500",
    flex: 1,
  },
  fab: {
    position: "absolute",
    bottom: SPACING.xl,
    right: SPACING.xl,
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.large,
    elevation: 8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: SPACING.lg,
    borderTopWidth: 1,
    gap: SPACING.md,
    ...SHADOWS.large,
    justifyContent: "center",
  },
  callButton: {
    width: "100%",
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.medium,
  },
  bookButton: {
    flex: 1,
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.medium,
  },
  bookButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: "bold",
  },
});