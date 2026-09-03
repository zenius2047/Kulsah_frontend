import { Dimensions, PixelRatio } from 'react-native';

const { width: dpWidth, height: dpHeight } = Dimensions.get('screen');
const { width: viewportWidth, height: viewportHeight } = Dimensions.get('window');

export const DP_WIDTH = dpWidth;
export const DP_HEIGHT = dpHeight;
export const SHORTEST_SIDE_DP = Math.min(viewportWidth, viewportHeight);
export const DP_RATIO = PixelRatio.get();

const DENSITY_REFERENCE_RATIO = 3;
// Density only guards handset sizing. It never makes fonts larger than their dp width allows.
export const DENSITY_ADJUSTED_HANDSET_WIDTH_DP = SHORTEST_SIDE_DP * Math.min(
  DP_RATIO / DENSITY_REFERENCE_RATIO,
  1,
);

export type PhoneType = 'small' | 'medium' | 'large';

// Tablets use their raw dp width. Handsets use a density-adjusted width so a
// physically smaller, low-density device with a large dp width stays compact.
export const PHONE_TYPE: PhoneType = SHORTEST_SIDE_DP >= 600
    ? 'large'
    : DENSITY_ADJUSTED_HANDSET_WIDTH_DP < 360
      ? 'small'
      : 'medium';
