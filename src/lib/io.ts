import type { FailureLine, Study, Workspace } from '../types';
import { criticity, postCriticity, specialOf } from './fmea';
import { flattenStructure, findNode } from './structure';
import { normalizeStudy } from './storage';

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportWorkspaceJSON(w: Workspace): void {
  downloadFile(
    'amdec-portefeuille.json',
    JSON.stringify(w, null, 2),
    'application/json;charset=utf-8'
  );
}

export function exportStudyJSON(study: Study): void {
  downloadFile(
    `${slug(study.nom)}.amdec.json`,
    JSON.stringify(study, null, 2),
    'application/json;charset=utf-8'
  );
}

export function importStudyJSON(text: string): Study {
  const parsed = JSON.parse(text) as unknown;
  const candidate =
    parsed && typeof parsed === 'object' && 'lignes' in (parsed as object)
      ? parsed
      : parsed && typeof parsed === 'object' && 'etudes' in (parsed as object)
        ? ((parsed as { etudes: unknown[] }).etudes[0] ?? null)
        : null;
  if (!candidate) throw new Error('Fichier JSON non reconnu comme une étude AMDEC');
  return normalizeStudy(candidate);
}

export function slug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'etude';
}

function csvEscape(value: string): string {
  const v = value.replace(/\r?\n/g, ' ').trim();
  return /[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function buildStudyCSV(study: Study): string {
  const flat = flattenStructure(study.structure);
  const labelOf = (id: string) => {
    const node = findNode(study.structure, id);
    return node ? flat.find((f) => f.node.id === id)?.path ?? node.label : '(élément supprimé)';
  };
  const header = [
    'N°',
    'Élément (arborescence)',
    'Fonction',
    'Mode de défaillance',
    'Cause',
    'Effet',
    'Contrôle / Détection',
    'F (Fréquence)',
    'G (Gravité)',
    'D (Non-détection)',
    'C = F×G×D',
    'C après actions',
    'Caractéristique spéciale',
    'Actions',
    'Responsables',
    'Échéances',
    'Statut actions'
  ];
  const rows: string[][] = [];
  const ordered = sortLinesByCriticity(study.lignes);
  ordered.forEach((line, index) => {
    rows.push([
      String(index + 1),
      labelOf(line.nodeId),
      line.fonction,
      line.mode,
      line.cause,
      line.effet,
      line.controle,
      String(line.f),
      String(line.g),
      String(line.d),
      String(criticity(line)),
      postCriticity(line) !== null ? String(postCriticity(line)) : '',
      specialOf(line, study) ?? '',
      line.actions.map((a) => a.description).join(' | '),
      line.actions.map((a) => a.responsable).join(' | '),
      line.actions.map((a) => a.echeance).join(' | '),
      line.actions.map((a) => a.statut).join(' | ')
    ]);
  });
  const linesCsv = [header, ...rows].map((row) => row.map(csvEscape).join(';')).join('\r\n');
  return '\uFEFF' + linesCsv;
}

export function exportStudyCSV(study: Study): void {
  downloadFile(`${slug(study.nom)}.csv`, buildStudyCSV(study), 'text/csv;charset=utf-8');
}

export function sortLinesByCriticity(lines: FailureLine[]): FailureLine[] {
  return [...lines].sort((a, b) => criticity(b) - criticity(a));
}
