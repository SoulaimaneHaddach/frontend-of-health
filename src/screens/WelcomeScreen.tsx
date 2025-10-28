// src/screens/WelcomeScreen.tsx
import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  StatusBar, 
  Animated, 
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomButton } from '../components/CustomButton';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Icon rotation - one time only
    Animated.timing(iconRotate, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    // Pulse animation - one time only
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.15,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const rotation = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Gradient Background */}
      <LinearGradient
        colors={[COLORS.primary, '#4A90E2', '#5C6BC0']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
      </LinearGradient>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Top Section */}
        <Animated.View 
          style={[
            styles.topSection,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim }
              ]
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.iconContainer,
              { transform: [{ rotate: rotation }] }
            ]}
          >
            <View style={styles.iconInnerCircle}>
              <Ionicons name="medical" size={50} color={COLORS.primary} />
            </View>
            <Animated.View 
              style={[
                styles.pulseCircle1,
                { transform: [{ scale: pulseAnim }] }
              ]} 
            />
            <Animated.View 
              style={[
                styles.pulseCircle2,
                { transform: [{ scale: pulseAnim }], opacity: 0.15 }
              ]} 
            />
          </Animated.View>
          
          <Text style={styles.title}>DocBook</Text>
          <Text style={styles.subtitle}>Your trusted healthcare companion</Text>
        </Animated.View>
        
        {/* Features Section - Compact */}
        <View style={styles.featuresSection}>
          <FeatureItem
            icon="search"
            title="Find Specialists"
            description="Connect with verified doctors"
          />
          <FeatureItem
            icon="location"
            title="Nearby Doctors"
            description="Healthcare near you"
          />
          <FeatureItem
            icon="time"
            title="24/7 Support"
            description="Help when you need it"
          />
        </View>
        
        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <CustomButton
            title="Get Started"
            onPress={() => navigation.navigate('RoleSelection')}
            variant="primary"
            size="large"
            fullWidth
          />
          
          <View style={styles.securityInfo}>
            <View style={styles.securityItem}>
              <Ionicons name="lock-closed" size={14} color={COLORS.textSecondary} />
              <Text style={styles.securityText}>Secure</Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="shield" size={14} color={COLORS.textSecondary} />
              <Text style={styles.securityText}>Verified</Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.textSecondary} />
              <Text style={styles.securityText}>HIPAA Compliant</Text>
            </View>
          </View>
        </View>
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
      <Ionicons name={icon} size={20} color={COLORS.primary} />
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
    backgroundColor: COLORS.white,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.45,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 80,
    left: -60,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  iconContainer: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  iconInnerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.large,
    elevation: 10,
    zIndex: 3,
  },
  pulseCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 2,
  },
  pulseCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 1,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.xs,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
  },
  featuresSection: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    ...SHADOWS.small,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  bottomSection: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  securityText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});