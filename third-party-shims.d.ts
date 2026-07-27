declare module '@google/genai';
declare module '@react-native-async-storage/async-storage';
declare module '@react-native-google-signin/google-signin';
declare module '@google/genai/web';

declare module '@react-navigation/bottom-tabs' {
  export function createBottomTabNavigator<T = Record<string, object | undefined>>(): any;
}

declare module '@react-navigation/native' {
  export const NavigationContainer: import('react').FC<any>;
  export function createNavigationContainerRef<T = any>(): any;
  export function useFocusEffect(effect: import('react').EffectCallback): void;
  export function useIsFocused(): boolean;
  export function useNavigation<T = any>(): T;
  export function useRoute<T = any>(): T;
  export function useTheme(): any;
}

declare module '@react-navigation/native-stack' {
  export type NativeStackScreenProps<
    T = Record<string, object | undefined>,
    R extends keyof T = keyof T
  > = any;
  export function createNativeStackNavigator<T = Record<string, object | undefined>>(): any;
}

declare module 'expo-auth-session/providers/google';
declare module 'expo-av';
declare module 'expo-blur';
declare module 'expo-camera';
declare module 'expo-font';
declare module 'expo-linear-gradient';

declare module 'expo-video' {
    import * as React from 'react';

    export type VideoSource = string | number | null | {
      uri?: string;
      assetId?: number;
      contentType?: 'auto' | 'progressive' | 'hls' | 'dash' | 'smoothStreaming';
      metadata?: Record<string, string>;
      headers?: Record<string, string>;
      useCaching?: boolean;
    };

  export type VideoPlayer = {
    loop: boolean;
    muted: boolean;
    status?: string;
    timeUpdateEventInterval?: number;
    addListener: (...args: any[]) => any;
    removeListener: (...args: any[]) => any;
    removeAllListeners: (...args: any[]) => any;
    emit: (...args: any[]) => any;
    listenerCount: (...args: any[]) => number;
    play: () => void;
    pause: () => void;
      replace?: (source: VideoSource) => void;
      replaceAsync: (source: VideoSource) => Promise<void>;
    [key: string]: any;
  };

  export class VideoView extends React.Component<any> {
    enterFullscreen(): void;
    exitFullscreen(): void;
  }
  export function useVideoPlayer(
      source: VideoSource,
    setup?: (player: VideoPlayer) => void
  ): VideoPlayer;
}

declare module 'expo-video-thumbnails';
declare module 'expo-sensors' {
  export const Accelerometer: {
    setUpdateInterval: (intervalMs: number) => void;
    addListener: (
      listener: (event: { x: number; y: number; z: number }) => void
    ) => { remove: () => void };
  };
}
declare module 'expo-web-browser';

declare module 'firebase/auth' {
  export type User = any;
  export type Auth = any;
  export const GoogleAuthProvider: any;
  export function getAuth(...args: any[]): Auth;
  export function initializeAuth(...args: any[]): Auth;
  export function getReactNativePersistence(...args: any[]): any;
  export function signInWithCredential(...args: any[]): Promise<any>;
}
