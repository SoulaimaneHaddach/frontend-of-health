import {scale, verticalScale, moderateScale} from 'react-native-size-matters';

// Centralized responsive tokens using react-native-size-matters
// Purpose: replace hardcoded numeric sizes with tokens and scaled helpers.

export {scale, verticalScale, moderateScale as moderate};

// Spacing tokens (use `SPACING.xs`, `SPACING.md` etc.)
export const SPACING = {
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(24),
  xxl: scale(32),
};

// Common font sizes
export const FONT_SIZES = {
  xs: moderateScale(10),
  sm: moderateScale(12),
  base: moderateScale(14),
  lg: moderateScale(16),
  xl: moderateScale(20),
  xxl: moderateScale(24),
};

// Radii tokens
export const RADII = {
  sm: scale(4),
  md: scale(8),
  lg: scale(12),
  round: scale(9999),
};

// Component specific sizes
export const SIZES = {
  avatarSm: scale(32),
  avatarMd: scale(48),
  avatarLg: scale(72),
  fab: scale(56),
  handleWidth: scale(36),
  handleHeight: verticalScale(6),
  mapMarker: scale(40),
};

// Utility to turn unscaled numbers into scaled ones for quick inline use
export const s = (n: number) => scale(n);
export const vs = (n: number) => verticalScale(n);
export const ms = (n: number, factor?: number) => moderateScale(n, factor);

export default {
  scale,
  verticalScale,
  moderate: moderateScale,
  SPACING,
  FONT_SIZES,
  RADII,
  SIZES,
  s,
  vs,
  ms,
};
