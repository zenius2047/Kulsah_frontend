import { describe, expect, it } from 'vitest';
import { createEventFormData, createIdempotencyKey, decimalToMinorUnits, getEventRemaining, getMaxPurchaseQuantity, getTicketTypeRemaining, multiplyDecimal, normalizeEventId } from '../src/utils/events';

describe('event API utilities', () => {
  it('normalizes numeric and formatted event IDs', () => {
    expect(normalizeEventId(2)).toBe(2);
    expect(normalizeEventId('2')).toBe(2);
    expect(normalizeEventId('event_2')).toBe(2);
  });
  it.each(['0', '-1', 'event_x', 'post_2', ''])('rejects invalid event ID %s', (id) => expect(() => normalizeEventId(id)).toThrow());
  it('calculates totals without floating point arithmetic', () => {
    expect(decimalToMinorUnits('100.0000')).toBe(1000000n);
    expect(multiplyDecimal('100.1250', 2)).toBe('200.2500');
  });
  it('calculates event and ticket availability and caps purchases at 100', () => {
    expect(getEventRemaining({ capacity: 150, tickets_sold: 20 })).toBe(130);
    expect(getTicketTypeRemaining({ quantity: 80, sold_count: 30 })).toBe(50);
    expect(getMaxPurchaseQuantity({ capacity: 150, tickets_sold: 20 }, { quantity: 80, sold_count: 30 })).toBe(50);
    expect(getMaxPurchaseQuantity({ capacity: 1000, tickets_sold: 0 }, { quantity: 500, sold_count: 0 })).toBe(100);
    expect(getMaxPurchaseQuantity({ capacity: 1000, tickets_sold: 0 }, { quantity: 500, sold_count: 0, maximum_per_order: 6 })).toBe(6);
  });
  it('creates UUID idempotency keys and separate attempts get separate keys', () => {
    const first = createIdempotencyKey(); const second = createIdempotencyKey();
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(second).not.toBe(first);
  });
  it('serializes Laravel-compatible nested ticket fields and preserves codes', () => {
    const form = createEventFormData({
      title: 'Launch', description: 'Album launch', category: 'music', venue_type: 'physical',
      venue_name: 'Arena', venue_address: 'Accra', starts_at: '2026-09-01T18:00:00Z', ends_at: '2026-09-01T21:00:00Z',
      timezone: 'Africa/Accra', capacity: 100, currency: 'GHS', status: 'published',
      ticket_types: [{ code: 'regular', name: 'Regular', description: 'Entry', price: '100.0000', quantity: 100 }],
    });
    expect(form.get('ticket_types[0][code]')).toBe('regular');
    expect(form.get('ticket_types[0][price]')).toBe('100.0000');
    expect(form.get('ticket_types[0][quantity]')).toBe('100');
  });
});
