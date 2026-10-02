import NetInfo from '@react-native-community/netinfo';
import { onlineManager, QueryClient } from '@tanstack/react-query';

import { canUseNetwork } from '../utils/connectivity';

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    setOnline(canUseNetwork({
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
    }));
  })
);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
