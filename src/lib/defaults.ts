import type { GrilleLevel, Study, Workspace } from '../types';
import type { Grilles } from '../types';
import { makeId } from './structure';

export const WORKSPACE_KEY = 'amdec-pro-web/workspace/v1';
export const WORKSPACE_VERSION = 1;

function levels(pairs: [string, string][]): GrilleLevel[] {
  return pairs.map(([label, description], i) => ({ value: i + 1, label, description }));
}

export const DEFAULT_GRILLES: Grilles = {
  f: levels([
    ['Quasi impossible', 'Défaillance pratiquement exclue (< 1 sur 1 500 000)'],
    ['Très improbable', 'Raréfaction extrême (~ 1 sur 150 000)'],
    ['Très rare', 'Quelques cas connus isolés (~ 1 sur 15 000)'],
    ['Rare', 'Défaillance peu fréquente (~ 1 sur 2 000)'],
    ['Peu fréquent', 'Défaillance occasionnelle (~ 1 sur 400)'],
    ['Occasionnel', 'Défaillance possible (~ 1 sur 80)'],
    ['Fréquent', 'Défaillance régulière (~ 1 sur 20)'],
    ['Répété', 'Défaillances récurrentes (~ 1 sur 8)'],
    ['Très fréquent', 'Défaillance quasi inévitable (~ 1 sur 3)'],
    ['Inévitable', 'La défaillance survient quasi systématiquement']
  ]),
  g: levels([
    ['Aucune conséquence', 'Aucun effet perceptible sur le client'],
    ['Très mineure', 'Défaut esthétique invisible pour le client'],
    ['Mineure', 'Fonction dégradée, faible gêne client'],
    ['Modérée', 'Confort réduit, client agacé'],
    ['Significative', 'Fonction secondaire perdue, client mécontent'],
    ['Majeure', 'Perte d’une fonction principale, réparation nécessaire'],
    ['Sévère', 'Véhicule / produit immobilisé, client fortement mécontent'],
    ['Très sévère', 'Dégâts matériels sur le produit ou son environnement'],
    ['Critique', 'Sécurité compromise avec avertissement'],
    ['Catastrophique', 'Non-conformité réglementaire ou sécurité compromise sans avertissement']
  ]),
  d: levels([
    ['Quasi certaine', 'Détection certaine : contrôle automatisé à 100 %'],
    ['Très élevée', 'Détection quasi certaine (contrôle systématique)'],
    ['Élevée', 'Bonne détection par contrôle automatique échantillonné'],
    ['Modérée à élevée', 'Détection rapide par contrôle en cours de fabrication'],
    ['Modérée', 'Contrôle manuel sur une partie de la production'],
    ['Faible à modérée', 'Détection possible, contrôle non systématique'],
    ['Faible', 'Détection tardive par inspection visuelle'],
    ['Très faible', 'Aucun contrôle en cours, détection par le client final'],
    ['Détection improbable', 'Aucun contrôle possible au stade de production'],
    ['Nulle', 'Cause non détectable, aucune méthode de contrôle identifiée']
  ])
};

export function newLine(nodeId: string, partial: Partial<Study['lignes'][number]> = {}) {
  return {
    id: makeId(),
    nodeId,
    fonction: '',
    mode: '',
    cause: '',
    effet: '',
    controle: '',
    f: 2,
    g: 4,
    d: 3,
    special: '' as const,
    actions: [],
    fPost: null,
    gPost: null,
    dPost: null,
    postCotation: false,
    ...partial
  };
}

export function createStudy(nom = 'Nouvelle étude AMDEC produit'): Study {
  return {
    id: makeId(),
    nom,
    produit: '',
    reference: '',
    responsable: '',
    equipe: '',
    dateCreation: new Date().toISOString().slice(0, 10),
    dateRevision: new Date().toISOString().slice(0, 10),
    revision: 'A',
    objectif: '',
    perimetre: '',
    seuilOrange: 40,
    seuilRouge: 100,
    grilles: structuredClone(DEFAULT_GRILLES),
    structure: [
      {
        id: makeId(),
        kind: 'systeme',
        label: 'Produit analysé',
        reference: '',
        note: '',
        children: []
      }
    ],
    lignes: []
  };
}

