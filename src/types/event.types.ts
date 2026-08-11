export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed' | string;
export type EventStatusFilter = 'upcoming' | 'ongoing' | 'past' | 'all';
export type EventVenueType = 'physical' | 'online' | 'virtual' | 'hybrid' | string;

export interface EventCreator { id: number | string; name: string; handle?: string; avatar_url?: string | null; is_verified?: boolean }
export interface EventVenue {
  type?: EventVenueType; name?: string | null; address?: string | null; city?: string | null;
  country?: string | null; latitude?: number | string | null; longitude?: number | string | null;
  meeting_url?: string | null; seating_map_enabled?: boolean; seating_map_url?: string | null;
}
export interface EventTicketType {
  id?: number | string; code?: string; name: string; description?: string | null;
  price: string | number; unit_price?: string | number; currency: string; quantity: number;
  remaining_count: number; available_quantity?: number; sold_count?: number; sold_quantity?: number;
  is_available: boolean; minimum_per_order?: number; maximum_per_order?: number;
}
export interface EventTicketResource {
  id: string | number; ticket_id?: string; ticket_number?: string | number; ticket_type_code?: string; ticket_type_name?: string;
  holder?: { id?: number | string; name?: string; email?: string } | null; purchase_reference?: string;
  purchased_at?: string; status: string; qr_code_url?: string | null; is_verified?: boolean;
  verified_at?: string | null; event?: Pick<EventResource, 'id' | 'title' | 'starts_at' | 'venue'>;
}
export interface EventBooking { id: number | string; reference?: string; status?: string; purchased_at?: string; tickets?: EventTicketResource[] }
export interface EventListResource {
  id: number | string; title: string; description?: string; category?: string; status: EventStatus;
  cover_image_url?: string | null; creator?: EventCreator; starts_at: string; ends_at: string; timezone?: string;
  event_type?: EventVenueType; venue_type?: EventVenueType; venue?: EventVenue; capacity: number; tickets_sold: number;
  tickets_remaining?: number; available_capacity?: number; is_sold_out: boolean; starting_ticket_price?: string | null; currency?: string;
  viewer?: { is_owner?: boolean; has_booked?: boolean; can_book?: boolean; can_edit?: boolean; bookings?: EventBooking[] };
}
export interface EventResource extends EventListResource {
  ticket_types: EventTicketType[]; bookings?: EventBooking[]; meeting_url?: string | null;
  creator_insights?: Record<string, unknown> | null;
}
export interface EventTicketPurchaseResource {
  event: EventResource;
  purchase: {
    id?: string | number; quantity: number; unit_price: string; total_amount: string; currency: string;
    ticket_type_code?: string; ticket_type_name?: string;
    reference: string; status?: string; purchased_at?: string; tickets: EventTicketResource[];
  };
}
export interface EventPage<T> { data: T[]; meta?: { current_page?: number; last_page?: number; per_page?: number; total?: number; next_page?: number | null; has_more?: boolean }; links?: { next?: string | null } }
export interface EventItemResponse<T> { data: T; message?: string }
export interface EventFormTicketType { code?: string; name: string; description?: string; price: string; quantity: number }
export interface EventFormPayload {
  title: string; description: string; category: string; venue_type: EventVenueType; venue_name?: string;
  venue_address?: string; meeting_url?: string; starts_at: string; ends_at: string; timezone: string;
  capacity: number; currency: string; cover_image?: { uri: string; name?: string; type?: string } | null;
  ticket_types: EventFormTicketType[]; status: EventStatus;
}
export interface PurchaseEventTicketsPayload { ticket_type_code?: string; ticket_type_name?: string; quantity: number; idempotency_key: string; metadata?: Record<string, unknown> }
export interface VerifyEventTicketPayload { ticket_id: string; signature: string }
