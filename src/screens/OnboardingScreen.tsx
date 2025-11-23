import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ms } from '../shared/constants/responsive';
import { FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../shared/constants/theme';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Animated Pulse Component
const PulseRing = ({ color, delay = 0 }: { color: string; delay?: number }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale, { toValue: 1.8, duration: 1500, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 1500, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };
    animate();
  }, [delay, scale, opacity]);

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        {
          backgroundColor: color,
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
};

// Medical Icons
const CalendarPlusIcon = ({ size = 56, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.5" fill="none"/>
    <Path d="M3 9h18" stroke={color} strokeWidth="1.5"/>
    <Path d="M8 2v4M16 2v4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M12 13v4M10 15h4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const ShieldCheckIcon = ({ size = 56, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L4 6v5c0 5.55 3.4 10.74 8 12 4.6-1.26 8-6.45 8-12V6l-8-4z" stroke={color} strokeWidth="1.5" fill="none"/>
    <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const HeartPulseIcon = ({ size = 56, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke={color} strokeWidth="1.5" fill="none"/>
    <Path d="M5 12h3l2-3 3 6 2-3h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const StethoscopeIcon = ({ size = 48, color = '#0891B2' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9v4a6 6 0 0012 0V9" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Circle cx="6" cy="6" r="3" stroke={color} strokeWidth="1.5"/>
    <Circle cx="18" cy="6" r="3" stroke={color} strokeWidth="1.5"/>
    <Circle cx="18" cy="18" r="2" fill={color}/>
    <Path d="M18 13v3" stroke={color} strokeWidth="1.5"/>
  </Svg>
);

const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const [showLanguageScreen, setShowLanguageScreen] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  const flatRef = useRef<FlatList<any>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [showLanguageScreen, currentIndex, fadeAnim, slideAnim, scaleAnim, floatAnim]);

  const slides = useMemo(() => [
    {
      key: 'booking',
      Icon: CalendarPlusIcon,
      title: t.onb_booking_title,
      subtitle: t.onb_booking_subtitle,
      color: '#0891B2',
      bgColor: '#ECFEFF',
      features: [t.onb_booking_feature_1, t.onb_booking_feature_2, t.onb_booking_feature_3],
    },
    {
      key: 'security',
      Icon: ShieldCheckIcon,
      title: t.onb_security_title,
      subtitle: t.onb_security_subtitle,
      color: '#059669',
      bgColor: '#ECFDF5',
      features: [t.onb_security_feature_1, t.onb_security_feature_2, t.onb_security_feature_3],
    },
    {
      key: 'support',
      Icon: HeartPulseIcon,
      title: t.onb_support_title,
      subtitle: t.onb_support_subtitle,
      color: '#DC2626',
      bgColor: '#FEF2F2',
      features: [t.onb_support_feature_1, t.onb_support_feature_2, t.onb_support_feature_3],
    },
  ], [t]);

  const goTo = (index: number) => {
    flatRef.current?.scrollToOffset({ offset: index * SCREEN_WIDTH, animated: true });
    setCurrentIndex(index);
  };

  const onNext = () => {
    if (currentIndex < slides.length - 1) {
      goTo(currentIndex + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    try { await AsyncStorage.setItem('onboarding_shown', '1'); } catch {}
    try { navigation.navigate('Home'); } catch { navigation.reset?.({ index: 0, routes: [{ name: 'Home' }] } as any); }
  };

  // Language Screen
  if (showLanguageScreen) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        
        <Animated.View style={[styles.languageContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Animated Icon */}
          <Animated.View style={[styles.langIconWrap, { backgroundColor: colors.primary + '10', transform: [{ scale: scaleAnim }, { translateY: floatAnim }] }]}>
            <View style={[styles.langIconInner, { backgroundColor: colors.primary + '20' }]}>
              <StethoscopeIcon size={ms(44)} color={colors.primary} />
            </View>
          </Animated.View>

            <Text style={[styles.langWelcome, { color: colors.primary }]}>{t.welcome}</Text>
          <Text style={[styles.langTitle, { color: colors.text }]}>{t.selectLanguage}</Text>
          <Text style={[styles.langSubtitle, { color: colors.textSecondary }]}>
            {/* Select your preferred language to personalize your healthcare experience */}
          </Text>

          <View style={styles.langList}>
            {[
              { code: 'en' as const, label: t.english, native: 'English', flag: '🇬🇧' },
              { code: 'fr' as const, label: t.french, native: 'Français', flag: '🇫🇷' },
              { code: 'ar' as const, label: t.arabic, native: 'العربية', flag: '🇸🇦' },
            ].map((l) => {
              const selected = l.code === language;
              return (
                <Animated.View key={l.code} style={{ transform: [{ translateX: slideAnim }], opacity: fadeAnim }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setLanguage(l.code)}
                    style={[
                      styles.langBtn,
                      {
                        backgroundColor: selected ? colors.primary : colors.card,
                        borderColor: selected ? colors.primary : colors.border || '#E5E7EB',
                        shadowColor: selected ? colors.primary : '#000',
                        shadowOpacity: selected ? 0.3 : 0.05,
                      },
                    ]}
                  >
                    <Text style={styles.langFlag}>{l.flag}</Text>
                    <View style={styles.langInfo}>
                      <Text style={[styles.langLabel, { color: selected ? '#fff' : colors.text }]}>{l.label}</Text>
                      <Text style={[styles.langNative, { color: selected ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>{l.native}</Text>
                    </View>
                    <View style={[styles.radioOuter, { borderColor: selected ? '#fff' : colors.border }]}>
                      {selected && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View style={[styles.langFooter, { opacity: fadeAnim }]}>  
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
            onPress={() => setShowLanguageScreen(false)}
          >
            <Text style={styles.primaryBtnText}>{t.continue}</Text>
            <View style={styles.btnIconWrap}>
              <Text style={styles.btnArrow}>→</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Slide Renderer
  const renderSlide = ({ item, index }: { item: typeof slides[0]; index: number }) => {
    const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];
    const scale = scrollX.interpolate({ inputRange, outputRange: [0.8, 1, 0.8], extrapolate: 'clamp' });
    const opacity = scrollX.interpolate({ inputRange, outputRange: [0.5, 1, 0.5], extrapolate: 'clamp' });

    return (
      <View style={[styles.slide, { backgroundColor: colors.background }]}>
        <Animated.View style={[styles.slideInner, { opacity, transform: [{ scale }] }]}>
          {/* Icon with Pulse Effect */}
          <View style={styles.iconSection}>
            <View style={[styles.iconBgCircle, { backgroundColor: item.bgColor }]} />
            <PulseRing color={item.color + '30'} delay={0} />
            <PulseRing color={item.color + '20'} delay={500} />
            <Animated.View style={[styles.iconContainer, { backgroundColor: item.color, transform: [{ translateY: floatAnim }] }]}>
              <item.Icon size={ms(48)} color="#fff" />
            </Animated.View>
          </View>

          {/* Content */}
          <View style={styles.slideContent}>
            <View style={[styles.subtitleBadge, { backgroundColor: item.bgColor }]}>
              <View style={[styles.subtitleDot, { backgroundColor: item.color }]} />
              <Text style={[styles.subtitleText, { color: item.color }]}>{item.subtitle}</Text>
            </View>
            
            <Text style={[styles.slideTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.slideDesc, { color: colors.textSecondary }]}>{}</Text>

            {/* Features */}
            <View style={styles.featureList}>
              {item.features.map((f, i) => (
                <View key={i} style={[styles.featureItem, { backgroundColor: colors.card, borderColor: colors.border || '#F3F4F6' }]}>
                  <View style={[styles.featureCheck, { backgroundColor: item.color }]}>
                    <Text style={styles.featureCheckText}>✓</Text>
                  </View>
                  <Text style={[styles.featureText, { color: colors.text }]}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      </View>
    );
  };

  const handleScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (idx !== currentIndex && idx >= 0 && idx < slides.length) setCurrentIndex(idx);
  };

  const isLast = currentIndex === slides.length - 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Skip Button */}
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={() => goTo(slides.length - 1)} activeOpacity={0.7}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>{t.skip}</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatRef}
        data={slides}
        keyExtractor={(i) => i.key}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        renderItem={renderSlide}
        onMomentumScrollEnd={handleScroll}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        getItemLayout={(_, i) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * i, index: i })}
      />

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        {/* Dots */}
        <View style={styles.dots}>
          {slides.map((slide, i) => {
            const inputRange = [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH];
            const width = scrollX.interpolate({ inputRange, outputRange: [8, 28, 8], extrapolate: 'clamp' });
            const bgColor = scrollX.interpolate({
              inputRange,
              outputRange: [colors.border || '#E5E7EB', slide.color, colors.border || '#E5E7EB'],
              extrapolate: 'clamp',
            });
            return <Animated.View key={i} style={[styles.dot, { width, backgroundColor: bgColor }]} />;
          })}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: slides[currentIndex].color }]}
          activeOpacity={0.85}
          onPress={onNext}
        >
          <Text style={styles.primaryBtnText}>{isLast ? t.getStarted : t.continue}</Text>
          <View style={styles.btnIconWrap}>
            <Text style={styles.btnArrow}>{isLast ? '✓' : '→'}</Text>
          </View>
        </TouchableOpacity>

        {/* Progress indicator */}
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          {currentIndex + 1} of {slides.length}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Language Screen
  languageContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl },
  langIconWrap: { width: ms(120), height: ms(120), borderRadius: ms(60), justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg },
  langIconInner: { width: ms(90), height: ms(90), borderRadius: ms(45), justifyContent: 'center', alignItems: 'center' },
  langWelcome: { fontSize: FONT_SIZES.base, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', marginBottom: SPACING.xs },
  langTitle: { fontSize: ms(28), fontWeight: '700', marginBottom: SPACING.xs, textAlign: 'center' },
  langSubtitle: { fontSize: FONT_SIZES.base, textAlign: 'center', marginBottom: SPACING.xl, lineHeight: 22, paddingHorizontal: SPACING.md },
  langList: { width: '100%', gap: SPACING.sm },
  langBtn: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1.5, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 3 },
  langFlag: { fontSize: ms(28), marginRight: SPACING.sm },
  langInfo: { flex: 1, gap: 2 },
  langLabel: { fontSize: FONT_SIZES.lg, fontWeight: '600' },
  langNative: { fontSize: FONT_SIZES.sm },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  langFooter: { paddingHorizontal: SPACING.xl, paddingBottom: Platform.OS === 'ios' ? SPACING.lg : SPACING.xl },

  // Slides
  slide: { width: SCREEN_WIDTH, paddingTop: ms(60) },
  slideInner: { flex: 1, alignItems: 'center', paddingHorizontal: SPACING.xl },
  iconSection: { position: 'relative', width: ms(160), height: ms(160), justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg },
  iconBgCircle: { position: 'absolute', width: ms(140), height: ms(140), borderRadius: ms(70) },
  pulseRing: { position: 'absolute', width: ms(120), height: ms(120), borderRadius: ms(60) },
  iconContainer: { width: ms(100), height: ms(100), borderRadius: ms(50), justifyContent: 'center', alignItems: 'center', ...SHADOWS.large, elevation: 8, zIndex: 10 },
  slideContent: { flex: 1, width: '100%', alignItems: 'center' },
  subtitleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: 20, marginBottom: SPACING.sm, gap: 6 },
  subtitleDot: { width: 6, height: 6, borderRadius: 3 },
  subtitleText: { fontSize: FONT_SIZES.sm, fontWeight: '600' },
  slideTitle: { fontSize: ms(26), fontWeight: '700', textAlign: 'center', marginBottom: SPACING.sm },
  slideDesc: { fontSize: FONT_SIZES.base, textAlign: 'center', lineHeight: 24, marginBottom: SPACING.lg, paddingHorizontal: SPACING.sm },
  featureList: { width: '100%', gap: SPACING.sm },
  featureItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, gap: SPACING.sm },
  featureCheck: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  featureCheckText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  featureText: { fontSize: FONT_SIZES.sm, fontWeight: '500' },

  // Footer
  footer: { paddingHorizontal: SPACING.xl, paddingBottom: Platform.OS === 'ios' ? SPACING.lg : SPACING.xl, paddingTop: SPACING.md },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: SPACING.md },
  dot: { height: 8, borderRadius: 4 },
  primaryBtn: { height: ms(56), borderRadius: RADIUS.xl, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: SPACING.sm, ...SHADOWS.medium, elevation: 4 },
  primaryBtnText: { color: '#fff', fontSize: FONT_SIZES.base, fontWeight: '600' },
  btnIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  btnArrow: { color: '#fff', fontSize: 16, fontWeight: '700' },
  progressText: { textAlign: 'center', marginTop: SPACING.md, fontSize: FONT_SIZES.sm },
  skipBtn: { position: 'absolute', top: 55, right: SPACING.lg, zIndex: 10, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
  skipText: { fontSize: FONT_SIZES.sm, fontWeight: '600' },
});

export default OnboardingScreen;