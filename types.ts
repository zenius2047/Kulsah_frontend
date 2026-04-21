import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'fan' | 'creator' | 'guest';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export type RootStackParamList = {
  Home: undefined;
  Details: { name: string };
};

export let user: User | null = null;
type UserListener = (value: User | null) => void;
const userListeners = new Set<UserListener>();

export const setUser = (value: User | null)=>{
  user = value;
  userListeners.forEach((listener) => listener(value));
}

export const subscribeUser = (listener: UserListener) => {
  userListeners.add(listener);
  return () => {
    userListeners.delete(listener);
  };
};

export let HEIGHT = 0;
export const setHeight = (value: number)=>{
  HEIGHT= value;
}

export let WIDTH = 0;
export const setWidth = (value: number)=>{
  HEIGHT= value;
}

export let mediumScreen = false;
export const setScreenType = (value: boolean)=>{
  mediumScreen = value;
}
export let smallWidth = false;
export const setSmallWith = (value: boolean)=>{
  smallWidth = value
}

type DarkModeListener = (value: boolean) => void;
const darkModeListeners = new Set<DarkModeListener>();

export let darkMode = false;
export const setDark = (value: boolean)=>{
  darkMode = value;
  void AsyncStorage.setItem('pulsar_dark_mode', JSON.stringify(value));
  darkModeListeners.forEach((listener) => listener(value));
}

export const subscribeDarkMode = (listener: DarkModeListener) => {
  darkModeListeners.add(listener);
  return () => {
    darkModeListeners.delete(listener);
  };
}

export const Auth = {
  token: "",
};
