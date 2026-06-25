import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCTj0t1vQ5a38P_IrxrDdAG5gms-Ktg9II',
  authDomain: 'kulsah-511ef.firebaseapp.com',
  projectId: 'kulsah-511ef',
  storageBucket: 'kulsah-511ef.firebasestorage.app',
  messagingSenderId: '66968860440',
  appId: '1:66968860440:web:bfc196ddc2cd362fe4506d',
  measurementId: 'G-RDV8VFHYT4',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  auth = getAuth(app);
}

export { auth };
