declare module 'react-native-safe-area-context' {
  import * as React from 'react';
  import type { ViewProps } from 'react-native';

  export type Edge = 'top' | 'right' | 'bottom' | 'left';
  export type Edges = ReadonlyArray<Edge>;

  export type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  export type Insets = {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  export type Metrics = {
    frame: Rect;
    insets: Insets;
  };

  export interface SafeAreaProviderProps {
    children?: React.ReactNode;
    initialMetrics?: Metrics | null;
    style?: ViewProps['style'];
  }

  export interface SafeAreaViewProps extends ViewProps {
    edges?: Edges;
    mode?: 'padding' | 'margin';
  }

  export const SafeAreaProvider: React.FC<SafeAreaProviderProps>;
  export const SafeAreaView: React.FC<SafeAreaViewProps>;
  export const SafeAreaInsetsContext: React.Context<Insets | null>;
  export const SafeAreaFrameContext: React.Context<Rect | null>;
  export const initialWindowMetrics: Metrics | null;

  export function useSafeAreaInsets(): Insets;
  export function useSafeAreaFrame(): Rect;
  export function useSafeAreaInsetsFrame(): Rect;
  export function withSafeAreaInsets<P extends object>(
    component: React.ComponentType<P & { insets: Insets }>
  ): React.ComponentType<P>;
}
