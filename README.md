# AMDEC Pro Web

Application web complète pour réaliser des **AMDEC Produit** (Analyse des Modes de Défaillance,
de leurs Effets et de leur Criticité — DFMEA), dans la lignée des logiciels professionnels type
Skill FMEA Pro.

## Fonctionnalités

- **Portefeuille d'études AMDEC** — création, duplication, suppression, import/export JSON,
  indicateurs globaux (lignes, actions, risques au-dessus des seuils).
- **Arborescence produit** (nomenclature) — Système → Sous-systèmes → Composants, avec
  référence/repère plan, notes, criticité max codée couleur par branche.
- **Analyse des défaillances** — par élément : fonction, mode de défaillance, cause, effet,
  contrôle/détection, cotation **F × G × D** avec grilles modifiables et criticité calculée
  automatiquement.
- **Criticité C = F×G×D** — seuils orange/rouge configurables, classement Acceptable /
  À surveiller / Inacceptable, code couleur dans toute l'application.
- **Caractéristiques spéciales** — détection automatique par règles de risque (**CC** si
  gravité ≥ 9, **SC** si C > seuil rouge, affichage avec astérisque) et figeage manuel par ligne.
- **Re-cotation après actions (C′)** — mesure de l'efficacité des actions : criticité résiduelle
  comparée à la criticité initiale.
- **Portefeuille d'actions centralisé** — actions préventives/correctives/détection, responsable,
  échéance, statut (À faire / En cours / Soldée), filtre « En retard », retour direct vers la
  ligne d'analyse.
- **Grilles de cotation éditables** — 10 niveaux F, G, D avec libellés et descriptions
  personnalisables par étude.
- **Synthèse & rapport** — KPI, répartition par classe de criticité, top risques, tableau complet
  trié par criticité décroissante, **impression PDF** (feuille de style dédiée) et **export CSV**
  (compatible Excel, séparateur `;` et BOM UTF-8).
- **Persistance locale** (localStorage) + export/import JSON d'une étude complète.

## Démarrage

```bash
npm install
npm run dev       # serveur de développement (http://localhost:5173)
npm run build     # build de production dans dist/
npm run preview   # sert le build de production
npm test          # tests unitaires (vitest)
```

Une **étude de démonstration** (module d'essuyage avant automobile) est créée au premier
lancement pour découvrir le principe : arborescence, lignes d'analyse cotées, actions, re-cotation.

## Méthodologie embarquée

| Notion | Convention |
| --- | --- |
| F (Fréquence) | probabilité d'apparition de la cause (1 → 10) |
| G (Gravité) | sévérité des effets pour le client (1 → 10) |
| D (Non-détection) | capacité des contrôles à ne pas détecter (1 → 10) |
| C = F×G×D | criticité, seuils par défaut : 40 (orange) / 100 (rouge), ajustables |
| CC / SC | caractéristiques critiques / significatives (référence AIAG-VDA) |

## Architecture

```
src/
  types.ts               modèle de données (étude, arborescence, lignes, actions)
  lib/
    fmea.ts              calculs métier : criticité, classes, statistiques, caract. spéciales
    structure.ts         arborescence (identifiants, parcours, suppression récursive)
    defaults.ts          grilles de cotation par défaut, fiche étude, jeu de démonstration
    storage.ts           persistance localStorage + normalisation des imports
    io.ts                export/import JSON, export CSV Excel, constructeurs de rapports
  components/
    StudyList.tsx        portefeuille d'études
    StudyView.tsx        vue étude (onglets, fiche, modales ligne/élément)
    StructureTree.tsx    arborescence produit
    AnalysisTable.tsx    tableau d'analyse par élément (cotation en ligne, criticité)
    ActionsView.tsx      portefeuille d'actions avec filtres
    GrillesEditor.tsx    grilles de cotation et seuils
    SynthesisView.tsx    KPI, graphes, top risques, rapport imprimable
    ui.tsx               primitives (Modal, champs, badges de criticité…)
```

## Notes

- Aucune donnée ne quitte le navigateur : l'application est 100 % côté client.
- Les graphiques sont volontairement en CSS pur (aucune dépendance de rendu).
- Stack : React 18 + TypeScript + Vite, tests unitaires Vitest sur les calculs d'AMDEC et
  l'export/import.
