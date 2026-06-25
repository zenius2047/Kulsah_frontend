import React from 'react';
import {
  SafeAreaView as ReactNativeSafeAreaView,
  Platform,
  StatusBar,
  type ViewProps,
  type ViewStyle,
  type StyleProp,
} from 'react-native';

type Edge = 'top' | 'right' | 'bottom' | 'left';

export type EdgeInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type SafeAreaViewProps = ViewProps & {
  edges?: Edge[] | Partial<Record<Edge, 'additive' | 'off'>>;
  style?: StyleProp<ViewStyle>;
};

export type SafeAreaProviderProps = React.PropsWithChildren;

export const SafeAreaProvider = ({ children }: SafeAreaProviderProps) => <>{children}</>;

export const SafeAreaView = React.forwardRef<
  React.ElementRef<typeof ReactNativeSafeAreaView>,
  SafeAreaViewProps
>(({ edges: _edges, ...props }, ref) => <ReactNativeSafeAreaView ref={ref} {...props} />);

SafeAreaView.displayName = 'SafeAreaView';

export const useSafeAreaInsets = (): EdgeInsets => ({
  top: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  right: 0,
  bottom: 0,
  left: 0,
});

export const useSafeAreaFrame = () => ({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
});

export const initialWindowMetrics = {
  insets: useSafeAreaInsets(),
  frame: useSafeAreaFrame(),
};

export default {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
  useSafeAreaFrame,
  initialWindowMetrics,
};
