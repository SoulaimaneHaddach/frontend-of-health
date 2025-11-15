// src/screens/LanguageSelectionScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  I18nManager,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n/translations';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../shared/constants/theme';
import * as Updates from 'expo-updates';
import { DevSettings } from 'react-native';

type LanguageSelectionScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇲🇦' },
];

export const LanguageSelectionScreen: React.FC<LanguageSelectionScreenProps> = ({ navigation }) => {
  const { language, setLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);
  const [scaleAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLanguage(lang);
  };

  const handleContinue = async () => {
    const needsRestart = selectedLanguage === 'ar' && !I18nManager.isRTL;
    const needsRestartFromRTL = selectedLanguage !== 'ar' && I18nManager.isRTL;
    
    await setLanguage(selectedLanguage);

    if (needsRestart || needsRestartFromRTL) {
      Alert.alert(
        selectedLanguage === 'ar' ? 'إعادة تشغيل مطلوبة' : 
        selectedLanguage === 'fr' ? 'Redémarrage requis' : 
        'Restart Required',
        selectedLanguage === 'ar' ? 'يجب إعادة تشغيل التطبيق لتطبيق تخطيط من اليمين إلى اليسار. يرجى إغلاق التطبيق وفتحه مرة أخرى.' :
        selectedLanguage === 'fr' ? 'L\'application doit redémarrer pour appliquer la mise en page de droite à gauche. Veuillez fermer et rouvrir l\'application.' :
        'The app needs to restart to apply right-to-left layout. Please close and reopen the app.',
        [
          {
            text: selectedLanguage === 'ar' ? 'حسناً' :
                  selectedLanguage === 'fr' ? 'D\'accord' : 
                  'OK',
            onPress: () => {
              // Some native reload APIs (expo-updates / DevSettings) can
              // throw unexpected native errors in certain build/dev setups
              // (e.g. argument mismatches). To avoid crashing the app for
              // users, we navigate back to the Welcome screen and instruct
              // the user to fully close and reopen the app to apply RTL.
              try {
                console.log('⚠️ RTL change requires full app restart. Navigating to Welcome.');
                navigation.replace('Welcome');
              } catch (navErr) {
                console.error('Navigation fallback failed:', navErr);
              }
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      navigation.replace('Welcome');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.content}>
        {/* Header */}
        <Animated.View style={[styles.header, { transform: [{ scale: scaleAnim }] }]}>
          <Ionicons name="language" size={64} color={COLORS.primary} />
          <Text style={styles.title}>Select Your Language</Text>
          <Text style={styles.subtitle}>اختر لغتك • Choisissez votre langue</Text>
        </Animated.View>

        {/* Language Options */}
        <View style={styles.languageContainer}>
          {LANGUAGES.map((lang, index) => {
            const isSelected = selectedLanguage === lang.code;
            const delay = index * 100;

            return (
              <Animated.View
                key={lang.code}
                style={[
                  {
                    opacity: scaleAnim,
                    transform: [
                      {
                        translateY: scaleAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    isSelected && styles.languageButtonSelected,
                  ]}
                  onPress={() => handleLanguageSelect(lang.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageContent}>
                    <Text style={styles.flag}>{lang.flag}</Text>
                    <View style={styles.languageText}>
                      <Text style={[
                        styles.languageName,
                        isSelected && styles.languageNameSelected,
                        lang.code === 'ar' && styles.arabicText,
                      ]}>
                        {lang.nativeName}
                      </Text>
                      <Text style={[
                        styles.languageSubname,
                        isSelected && styles.languageSubnameSelected,
                      ]}>
                        {lang.name}
                      </Text>
                    </View>
                  </View>
                  
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={28} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Continue Button */}
        <Animated.View style={{ opacity: scaleAnim }}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedLanguage && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!selectedLanguage}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>
              {selectedLanguage === 'ar' ? 'متابعة' :
               selectedLanguage === 'fr' ? 'Continuer' :
               'Continue'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  languageContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    ...SHADOWS.medium,
  },
  languageButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  flag: {
    fontSize: 40,
  },
  languageText: {
    gap: SPACING.xs,
  },
  languageName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  languageNameSelected: {
    color: COLORS.primary,
  },
  languageSubname: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  languageSubnameSelected: {
    color: COLORS.primary,
  },
  arabicText: {
    textAlign: 'right',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    ...SHADOWS.large,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.border,
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.white,
  },
});
