import type { FailureLine, LineAction, Study, Workspace } from '../types';
import { DEFAULT_GRILLES, WORKSPACE_KEY, WORKSPACE_VERSION, demoStudy } from './defaults';
import { makeId } from './structure';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeStudy(raw: unknown): Study {
  if (!isPlainObject(raw)) throw new Error('Étude invalide');
  const now = new Date().toISOString().slice(0, 10);
  const grilles = isPlainObject(raw.grilles) ? raw.grilles : {};
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : makeId(),
    nom: typeof raw.nom === 'string' ? raw.nom : 'Étude importée',
    produit: typeof raw.produit === 'string' ? raw.produit : '',
    reference: typeof raw.reference === 'string' ? raw.reference : '',
    responsable: typeof raw.responsable === 'string' ? raw.responsable : '',
    equipe: typeof raw.equipe === 'string' ? raw.equipe : '',
    dateCreation: typeof raw.dateCreation === 'string' ? raw.dateCreation : now,
    dateRevision: typeof raw.dateRevision === 'string' ? raw.dateRevision : now,
    revision: typeof raw.revision === 'string' ? raw.revision : 'A',
    objectif: typeof raw.objectif === 'string' ? raw.objectif : '',
    perimetre: typeof raw.perimetre === 'string' ? raw.perimetre : '',
    seuilOrange: typeof raw.seuilOrange === 'number' ? raw.seuilOrange : 40,
    seuilRouge: typeof raw.seuilRouge === 'number' ? raw.seuilRouge : 100,
    grilles: {
      f: Array.isArray(grilles.f) && grilles.f.length ? grilles.f : DEFAULT_GRILLES.f,
      g: Array.isArray(grilles.g) && grilles.g.length ? grilles.g : DEFAULT_GRILLES.g,
      d: Array.isArray(grilles.d) && grilles.d.length ? grilles.d : DEFAULT_GRILLES.d
    },
    structure: Array.isArray(raw.structure) ? raw.structure : [],
    lignes: Array.isArray(raw.lignes) ? raw.lignes.filter(isPlainObject).map(normalizeLine) : []
  } as Study;
}

function normalizeLine(raw: Record<string, unknown>): FailureLine {
  const pick = (key: string): string => (typeof raw[key] === 'string' ? (raw[key] as string) : '');
  const num = (key: string, fallback: number): number =>
    typeof raw[key] === 'number' ? (raw[key] as number) : fallback;
  const actions = Array.isArray(raw.actions)
    ? (raw.actions as Record<string, unknown>[]).map((a): LineAction => ({
        id: typeof a.id === 'string' ? a.id : makeId(),
        description: typeof a.description === 'string' ? a.description : '',
        type:
          a.type === 'Préventive' || a.type === 'Corrective' || a.type === 'Détection'
            ? a.type
            : 'Corrective',
        responsable: typeof a.responsable === 'string' ? a.responsable : '',
        echeance: typeof a.echeance === 'string' ? a.echeance : '',
        statut:
          a.statut === 'A faire' || a.statut === 'En cours' || a.statut === 'Soldée'
            ? a.statut
            : 'A faire',
        note: typeof a.note === 'string' ? a.note : ''
      }))
    : [];
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : makeId(),
    nodeId: typeof raw.nodeId === 'string' ? raw.nodeId : '',
    fonction: pick('fonction'),
    mode: pick('mode'),
    cause: pick('cause'),
    effet: pick('effet'),
    controle: pick('controle'),
    f: num('f', 1),
    g: num('g', 1),
    d: num('d', 1),
    special: raw.special === 'CC' || raw.special === 'SC' ? raw.special : '',
    actions,
    fPost: typeof raw.fPost === 'number' ? raw.fPost : null,
    gPost: typeof raw.gPost === 'number' ? raw.gPost : null,
    dPost: typeof raw.dPost === 'number' ? raw.dPost : null,
    postCotation: raw.postCotation === true
  };
}

export function loadWorkspace(): Workspace {
  try {
    const raw = localStorage.getItem(WORKSPACE_KEY);
    if (!raw) return { version: WORKSPACE_VERSION, etudes: [demoStudy()] };
    const parsed = JSON.parse(raw) as { etudes?: unknown[] };
    const etudes = Array.isArray(parsed.etudes) ? parsed.etudes.map(normalizeStudy) : [];
    if (etudes.length === 0) return { version: WORKSPACE_VERSION, etudes: [demoStudy()] };
    return { version: WORKSPACE_VERSION, etudes };
  } catch {
    return { version: WORKSPACE_VERSION, etudes: [demoStudy()] };
  }
}

export function saveWorkspace(w: Workspace): void {
  localStorage.setItem(WORKSPACE_KEY, JSON.stringify({ ...w, version: WORKSPACE_VERSION }));
}
