// src/screens/user/DoctorDetailsScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { CustomButton } from "../../components/CustomButton";
import {
  COLORS,
  FONT_SIZES,
  SPACING,
  RADIUS,
  SHADOWS,
} from "../../constants/theme";
import { DoctorResponseDto } from "../../types";

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

  const handleCall = () =>
    doctor.phoneNumber && Linking.openURL(`tel:${doctor.phoneNumber}`);
  const handleEmail = () =>
    doctor.email && Linking.openURL(`mailto:${doctor.email}`);
  const handleDirections = () => {
    if (doctor.location?.latitude && doctor.location?.longitude) {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${doctor.location.latitude},${doctor.location.longitude}`
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        {/* <Text style={styles.headerTitle}>Doctor Profile</Text> */}
        {/* <TouchableOpacity>
          <Ionicons name="heart-outline" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity> */}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={60} color={COLORS.white} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{doctor.name}</Text>
            <Text style={styles.specialty}>{doctor.specialization}</Text>
            {/* <View style={styles.ratingContainer}>
              <Ionicons name="star" size={20} color={COLORS.warning} />
              <Text style={styles.ratingText}>{doctor.rating ?? 0}</Text>                  le mizajor 
              <Text style={styles.reviewCount}>({doctor.reviewsCount ?? 0} reviews)</Text>
            </View> */}
          </View>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          {doctor.phoneNumber && (
            <InfoRow
              icon="call"
              label="Phone"
              value={doctor.phoneNumber}
              onPress={handleCall}
            />
          )}
          {doctor.email && (
            <InfoRow
              icon="mail"
              label="Email"
              value={doctor.email}
              onPress={handleEmail}
            />
          )}
          {doctor.location?.address && (
            <InfoRow
              icon="location"
              label="Address"
              value={doctor.location.address}
              onPress={handleDirections}
            />
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {doctor.phoneNumber && (
          <TouchableOpacity style={styles.callButton} onPress={handleCall}>
            <Ionicons name="call" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

// Info Row
const InfoRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
}> = ({ icon, label, value, onPress }) => (
  <TouchableOpacity
    style={styles.infoRow}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={styles.infoIcon}>
      <Ionicons name={icon} size={20} color={COLORS.primary} />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
    {onPress && (
      <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
    )}
  </TouchableOpacity>
);

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    // borderBottomWidth: 1,
    // borderBottomColor: COLORS.border,
  },
  // headerTitle: {
  //   fontSize: FONT_SIZES.lg,
  //   fontWeight: "bold",
  //   color: COLORS.textPrimary,
  // },
  scrollContent: { 
    paddingBottom: SPACING.xxl + 80 
  },
  profileSection: {
    backgroundColor: COLORS.background,
    // padding: SPACING.xl,
    alignItems: "center",
    // borderBottomWidth: 1,
    // borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  profileInfo: { alignItems: "center" },
  name: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  specialty: {
    fontSize: FONT_SIZES.base,
    color: COLORS.primaryLight,
    marginBottom: SPACING.sm,
  },
  // ratingContainer: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   gap: SPACING.xs,
  // },
  // ratingText: {
  //   fontSize: FONT_SIZES.lg,
  //   fontWeight: "600",
  //   color: COLORS.textPrimary,
  // },
  // reviewCount: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  section: {
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    paddingTop: 20,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "bold",
    color: COLORS.primaryLight,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  infoValue: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: SPACING.lg,
    backgroundColor: COLORS.primaryLight,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
    ...SHADOWS.large,
  },
  callButton: {
    width :330,
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
