import { describe, expect, it } from 'vitest';

import { canUseNetwork, getConnectivityStatus } from '../src/utils/connectivity';

describe('connectivity state', () => {
  it('reports an explicitly disconnected device as offline', () => {
    expect(getConnectivityStatus({ isConnected: false, isInternetReachable: null })).toBe('offline');
    expect(canUseNetwork({ isConnected: false, isInternetReachable: null })).toBe(false);
  });

  it('reports a connected device without internet reachability as offline', () => {
    expect(getConnectivityStatus({ isConnected: true, isInternetReachable: false })).toBe('offline');
  });

  it('reports a reachable connection as online', () => {
    expect(getConnectivityStatus({ isConnected: true, isInternetReachable: true })).toBe('online');
    expect(canUseNetwork({ isConnected: true, isInternetReachable: true })).toBe(true);
  });

  it('does not pause requests while native reachability is still unknown', () => {
    expect(getConnectivityStatus({ isConnected: null, isInternetReachable: null })).toBe('unknown');
    expect(canUseNetwork({ isConnected: null, isInternetReachable: null })).toBe(true);
  });
});
