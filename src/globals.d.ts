import type { FontSize as AppFontSize } from './utils/helpers';

declare global {
  const FontSize: typeof AppFontSize;
  const value: any;
  const theme: any;
  const navigation: any;
  const useParams: any;
}

declare module 'react-native' {
  interface ViewProps {
    onPress?: (...args: any[]) => void;
    onMouseMove?: (...args: any[]) => void;
    value?: any;
    onChangeText?: (...args: any[]) => void;
    disabled?: boolean;
    'aria-hidden'?: boolean | string;
  }

  interface TextProps {
    value?: any;
    disabled?: boolean;
  }

  interface ImageProps {
    'aria-hidden'?: boolean | string;
  }

  interface TextInputProps {
    includeFontPadding?: boolean;
    type?: string;
    min?: string | number;
    max?: string | number;
    step?: string | number;
    value?: string | number;
    onChange?: (...args: any[]) => void;
  }

  interface ViewStyle {
    animationDelay?: string | number;
  }
}
