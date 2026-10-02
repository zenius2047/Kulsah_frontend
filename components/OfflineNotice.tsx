import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { MaterialIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fontSize } from '../typography';
import { getConnectivityStatus, type ConnectivityStatus } from '../src/utils/connectivity';

const RECONNECTED_NOTICE_MS = 2_500;

const statusFromNetInfo = (state: NetInfoState): ConnectivityStatus =>
  getConnectivityStatus({
    isConnected: state.isConnected,
    isInternetReachable: state.isInternetReachable,
  });

const OfflineNotice = () => {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ConnectivityStatus>('unknown');
  const [isChecking, setIsChecking] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const previousStatus = useRef<ConnectivityStatus>('unknown');

  useEffect(() => {
    let mounted = true;
    const updateStatus = (state: NetInfoState) => {
      if (mounted) setStatus(statusFromNetInfo(state));
    };

    const unsubscribe = NetInfo.addEventListener(updateStatus);
    void NetInfo.fetch().then(updateStatus).catch(() => {
      // Keep the state unknown until NetInfo publishes an authoritative result.
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const wasOffline = previousStatus.current === 'offline';
    previousStatus.current = status;

    if (!wasOffline || status !== 'online') return;

    setShowReconnected(true);
    void Promise.allSettled([
      queryClient.resumePausedMutations(),
      queryClient.refetchQueries({ type: 'active' }),
    ]);

    const timer = setTimeout(() => setShowReconnected(false), RECONNECTED_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [queryClient, status]);

  const retry = useCallback(async () => {
    setIsChecking(true);
    try {
      const state = await NetInfo.fetch();
      const nextStatus = statusFromNetInfo(state);
      setStatus(nextStatus);

      if (nextStatus === 'online') {
        await Promise.allSettled([
          queryClient.resumePausedMutations(),
          queryClient.refetchQueries({ type: 'active' }),
        ]);
      }
    } catch {
      setStatus('offline');
    } finally {
      setIsChecking(false);
    }
  }, [queryClient]);

  if (status !== 'offline' && !showReconnected) return null;

  const reconnected = status === 'online' && showReconnected;

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      pointerEvents="box-none"
      style={[styles.host, { top: insets.top + 8 }]}
    >
      <View style={[styles.notice, reconnected ? styles.onlineNotice : styles.offlineNotice]}>
        <MaterialIcons
          name={reconnected ? 'cloud-done' : 'cloud-off'}
          size={22}
          color="#ffffff"
        />
        <View style={styles.copy}>
          <Text style={styles.title}>{reconnected ? 'Back online' : "You're offline"}</Text>
          <Text style={styles.message}>
            {reconnected
              ? 'Refreshing the latest content.'
              : 'Loaded content remains available. Changes will resume when you reconnect.'}
          </Text>
        </View>
        {!reconnected ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Check internet connection"
            disabled={isChecking}
            hitSlop={8}
            onPress={() => void retry()}
            style={({ pressed }) => [styles.retry, pressed && styles.retryPressed]}
          >
            {isChecking ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.retryText}>Retry</Text>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 10_000,
    elevation: 20,
  },
  notice: {
    minHeight: 64,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  offlineNotice: {
    backgroundColor: '#991b1b',
  },
  onlineNotice: {
    backgroundColor: '#047857',
  },
  copy: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    fontFamily: 'Inter_700Bold',
  },
  message: {
    color: 'rgba(255,255,255,0.82)',
    marginTop: 2,
    ...fontSize.b6,
    lineHeight: fontSize.b6.lineHeight,
  },
  retry: {
    minWidth: 58,
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryPressed: {
    opacity: 0.72,
  },
  retryText: {
    color: '#ffffff',
    ...fontSize.b6,
    lineHeight: fontSize.b6.lineHeight,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});

export default OfflineNotice;
