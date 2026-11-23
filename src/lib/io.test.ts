import { describe, expect, it } from 'vitest';
import { buildStudyCSV, importStudyJSON, slug } from './io';
import { demoStudy } from './defaults';

describe('export CSV', () => {
  it('génère un CSV ; séparé, avec BOM, une ligne par ligne d’analyse', () => {
    const study = demoStudy();
    const csv = buildStudyCSV(study);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const dataLines = csv.slice(1).split('\r\n');
    expect(dataLines.length).toBe(study.lignes.length + 1);
    expect(dataLines[0]).toContain('C = F×G×D');
    expect(dataLines[1].split(';').length).toBeGreaterThanOrEqual(17);
  });

  it('échappe les guillemets et points-virgules', () => {
    const study = demoStudy();
    study.lignes[0].mode = 'mode avec "guillemets" et ; punto';
    const csv = buildStudyCSV(study);
    expect(csv).toContain('"mode avec ""guillemets"" et ; punto"');
  });
});

describe('import JSON', () => {
  it('accepte une étude exportée et complète les champs manquants', () => {
    const study = demoStudy();
    const roundtrip = importStudyJSON(JSON.stringify(study));
    expect(roundtrip.lignes.length).toBe(study.lignes.length);
    expect(roundtrip.lignes[0].actions.length).toBe(study.lignes[0].actions.length);
  });

  it('extrait la première étude d’un portefeuille exporté', () => {
    const study = demoStudy();
    study.nom = 'Depuis portefeuille';
    const imported = importStudyJSON(JSON.stringify({ version: 1, etudes: [study] }));
    expect(imported.nom).toBe('Depuis portefeuille');
  });

  it('rejette un JSON non reconnu', () => {
    expect(() => importStudyJSON(JSON.stringify({ foo: 1 }))).toThrow();
  });
});

describe('slug', () => {
  it('débarrasse accents et caractères spéciaux', () => {
    expect(slug('Étude AMDEC — moteur !')).toBe('etude-amdec-moteur');
  });
});
