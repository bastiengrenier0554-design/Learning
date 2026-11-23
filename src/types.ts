export type NodeKind = 'systeme' | 'sousSysteme' | 'composant';

export interface StructureNode {
  id: string;
  kind: NodeKind;
  label: string;
  reference: string;
  note: string;
  children: StructureNode[];
}

export interface GrilleLevel {
  value: number;
  label: string;
  description: string;
}

export type ActionStatut = 'A faire' | 'En cours' | 'Soldée';
export type ActionType = 'Préventive' | 'Corrective' | 'Détection';

export interface LineAction {
  id: string;
  description: string;
  type: ActionType;
  responsable: string;
  echeance: string;
  statut: ActionStatut;
  note: string;
}

export type SpecialKind = '' | 'CC' | 'SC';

export interface FailureLine {
  id: string;
  nodeId: string;
  fonction: string;
  mode: string;
  cause: string;
  effet: string;
  controle: string;
  f: number;
  g: number;
  d: number;
  special: SpecialKind;
  actions: LineAction[];
  fPost: number | null;
  gPost: number | null;
  dPost: number | null;
  postCotation: boolean;
}

export interface Grilles {
  f: GrilleLevel[];
  g: GrilleLevel[];
  d: GrilleLevel[];
}

export interface Study {
  id: string;
  nom: string;
  produit: string;
  reference: string;
  responsable: string;
  equipe: string;
  dateCreation: string;
  dateRevision: string;
  revision: string;
  objectif: string;
  perimetre: string;
  seuilOrange: number;
  seuilRouge: number;
  grilles: Grilles;
  structure: StructureNode[];
  lignes: FailureLine[];
}

export interface Workspace {
  version: number;
  etudes: Study[];
}

export type CriticityClass = 'ok' | 'surveillance' | 'critique';
