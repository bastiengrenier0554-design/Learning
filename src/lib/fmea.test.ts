import { describe, expect, it } from 'vitest';
import { clampRating, criticity, criticityClass, postCriticity, proposedSpecial } from './fmea';
import type { FailureLine } from '../types';

const base: FailureLine = {
  id: 'l1',
  nodeId: 'n1',
  fonction: 'fonction',
  mode: 'mode',
  cause: 'cause',
  effet: 'effet',
  controle: 'controle',
  f: 5,
  g: 6,
  d: 4,
  special: '',
  actions: [],
  fPost: null,
  gPost: null,
  dPost: null,
  postCotation: false
};

describe('criticité', () => {
  it('calcule C = F × G × D', () => {
    expect(criticity({ ...base, f: 8, g: 9, d: 3 })).toBe(216);
  });

  it('calcule la criticité résiduelle uniquement si re-cotation autorisée', () => {
    expect(postCriticity({ ...base, fPost: 2, dPost: 2 })).toBeNull();
    expect(postCriticity({ ...base, fPost: 2, dPost: 2, postCotation: true })).toBe(2 * 6 * 2);
    expect(postCriticity({ ...base, fPost: 2, postCotation: true })).toBe(2 * 6 * 4);
  });
});

describe('classes de criticité', () => {
  it('utilise les seuils de l’étude (orange inclus, rouge exclu)', () => {
    expect(criticityClass(40, 40, 100)).toBe('ok');
    expect(criticityClass(41, 40, 100)).toBe('surveillance');
    expect(criticityClass(100, 40, 100)).toBe('surveillance');
    expect(criticityClass(101, 40, 100)).toBe('critique');
  });
});

describe('caractéristiques spéciales', () => {
  it('propose CC pour une gravité ≥ 9', () => {
    expect(proposedSpecial({ ...base, g: 9 }, etude())).toBe('CC');
  });

  it('propose SC au-dessus du seuil rouge', () => {
    expect(proposedSpecial({ ...base, f: 10, g: 9, d: 3 }, etude())).toBe('CC');
    expect(
      proposedSpecial({ ...base, f: 10, g: 4, d: 10 }, etude())
    ).toBe('SC');
    expect(proposedSpecial({ ...base, f: 2, g: 4, d: 2 }, etude())).toBeNull();
  });
});

describe('clampRating', () => {
  it('ramène la note entre 1 et 10', () => {
    expect(clampRating(0)).toBe(1);
    expect(clampRating(11)).toBe(10);
    expect(clampRating(Number.NaN)).toBe(1);
  });
});

function etude() {
  return {
    seuilOrange: 40,
    seuilRouge: 100
  } as import('../types').Study;
}
