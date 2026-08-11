import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { eventsApi } from '../../api/events.api';
import type { EventPage, EventStatusFilter } from '../../types/event.types';

export const eventsQueryKey = (search = '', status: EventStatusFilter = 'upcoming', perPage = 20) => ['events', 'general', { search, status, perPage }] as const;
export const eventQueryKey = (event?: string | number) => ['events', 'general', event] as const;
export const creatorEventsQueryKey = (perPage = 20) => ['events', 'creator', { perPage }] as const;
export const creatorEventQueryKey = (event?: string | number) => ['events', 'creator', event] as const;

const nextPage = (page: EventPage<unknown>) => {
  const current = Number(page.meta?.current_page ?? 1);
  if (page.meta?.next_page != null) return page.meta.next_page;
  if (page.meta?.has_more || (page.meta?.last_page && current < page.meta.last_page) || page.links?.next) return current + 1;
  return undefined;
};

export const useEvents = (search = '', status: EventStatusFilter = 'upcoming', perPage = 20) => useInfiniteQuery({
  queryKey: eventsQueryKey(search, status, perPage), initialPageParam: 1,
  queryFn: ({ pageParam }) => eventsApi.getEvents(pageParam, perPage, search, status).then((response) => response.data),
  getNextPageParam: nextPage,
});
export const useEvent = (event?: string | number) => useQuery({
  queryKey: eventQueryKey(event), queryFn: () => eventsApi.getEvent(event!).then((response) => response.data.data),
  enabled: event !== undefined && event !== null && event !== '', retry: (count, error: any) => ![401, 403, 404].includes(error?.response?.status) && count < 2,
});
export const useCreatorEvents = (perPage = 20) => useInfiniteQuery({
  queryKey: creatorEventsQueryKey(perPage), initialPageParam: 1,
  queryFn: ({ pageParam }) => eventsApi.getCreatorEvents(pageParam, perPage).then((response) => response.data), getNextPageParam: nextPage,
});
export const useCreatorEvent = (event?: string | number) => useQuery({
  queryKey: creatorEventQueryKey(event), queryFn: () => eventsApi.getCreatorEvent(event!).then((response) => response.data.data), enabled: event !== undefined && event !== null && event !== '',
});
