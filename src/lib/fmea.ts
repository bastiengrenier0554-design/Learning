import type { CriticityClass, FailureLine, Study, StructureNode } from '../types';
import { descendantIds } from './structure';

const MAX_RATING = 10;

export function clampRating(value: number): number {
  if (Number.isNaN(value)) return 1;
  return Math.min(MAX_RATING, Math.max(1, Math.round(value)));
}

export function criticity(line: FailureLine): number {
  return clampRating(line.f) * clampRating(line.g) * clampRating(line.d);
}

export function postCriticity(line: FailureLine): number | null {
  if (!line.postCotation) return null;
  return (
    (line.fPost ?? line.f) * (line.gPost ?? line.g) * (line.dPost ?? line.d)
  );
}

export function criticityClass(c: number, seuilOrange: number, seuilRouge: number): CriticityClass {
  if (c > seuilRouge) return 'critique';
  if (c > seuilOrange) return 'surveillance';
  return 'ok';
}

export function proposedSpecial(line: FailureLine, study: Study): 'CC' | 'SC' | null {
  if (clampRating(line.g) >= 9) return 'CC';
  if (criticity(line) > study.seuilRouge) return 'SC';
  return null;
}

export function specialOf(line: FailureLine, study: Study): 'CC' | 'SC' | null {
  if (line.special) return line.special;
  return proposedSpecial(line, study);
}

export interface NodeStats {
  lineCount: number;
  actionCount: number;
  openActionCount: number;
  maxCriticity: number;
  maxPostCriticity: number;
  specialCount: number;
  worstClass: CriticityClass;
}

export function linesOfNode(study: Study, nodeId: string): FailureLine[] {
  const node = findTreeNode(study.structure, nodeId);
  if (!node) return [];
  const ids = new Set(descendantIds(node));
  return study.lignes.filter((l) => ids.has(l.nodeId));
}

function findTreeNode(nodes: StructureNode[], id: string): StructureNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findTreeNode(node.children, id);
    if (found) return found;
  }
  return undefined;
}

export function nodeStats(
  study: Study,
  node: StructureNode,
  seuilOrange: number,
  seuilRouge: number
): NodeStats {
  const lines = linesOfNode(study, node.id);
  const actions = lines.flatMap((l) => l.actions);
  const classes = lines.map((l) => {
    const c = postCriticity(l) ?? criticity(l);
    return criticityClass(c, seuilOrange, seuilRouge);
  });
  const postValues = lines
    .map((l) => postCriticity(l))
    .filter((v): v is number => v !== null);
  const worst: CriticityClass = classes.includes('critique')
    ? 'critique'
    : classes.includes('surveillance')
      ? 'surveillance'
      : 'ok';
  return {
    lineCount: lines.length,
    actionCount: actions.length,
    openActionCount: actions.filter((a) => a.statut !== 'Soldée').length,
    maxCriticity: lines.length ? Math.max(...lines.map(criticity)) : 0,
    maxPostCriticity: postValues.length ? Math.max(...postValues) : 0,
    specialCount: lines.filter((l) => specialOf(l, study) !== null).length,
    worstClass: worst
  };
}

export interface StudyStats {
  lineCount: number;
  actionCount: number;
  openActionCount: number;
  doneActionCount: number;
  counts: Record<CriticityClass, number>;
  averageC: number;
  maxC: number;
  specialCount: number;
}

export function studyStats(study: Study): StudyStats {
  const counts: Record<CriticityClass, number> = { ok: 0, surveillance: 0, critique: 0 };
  let total = 0;
  let max = 0;
  for (const line of study.lignes) {
    const c = postCriticity(line) ?? criticity(line);
    counts[criticityClass(c, study.seuilOrange, study.seuilRouge)] += 1;
    total += criticity(line);
    max = Math.max(max, c);
  }
  const actions = study.lignes.flatMap((l) => l.actions);
  return {
    lineCount: study.lignes.length,
    actionCount: actions.length,
    openActionCount: actions.filter((a) => a.statut !== 'Soldée').length,
    doneActionCount: actions.filter((a) => a.statut === 'Soldée').length,
    counts,
    averageC: study.lignes.length ? Math.round(total / study.lignes.length) : 0,
    maxC: max,
    specialCount: study.lignes.filter((l) => specialOf(l, study) !== null).length
  };
}
