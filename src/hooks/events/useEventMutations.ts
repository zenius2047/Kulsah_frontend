import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../../api/events.api';
import type { EventFormPayload, PurchaseEventTicketsPayload, VerifyEventTicketPayload } from '../../types/event.types';
import { creatorEventQueryKey, eventQueryKey } from './useEvents';

const invalidateEventLists = (client: ReturnType<typeof useQueryClient>) => Promise.all([
  client.invalidateQueries({ queryKey: ['events', 'general'] }), client.invalidateQueries({ queryKey: ['events', 'creator'] }),
]);
export const useCreateEvent = () => { const client = useQueryClient(); return useMutation({ mutationFn: (payload: EventFormPayload) => eventsApi.createEvent(payload), onSuccess: () => invalidateEventLists(client) }); };
export const useUpdateEvent = () => { const client = useQueryClient(); return useMutation({ mutationFn: ({ event, payload }: { event: string | number; payload: EventFormPayload }) => eventsApi.updateEvent(event, payload), onSuccess: (_, vars) => { client.invalidateQueries({ queryKey: creatorEventQueryKey(vars.event) }); invalidateEventLists(client); } }); };
export const usePurchaseEventTickets = (event: string | number) => { const client = useQueryClient(); return useMutation({ mutationFn: (payload: PurchaseEventTicketsPayload) => eventsApi.purchaseTickets(event, payload), onSuccess: (response) => { client.setQueryData(eventQueryKey(event), response.data.data.event); client.invalidateQueries({ queryKey: eventQueryKey(event) }); invalidateEventLists(client); } }); };
export const useVerifyEventTicket = () => { const client = useQueryClient(); return useMutation({ mutationFn: (payload: VerifyEventTicketPayload) => eventsApi.verifyTicket(payload), onSuccess: () => client.invalidateQueries({ queryKey: ['events'] }) }); };
