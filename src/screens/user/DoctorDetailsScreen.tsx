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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={colors.background} 
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile */}
        <View style={[styles.profileSection, { backgroundColor: colors.background }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Ionicons name="person" size={60} color={COLORS.white} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: colors.text }]}>{doctor.name}</Text>
            <Text style={[styles.specialty, { color: colors.primary }]}>
              {doctor.specialization}
            </Text>
          </View>
        </View>

        {/* Contact */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            Contact Information
          </Text>
          {doctor.phoneNumber && (
            <InfoRow
              icon="call"
              label="Phone"
              value={doctor.phoneNumber}
              onPress={handleCall}
              colors={colors}
            />
          )}
          {doctor.email && (
            <InfoRow
              icon="mail"
              label="Email"
              value={doctor.email}
              onPress={handleEmail}
              colors={colors}
            />
          )}
          {doctor.location?.address && (
            <InfoRow
              icon="location"
              label="Address"
              value={doctor.location.address}
              onPress={handleDirections}
              colors={colors}
            />
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.primary, borderTopColor: colors.border }]}>
        {doctor.phoneNumber && (
          <TouchableOpacity 
            style={[styles.callButton, { backgroundColor: colors.background }]} 
            onPress={handleCall}
          >
            <Ionicons name="call" size={24} color={colors.primary} />
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
  colors: any;
}> = ({ icon, label, value, onPress, colors }) => (
  <TouchableOpacity
    style={[styles.infoRow, { borderBottomColor: colors.border }]}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={[styles.infoIcon, { backgroundColor: colors.card }]}>
      <Ionicons name={icon} size={20} color={colors.primary} />
    </View>
    <View style={styles.infoContent}>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
    {onPress && (
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    )}
  </TouchableOpacity>
);

// Styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  scrollContent: { 
    paddingBottom: SPACING.xxl + 80 
  },
  profileSection: {
    alignItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  profileInfo: { alignItems: "center" },
  name: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: "bold",
    marginBottom: SPACING.xs,
  },
  specialty: {
    fontSize: FONT_SIZES.base,
    marginBottom: SPACING.sm,
  },
  section: {
    padding: SPACING.lg,
    paddingTop: 20,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "bold",
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: FONT_SIZES.xs,
    marginBottom: SPACING.xs,
  },
  infoValue: {
    fontSize: FONT_SIZES.base,
    fontWeight: "500",
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
  },
  callButton: {
    width: 330,
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
});