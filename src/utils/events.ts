import type { EventFormPayload } from '../types/event.types';

export const normalizeEventId = (value: string | number): number => {
  const raw = typeof value === 'number' ? String(value) : value.trim();
  const match = /^(?:event_)?(\d+)$/.exec(raw);
  const id = match ? Number(match[1]) : NaN;
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Event ID must be a positive integer.');
  return id;
};

export const createIdempotencyKey = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === 'function') globalThis.crypto.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const getEventRemaining = (event: { capacity?: number; tickets_sold?: number; stats?: { tickets_sold?: number } }) =>
  Math.max(0, Number(event.capacity ?? 0) - Number(event.stats?.tickets_sold ?? event.tickets_sold ?? 0));

export const getTicketTypeRemaining = (ticket: { available_quantity?: number; remaining_count?: number; quantity?: number; sold_quantity?: number; sold_count?: number }) =>
  Math.max(0, Number(ticket.available_quantity ?? ticket.remaining_count ?? (Number(ticket.quantity ?? 0) - Number(ticket.sold_quantity ?? ticket.sold_count ?? 0))));

export const getMaxPurchaseQuantity = (
  event: Parameters<typeof getEventRemaining>[0],
  ticket: Parameters<typeof getTicketTypeRemaining>[0] & { maximum_per_order?: number },
) => Math.min(100, Number(ticket.maximum_per_order ?? 100), getEventRemaining(event), getTicketTypeRemaining(ticket));

export const decimalToMinorUnits = (value: string, scale = 4): bigint => {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) throw new Error('Invalid monetary value.');
  const [whole, fraction = ''] = normalized.split('.');
  return BigInt(whole) * 10n ** BigInt(scale) + BigInt((fraction + '0'.repeat(scale)).slice(0, scale));
};

export const multiplyDecimal = (value: string, quantity: number, scale = 4) => {
  if (!Number.isSafeInteger(quantity) || quantity < 0) throw new Error('Invalid quantity.');
  const minor = decimalToMinorUnits(value, scale) * BigInt(quantity);
  const padded = minor.toString().padStart(scale + 1, '0');
  return `${padded.slice(0, -scale)}.${padded.slice(-scale)}`;
};

export const createEventFormData = (payload: EventFormPayload) => {
  const form = new FormData();
  const fields: Array<[string, string | number | undefined]> = [
    ['title', payload.title], ['description', payload.description], ['category', payload.category],
    ['venue_type', payload.venue_type], ['venue_name', payload.venue_name], ['venue_address', payload.venue_address],
    ['meeting_url', payload.meeting_url], ['starts_at', payload.starts_at], ['ends_at', payload.ends_at],
    ['timezone', payload.timezone], ['capacity', payload.capacity], ['currency', payload.currency], ['status', payload.status],
  ];
  fields.forEach(([key, value]) => { if (value !== undefined && value !== '') form.append(key, String(value)); });
  payload.ticket_types.forEach((ticket, index) => {
    if (ticket.code) form.append(`ticket_types[${index}][code]`, ticket.code);
    form.append(`ticket_types[${index}][name]`, ticket.name);
    form.append(`ticket_types[${index}][description]`, ticket.description ?? '');
    form.append(`ticket_types[${index}][price]`, ticket.price);
    form.append(`ticket_types[${index}][quantity]`, String(ticket.quantity));
  });
  if (payload.cover_image) form.append('cover_image', { uri: payload.cover_image.uri, name: payload.cover_image.name ?? 'event-cover.jpg', type: payload.cover_image.type ?? 'image/jpeg' } as any);
  return form;
};
