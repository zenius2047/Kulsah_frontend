import { describe, expect, it } from 'vitest';
import { endpoints } from '../src/api/endpoints';

describe('discovery API contract', () => {
  it('uses the authenticated general discovery endpoint', () => {
    expect(endpoints.general.discovery).toBe('general/discovery');
  });
});
