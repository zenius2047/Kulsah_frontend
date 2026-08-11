import api from './client';
import { endpoints } from './endpoints';
import type { EventFormPayload, EventItemResponse, EventListResource, EventPage, EventResource, EventStatusFilter, EventTicketPurchaseResource, PurchaseEventTicketsPayload, VerifyEventTicketPayload, EventTicketResource } from '../types/event.types';
import { createEventFormData, normalizeEventId } from '../utils/events';

export const eventsApi = {
  getEvents: (page = 1, perPage = 20, search = '', status: EventStatusFilter = 'upcoming') => api.get<EventPage<EventListResource>>(endpoints.general.events, { params: { page, per_page: perPage, ...(search ? { search } : {}), status } }),
  getEvent: (event: string | number) => api.get<EventItemResponse<EventResource>>(endpoints.general.event(normalizeEventId(event))),
  getCreatorEvents: (page = 1, perPage = 20) => api.get<EventPage<EventListResource>>(endpoints.creator.events, { params: { page, per_page: perPage } }),
  getCreatorEvent: (event: string | number) => api.get<EventItemResponse<EventResource>>(endpoints.creator.event(normalizeEventId(event))),
  createEvent: (payload: EventFormPayload) => api.post<EventItemResponse<EventResource>>(endpoints.creator.events, createEventFormData(payload)),
  updateEvent: (event: string | number, payload: EventFormPayload) => api.patch<EventItemResponse<EventResource>>(endpoints.creator.event(normalizeEventId(event)), createEventFormData(payload)),
  purchaseTickets: (event: string | number, payload: PurchaseEventTicketsPayload) => api.post<EventItemResponse<EventTicketPurchaseResource>>(endpoints.general.eventTicketPurchase(normalizeEventId(event)), {
    ...(payload.ticket_type_code ? { ticket_type_code: payload.ticket_type_code } : { ticket_type_name: payload.ticket_type_name }),
    quantity: payload.quantity, idempotency_key: payload.idempotency_key, metadata: payload.metadata ?? {},
  }),
  verifyTicket: (payload: VerifyEventTicketPayload) => api.post<EventItemResponse<EventTicketResource>>(endpoints.general.eventTicketVerify, payload),
};
