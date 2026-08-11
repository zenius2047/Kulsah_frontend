import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import type { EventResource, EventTicketPurchaseResource, EventTicketResource } from '../../types/event.types';

export const LATEST_FAN_TICKET_KEY = 'fan-ticket:latest';

export type LatestFanTicket = {
  ticket: EventTicketResource;
  event: EventResource;
  purchase?: EventTicketPurchaseResource['purchase'] | null;
};

export const useLatestFanTicket = () => {
  const [data, setData] = useState<LatestFanTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let active = true;
    setIsLoading(true);
    AsyncStorage.getItem(LATEST_FAN_TICKET_KEY)
      .then((stored: string | null) => {
        if (active) setData(stored ? JSON.parse(stored) as LatestFanTicket : null);
      })
      .catch(() => { if (active) setData(null); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []));

  return { data, isLoading };
};
