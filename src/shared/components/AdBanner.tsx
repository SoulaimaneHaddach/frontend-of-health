import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { ADS } from '../config/ads';

export const AdBanner: React.FC<{ size?: string; style?: any }> = ({ size, style }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Lazy-require the native ad components so the app can run in Expo Go
  let BannerAd: any | null = null;
  let BannerAdSize: any = null;
  let TestIds: any = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ads = require('react-native-google-mobile-ads');
    BannerAd = ads.BannerAd || ads.Banner;
    BannerAdSize = ads.BannerAdSize || ads.BannerAdSizes || ads.BannerAdSize;
    TestIds = ads.TestIds;
  } catch (e) {
    BannerAd = null;
  }

  if (!BannerAd) {
    // Native module not available (Expo Go). Render nothing to avoid crash.
    return <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }, style]} />;
  }

  const unitId = __DEV__ || !ADS.BANNER_ID ? (TestIds?.BANNER ?? 'ca-app-pub-3940256099942544/6300978111') : ADS.BANNER_ID;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }, style]}>
      <BannerAd
        unitId={unitId}
        size={size || (BannerAdSize?.FULL_BANNER ?? 'FULL_BANNER')}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AdBanner;
