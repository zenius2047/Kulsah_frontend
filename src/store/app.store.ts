import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist, subscribeWithSelector } from 'zustand/middleware';

type AppState = {
  darkMode: boolean;
  mediumScreen: boolean;
  smallWidth: boolean;
  height: number;
  width: number;
  setDark: (value: boolean) => void;
  setScreenType: (value: boolean) => void;
  setSmallWith: (value: boolean) => void;
  setHeight: (value: number) => void;
  setWidth: (value: number) => void;
};

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        darkMode: false,
        mediumScreen: false,
        smallWidth: false,
        height: 0,
        width: 0,
        setDark: (value) => set({ darkMode: value }),
        setScreenType: (value) => set({ mediumScreen: value }),
        setSmallWith: (value) => set({ smallWidth: value }),
        setHeight: (value) => set({ height: value }),
        setWidth: (value) => set({ width: value }),
      }),
      {
        name: 'pulsar_app',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({ darkMode: state.darkMode }),
      }
    )
  )
);

export let HEIGHT = useAppStore.getState().height;
export let WIDTH = useAppStore.getState().width;
export let mediumScreen = useAppStore.getState().mediumScreen;
export let smallWidth = useAppStore.getState().smallWidth;
export let darkMode = useAppStore.getState().darkMode;

useAppStore.subscribe((state) => state.height, (nextHeight) => {
  HEIGHT = nextHeight;
});

useAppStore.subscribe((state) => state.width, (nextWidth) => {
  WIDTH = nextWidth;
});

useAppStore.subscribe((state) => state.mediumScreen, (nextValue) => {
  mediumScreen = nextValue;
});

useAppStore.subscribe((state) => state.smallWidth, (nextValue) => {
  smallWidth = nextValue;
});

useAppStore.subscribe((state) => state.darkMode, (nextValue) => {
  darkMode = nextValue;
  void AsyncStorage.setItem('pulsar_dark_mode', JSON.stringify(nextValue));
});

export const setHeight = (value: number) => {
  useAppStore.getState().setHeight(value);
};

export const setWidth = (value: number) => {
  useAppStore.getState().setWidth(value);
};

export const setScreenType = (value: boolean) => {
  useAppStore.getState().setScreenType(value);
};

export const setSmallWith = (value: boolean) => {
  useAppStore.getState().setSmallWith(value);
};

export const setDark = (value: boolean) => {
  useAppStore.getState().setDark(value);
};

type DarkModeListener = (value: boolean) => void;

export const subscribeDarkMode = (listener: DarkModeListener) =>
  useAppStore.subscribe((state) => state.darkMode, listener);

