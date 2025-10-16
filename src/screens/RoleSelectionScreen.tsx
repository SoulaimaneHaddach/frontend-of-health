// src/screens/RoleSelectionScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../constants/theme';

type RoleSelectionScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};


export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.header}>
        <Text style={styles.title}>I am a...</Text>
        <Text style={styles.subtitle}>Select your role to continue</Text>
      </View>
      
      <View style={styles.cardsContainer}>
        <RoleCard
          icon="person"
          title="Patient"
          description="Find and connect with healthcare professionals"
          color={COLORS.primary}
          onPress={() => navigation.replace('Home')}
        />
        
        <RoleCard
          icon="medical"
          title="Doctor"
          description="Manage your practice and 
          connect with patients"
          color={COLORS.secondary}
          onPress={() => navigation.navigate('DoctorLogin')}
        />
      </View>
      
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back"  size={24} color={COLORS.textSecondary} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const RoleCard: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
  onPress: () => void;
}> = ({ icon, title, description, color, onPress }) => (
  <TouchableOpacity
    style={[styles.card, { borderColor: color }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.iconCircle, { backgroundColor: color }]}>
      <Ionicons name={icon} size={40} color={COLORS.white} />
    </View>
    
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardDescription}>{description}</Text>
    
    <View style={[styles.arrow, { backgroundColor: color }]}>
      <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
  },
  cardsContainer: {
    flex: 1,
    gap: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 3,
    borderColor: COLORS.border,
    position: 'relative',
    ...SHADOWS.medium,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  cardDescription: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: FONT_SIZES.base * 1.5,
  },
  arrow: {
    position: 'absolute',
    bottom: SPACING.lg,
    right: SPACING.lg,
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  backText: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    fontWeight: '500',
    
  },
});