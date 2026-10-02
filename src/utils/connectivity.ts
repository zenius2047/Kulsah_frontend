export type ConnectivitySnapshot = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
};

export type ConnectivityStatus = 'unknown' | 'online' | 'offline';

export const getConnectivityStatus = ({
  isConnected,
  isInternetReachable,
}: ConnectivitySnapshot): ConnectivityStatus => {
  if (isConnected === false || isInternetReachable === false) {
    return 'offline';
  }

  if (isConnected === true) {
    return 'online';
  }

  return 'unknown';
};

export const canUseNetwork = (snapshot: ConnectivitySnapshot): boolean =>
  getConnectivityStatus(snapshot) !== 'offline';
