import { describe, it, expect } from 'vitest';
import { diaAR, horaAR, formatHora, hoyAR } from './fecha';

// 01:00 UTC del 13 es las 22:00 del 12 en Argentina (UTC-3)
const MEDIANOCHE_UTC_AR_NOCHE = '2026-10-13T01:00:00.000Z';

describe('hora de Argentina', () => {
  it('diaAR usa el día argentino, no el UTC', () => {
    expect(diaAR(MEDIANOCHE_UTC_AR_NOCHE)).toBe('2026-10-12');
  });

  it('horaAR devuelve la hora argentina', () => {
    expect(horaAR(MEDIANOCHE_UTC_AR_NOCHE)).toBe('22:00');
  });

  it('formatHora muestra la hora argentina', () => {
    expect(formatHora(MEDIANOCHE_UTC_AR_NOCHE)).toMatch(/22:00/);
  });

  it('mediodía UTC es las 09:00 en Argentina', () => {
    expect(horaAR('2026-10-13T12:00:00.000Z')).toBe('09:00');
  });

  it('justo antes de medianoche argentina sigue siendo el día anterior', () => {
    expect(diaAR('2026-10-13T02:59:00.000Z')).toBe('2026-10-12');
  });

  it('hoyAR devuelve formato YYYY-MM-DD', () => {
    expect(hoyAR()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});