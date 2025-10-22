// src/screens/WelcomeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton } from '../components/CustomButton';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />
      
      <View style={styles.topSection}>
        <View style={styles.iconContainer}>
          <Ionicons name="medical" size={80} color={COLORS.white} />
        </View>
        
        <Text style={styles.title}>DocBook</Text>
        <Text style={styles.subtitle}>Your trusted healthcare companion</Text>
      </View>
      
      <View style={styles.featuresSection}>
        <FeatureItem
          icon="search"
          title="Find Specialists"
          description="Connect with verified doctors instantly"
        />
        <FeatureItem
          icon="location"
          title="Nearby Doctors"
          description="Discover healthcare professionals near you"
        />
        {/* <FeatureItem
          icon="calendar"
          title="Easy Booking"
          description="Schedule appointments effortlessly"
        /> */}
      </View>
      
      <View style={styles.bottomSection}>
        <CustomButton
          title="Get Started"
          onPress={() => navigation.navigate('RoleSelection')}
          variant="primary"
          size="large"
          fullWidth
        />
        
        <Text style={styles.footerText}>
          Trusted by thousands of patients and doctors
        </Text>
      </View>
    </SafeAreaView>
  );
};

const FeatureItem: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon} size={24} color={COLORS.primary} />
    </View>
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.huge,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
featuresSection: {
  backgroundColor: COLORS.white,
  borderTopLeftRadius: RADIUS.xl,
  borderTopRightRadius: RADIUS.xl,
  paddingTop: SPACING.xl,
  paddingHorizontal: SPACING.lg,
  paddingBottom: SPACING.md,
  marginTop: 30, 

},
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  featureDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  bottomSection: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    marginBottom: -35,
  },
  footerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});