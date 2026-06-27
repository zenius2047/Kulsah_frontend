import { useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import {
  GoogleAuthProvider,
  signInWithCredential,
  User,
} from 'firebase/auth';

import { auth } from '../config/firebase';
import { setAuthToken } from '../services/token.service';
import { setUser } from '../store/auth.store';

WebBrowser.maybeCompleteAuthSession();

type GoogleUser = User | null;

type UseGoogleAuthOptions = {
  onSuccess?: (user: User) => void | Promise<void>;
  onError?: (error: Error) => void;
};

type NativeGoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

const WEB_CLIENT_ID =
  '66968860440-s6r9b0jd7s0fvb2rpmqltk3qq02u290n.apps.googleusercontent.com';
const IOS_CLIENT_ID =
  '66968860440-rh81s6n5gocqdfh8g7617i7h9cnllljl.apps.googleusercontent.com';
const ANDROID_CLIENT_ID =
  '66968860440-ui82okljl18ds1fssmci9p52v3011it1.apps.googleusercontent.com';
const ANDROID_PACKAGE_NAME = 'com.godfreddevsorganization.kulsah';
const ANDROID_SIGNING_SHA1 = '85:16:BB:28:27:D7:6D:AC:15:E8:0D:16:E2:87:45:48:E9:93:C7:F6';
const ANDROID_SIGNING_SHA256 =
  '81:F9:40:27:76:40:83:1D:98:0E:BA:D9:0C:07:5C:0B:8F:5A:84:EF:47:68:6E:18:B2:E0:44:C1:19:AB:8B:20';

const sanitizeHandle = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '') || `google_user_${Date.now()}`;

const buildAppUser = (firebaseUser: User) => {
  const displayName =
    firebaseUser.displayName?.trim() ||
    firebaseUser.email?.split('@')[0]?.trim() ||
    'Google User';

  return {
    id: Date.now(),
    name: displayName,
    role: 'fan' as const,
    email: firebaseUser.email ?? '',
    handle: sanitizeHandle(displayName),
    ...(firebaseUser.photoURL ? { avatar: firebaseUser.photoURL } : {}),
  };
};

const completeFirebaseSignIn = async (
  idToken: string,
  accessToken?: string | null
) => {
  const credential = GoogleAuthProvider.credential(idToken, accessToken ?? undefined);
  const userCredential = await signInWithCredential(auth, credential);
  const firebaseUser = userCredential.user;

  await setAuthToken(await firebaseUser.getIdToken());
  setUser(buildAppUser(firebaseUser));

  return firebaseUser;
};

export const useGoogleAuth = (options: UseGoogleAuthOptions = {}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string>('');

  const [, , promptAsync] = Google.useAuthRequest({
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
    clientId: WEB_CLIENT_ID,
  });

  const signInNative = async (): Promise<GoogleUser> => {
    try {
      setIsSigningIn(true);
      setError('');

      const googleSigninModule = (await import('@react-native-google-signin/google-signin')) as NativeGoogleSigninModule;
      const { GoogleSignin } = googleSigninModule;

      GoogleSignin.configure({
        webClientId: WEB_CLIENT_ID,
        iosClientId: IOS_CLIENT_ID,
        offlineAccess: false,
      });

      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const response = await GoogleSignin.signIn();
      if (response.type !== 'success') {
        return null;
      }

      const nativeUser = response.data;
      const nativeTokens = nativeUser.idToken ? null : await GoogleSignin.getTokens();
      const idToken = nativeUser.idToken ?? nativeTokens?.idToken;
      const accessToken = nativeTokens?.accessToken;

      if (!idToken) {
        throw new Error('Google sign-in did not return an ID token.');
      }

      const firebaseUser = await completeFirebaseSignIn(idToken, accessToken);
      await options.onSuccess?.(firebaseUser);

      return firebaseUser;
    } catch (caughtError: any) {
      const errorMessage = String(caughtError?.message ?? '').toLowerCase();
      const nativeModuleMissing =
        errorMessage.includes('rngooglesignin') ||
        errorMessage.includes('native module') ||
        errorMessage.includes('expo go');

      if (nativeModuleMissing) {
        console.log('Native Google sign-in unavailable, falling back to web auth session.');
        const fallbackResult = await signInWeb();
        if (fallbackResult) {
          return fallbackResult;
        }

        const nextError = new Error('Native Google sign-in needs a development build, not Expo Go.');
        setError(nextError.message);
        options.onError?.(nextError);
        return null;
      }

      if (caughtError?.code === 'SIGN_IN_CANCELLED' || caughtError?.code === 'IN_PROGRESS') {
        return null;
      }

      const isAndroidDeveloperError =
        Platform.OS === 'android' &&
        (caughtError?.code === '10' ||
          String(caughtError?.message ?? '').toUpperCase().includes('DEVELOPER_ERROR'));

      if (isAndroidDeveloperError) {
        const nextError = new Error(
          `Android Google Sign-In is not configured for this build. Add package ${ANDROID_PACKAGE_NAME} with SHA-1 ${ANDROID_SIGNING_SHA1} and SHA-256 ${ANDROID_SIGNING_SHA256} in Firebase/Google Cloud, then rebuild the development client.`
        );
        console.log('Google Sign-In Android configuration error:', {
          packageName: ANDROID_PACKAGE_NAME,
          sha1: ANDROID_SIGNING_SHA1,
          sha256: ANDROID_SIGNING_SHA256,
          originalError: caughtError,
        });
        console.log('Falling back to web auth session for Google sign-in.');
        const fallbackResult = await signInWeb();
        if (fallbackResult) {
          return fallbackResult;
        }

        setError(nextError.message);
        options.onError?.(nextError);
        return null;
      }

      const nextError =
        caughtError instanceof Error ? caughtError : new Error('Google Sign-In failed.');
      setError(nextError.message);
      options.onError?.(nextError);
      console.log('Google Sign-In error:', caughtError);
      return null;
    } finally {
      setIsSigningIn(false);
    }
  };

  const signInWeb = async (): Promise<GoogleUser> => {
    try {
      setIsSigningIn(true);
      setError('');

      const result = await promptAsync();
      if (result.type !== 'success') {
        return null;
      }

      const idToken =
        result.authentication?.idToken ??
        result.params?.id_token ??
        result.params?.idToken;
      const accessToken =
        result.authentication?.accessToken ??
        result.params?.access_token ??
        result.params?.accessToken;

      if (!idToken) {
        throw new Error('Google sign-in did not return an ID token.');
      }

      const firebaseUser = await completeFirebaseSignIn(idToken, accessToken);
      await options.onSuccess?.(firebaseUser);

      return firebaseUser;
    } catch (caughtError: any) {
      const nextError =
        caughtError instanceof Error ? caughtError : new Error('Google Sign-In failed.');
      setError(nextError.message);
      options.onError?.(nextError);
      console.log('Google Sign-In error:', caughtError);
      return null;
    } finally {
      setIsSigningIn(false);
    }
  };

  const signIn = async (): Promise<GoogleUser> =>
    Platform.OS === 'web' ? signInWeb() : signInNative();

  return {
    signIn,
    isSigningIn,
    error,
  };
};