const n = (label: string, kind: 'systeme' | 'sousSysteme' | 'composant', children: any[] = [], reference = '') => ({
  id: makeId(),
  kind,
  label,
  reference,
  note: '',
  children
});

export function demoStudy(): Study {
  const vehicule = n('Berline familiale C-2026', 'systeme', [
    n('Module d’essuyage avant', 'sousSysteme', [
      n('Moteur d’essuie-glace', 'composant', [], 'A12-457'),
      n('Balai d’essuyage', 'composant', [], 'B3-780'),
      n('Tringlerie / linkage', 'composant', [], 'C1-113')
    ], 'SV-01'),
    n('Module éclairage', 'sousSysteme', [
      n('Boîtier de phare', 'composant', [], 'D2-310')
    ], 'EV-02')
  ]);

  const moteurId = vehicule.children[0].children[0].id;
  const balaiId = vehicule.children[0].children[1].id;
  const boitierId = vehicule.children[1].children[0].id;

  const study = createStudy('Essuyage avant — AMDEC produit (démonstration)');
  study.produit = 'Berline familiale C-2026';
  study.reference = 'AMDEC-P-2026-014';
  study.responsable = 'A. Martin (Quality Lead)';
  study.equipe = 'BE mécanique, BE électronique, Qualité, Production';
  study.objectif =
    'Identifier les modes de défaillance du module d’essuyage avant du produit, évaluer leur criticité (C = F×G×D) et définir les actions réduisant F ou D.';
  study.perimetre = 'Module essuyage avant + module éclairage, stades conception et validation';
  study.structure = [vehicule];
  study.lignes = [
    newLine(moteurId, {
      fonction: 'Entraîner les balais selon la vitesse demandée',
      mode: 'Blocage mécanique du rotor',
      cause: 'Grippage du roulement à billes (graisse dégradée)',
      effet: 'Perte totale de l’essuyage, visibilité dégradée par temps de pluie',
      controle: 'Essai d’endurance durée de vie sur banc (échantillonnage)',
      f: 3, g: 9, d: 3,
      actions: [
        {
          id: makeId(),
          description: 'Spécifier une graisse résistante à l’endurance et auditer le fournisseur roulement',
          type: 'Préventive',
          responsable: 'BE mécanique',
          echeance: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          statut: 'En cours',
          note: 'Plan de validation fournisseur à établir'
        }
      ]
    }),
    newLine(moteurId, {
      fonction: 'Entraîner les balais selon la vitesse demandée',
      mode: 'Surchauffe en service',
      cause: 'Calibre thermique de l’enroulement insuffisant en ambiance 80 °C',
      effet: 'Arrêt de l’essuyage, odeur de brûlé, risque de fusion du connecteur',
      controle: 'Essai thermique en chambre climatique',
      f: 2, g: 9, d: 4, postCotation: true, fPost: 1, dPost: 2
    }),
    newLine(balaiId, {
      fonction: 'Nettoyer le pare-brise sur la zone balayée',
      mode: 'Mauvais essuyage (zones non nettoyées)',
      cause: 'Angle d’attaque du bras incorrect après cyclage thermique',
      effet: 'Confort dégradé, insatisfaction client',
      controle: 'Contrôle géométrique attaque au poste d’assemblage',
      f: 6, g: 4, d: 5,
      actions: [
        {
          id: makeId(),
          description: 'Ajouter une cale de calage au montage du bras',
          type: 'Corrective',
          responsable: 'Production',
          echeance: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
          statut: 'Soldée',
          note: 'Recotation F/D après 3 mois de surveillance'
        }
      ]
    }),
    newLine(boitierId, {
      fonction: 'Protéger l’optique et loger la source lumineuse',
      mode: 'Entrée d’eau dans le boîtier',
      cause: 'Joint d’étanchéité mal positionné lors du sertissage',
      effet: 'Condensation, perte de visibilité de nuit, non-conformité réglementaire',
      controle: 'Essai d’immersion + contrôle vidéo du sertissage',
      f: 5, g: 10, d: 6,
      special: 'CC'
    })
  ];
  return study;
}

export function emptyWorkspace(): Workspace {
  return { version: WORKSPACE_VERSION, etudes: [demoStudy()] };
}
