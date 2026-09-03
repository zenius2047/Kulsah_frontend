import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PRIMARY_COLOR, useThemeMode } from '../theme';
import { fontSize } from '../typography';
import {
  getPushNotificationPermissionStateAsync,
  requestAndRegisterFcmTokenAsync,
} from '../src';
import type { PushNotificationPermissionState } from '../src';

const PushNotificationPrompt: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const [permissionState, setPermissionState] = useState<PushNotificationPermissionState>('checking');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const refreshPermissionState = useCallback(async () => {
    try {
      setPermissionState(await getPushNotificationPermissionStateAsync());
    } catch (error) {
      console.warn('Could not read push notification permission.', error);
      setPermissionState('unsupported');
    }
  }, []);

  useEffect(() => {
    void refreshPermissionState();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshPermissionState();
    });
    return () => subscription.remove();
  }, [refreshPermissionState]);

  const handlePrimaryPress = async () => {
    if (permissionState === 'blocked') {
      await Linking.openSettings().catch(() => {
        Alert.alert('Open Settings', 'Open your device settings and allow notifications for Kulsah.');
      });
      return;
    }

    setIsRequesting(true);
    try {
      await requestAndRegisterFcmTokenAsync();
      await refreshPermissionState();
    } catch (error) {
      console.warn('Could not enable push notifications.', error);
      Alert.alert(
        'Notifications unavailable',
        'Kulsah could not finish setting up notifications. Please check your connection and try again.',
      );
    } finally {
      setIsRequesting(false);
    }
  };

  if (
    isDismissed
    || permissionState === 'checking'
    || permissionState === 'granted'
    || permissionState === 'unsupported'
  ) {
    return null;
  }

  const borderColor = isDark ? 'rgba(56,169,229,0.30)' : 'rgba(56,169,229,0.22)';
  const backgroundColor = isDark ? 'rgba(56,169,229,0.10)' : 'rgba(56,169,229,0.07)';

  return (
    <View style={[styles.card, { backgroundColor, borderColor }]}>
      <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
        <MaterialIcons name="notifications-active" size={23} color={PRIMARY_COLOR} />
      </View>

      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.text }]}>Never miss a Signal message</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {permissionState === 'blocked'
            ? 'Notifications are off. Enable them in Settings to get new-message alerts.'
            : 'Turn on notifications to hear about new messages when Kulsah is in the background.'}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={permissionState === 'blocked' ? 'Open notification settings' : 'Enable notifications'}
          disabled={isRequesting}
          onPress={() => void handlePrimaryPress()}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && !isRequesting && styles.pressed,
          ]}
        >
          {isRequesting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {permissionState === 'blocked' ? 'Open settings' : 'Enable alerts'}
            </Text>
          )}
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification prompt"
        hitSlop={10}
        onPress={() => setIsDismissed(true)}
        style={({ pressed }) => [styles.dismissButton, pressed && styles.pressed]}
      >
        <MaterialIcons name="close" size={18} color={theme.textMuted} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 6,
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...fontSize.b2,
    lineHeight: fontSize.b2.lineHeight,
    fontFamily: 'Inter_700Bold',
    paddingRight: 18,
  },
  description: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    marginTop: 5,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    minHeight: 36,
    minWidth: 112,
    borderRadius: 18,
    marginTop: 12,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
  },
  primaryButtonText: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dismissButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.68,
  },
});

export default PushNotificationPrompt;
