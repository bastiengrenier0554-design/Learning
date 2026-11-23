import { useMemo, useState } from 'react';
import type { FailureLine, LineAction, Study, StructureNode } from '../types';
import { exportStudyCSV, exportStudyJSON } from '../lib/io';
import { makeId, removeNode } from '../lib/structure';
import { newLine } from '../lib/defaults';
import { proposedSpecial } from '../lib/fmea';
import AnalysisTable from './AnalysisTable';
import ActionsView from './ActionsView';
import GrillesEditor from './GrillesEditor';
import StructureTree from './StructureTree';
import SynthesisView from './SynthesisView';
import { Field, Modal, StatutSelect, TextArea, TextInput } from './ui';

type Tab = 'analyse' | 'grilles' | 'actions' | 'synthese';

type ModalState =
  | { kind: 'fiche' }
  | { kind: 'node-edit'; node: StructureNode; parentId: string | null }
  | { kind: 'line'; lineId: string }
  | null;

export default function StudyView({
  study,
  flash,
  onNotify,
  onBack,
  update
}: {
  study: Study;
  flash: string | null;
  onNotify: (msg: string) => void;
  onBack: () => void;
  update: (mutate: (draft: Study) => void) => void;
}) {
  const [tab, setTab] = useState<Tab>('analyse');
  const [modal, setModal] = useState<ModalState>(null);
  const [filterNodeId, setFilterNodeId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const line = useMemo(
    () => (modal?.kind === 'line' ? study.lignes.find((l) => l.id === modal.lineId) ?? null : null),
    [modal, study.lignes]
  );

  const saveLine = (updated: FailureLine) =>
    update((draft) => {
      draft.lignes = draft.lignes.map((l) => (l.id === updated.id ? updated : l));
    });

  const addLine = (nodeId: string) => {
    const created = newLine(nodeId);
    update((draft) => {
      draft.lignes.push(created);
    });
    setModal({ kind: 'line', lineId: created.id });
  };

  const deleteLine = (lineId: string) => {
    update((draft) => {
      draft.lignes = draft.lignes.filter((l) => l.id !== lineId);
    });
    onNotify('Ligne d’analyse supprimée');
  };

  const rate = (lineId: string, key: 'f' | 'g' | 'd', value: number) =>
    update((draft) => {
      const l = draft.lignes.find((x) => x.id === lineId);
      if (l) l[key] = value;
    });

  const setSpecial = (lineId: string, value: '' | 'CC' | 'SC') =>
    update((draft) => {
      const l = draft.lignes.find((x) => x.id === lineId);
      if (l) l.special = value;
    });

  return (
    <div className="page">
      <header className="topbar study-topbar">
        <div className="brand study-brand">
          <button className="btn btn-ghost" onClick={onBack} title="Retour au portefeuille">
            ←
          </button>
          <div className="study-title">
            <input
              className="study-name-input"
              value={study.nom}
              onChange={(e) => update((d) => (d.nom = e.target.value))}
              aria-label="Nom de l'étude"
            />
            <span className="muted small">
              {study.produit || 'Renseigner le produit'} · réf. {study.reference || '—'} · rév.{' '}
              {study.revision} · resp. {study.responsable || '—'}
            </span>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="btn" onClick={() => setModal({ kind: 'fiche' })}>
            Fiche d’étude
          </button>
          <button className="btn" onClick={() => exportStudyJSON(study)}>
            Exporter (.json)
          </button>
          <button className="btn" onClick={() => exportStudyCSV(study)}>
            Exporter (.csv)
          </button>
        </div>
      </header>

      {flash ? <div className="flash">{flash}</div> : null}

      <nav className="tabs">
        {(
          [
            ['analyse', 'Analyse des défaillances'],
            ['actions', 'Portefeuille d’actions'],
            ['grilles', 'Cotation & seuils'],
            ['synthese', 'Synthèse & rapport']
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button key={key} className={'tab' + (tab === key ? ' tab-active' : '')} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === 'analyse' ? (
        <div className="analysis-layout">
          <StructureTree
            study={study}
            selectedId={filterNodeId}
            onSelect={setFilterNodeId}
            onEdit={(node) => setModal({ kind: 'node-edit', node, parentId: findParentId(study, node.id) })}
            onAddChild={(parent) =>
              setModal({
                kind: 'node-edit',
                node: { id: '', kind: childKind(parent), label: '', reference: '', note: '', children: [] },
                parentId: parent.id
              })
            }
            onDelete={(node) => {
              const ids = new Set(collectIds(node));
              const count = study.lignes.filter((l) => ids.has(l.nodeId)).length;
              const msg = count
                ? `Supprimer « ${node.label} » et ses sous-éléments (${count} lignes d’analyse associées) ?`
                : `Supprimer « ${node.label} » ?`;
              if (!window.confirm(msg)) return;
              update((draft) => {
                draft.structure = removeNode(draft.structure, node.id);
                draft.lignes = draft.lignes.filter((l) => !ids.has(l.nodeId));
              });
              onNotify(`Élément « ${node.label} » supprimé`);
              setFilterNodeId(null);
            }}
          />
          <div className="analysis-main">
            <AnalysisTable
              study={study}
              filterNodeId={filterNodeId}
              collapsed={collapsed}
              onToggleCollapse={(id) =>
                setCollapsed((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                })
              }
              onEditLine={(l) => setModal({ kind: 'line', lineId: l.id })}
              onAddLine={addLine}
              onDeleteLine={deleteLine}
              onRate={rate}
              onSpecial={setSpecial}
            />
          </div>
        </div>
      ) : null}

      {tab === 'actions' ? (
        <ActionsView
          study={study}
          onStatut={(actionId, statut) =>
            update((draft) => {
              for (const l of draft.lignes) {
                const a = l.actions.find((x) => x.id === actionId);
                if (a) a.statut = statut;
              }
            })
          }
          onDeleteAction={(actionId) =>
            update((draft) => {
              for (const l of draft.lignes) l.actions = l.actions.filter((a) => a.id !== actionId);
            })
          }
          onOpenLine={(lineId) => setModal({ kind: 'line', lineId })}
        />
      ) : null}

      {tab === 'grilles' ? (
        <GrillesEditor
          study={study}
          update={update}
        />
      ) : null}

      {tab === 'synthese' ? <SynthesisView study={study} /> : null}

      {modal?.kind === 'fiche' ? <FicheModal study={study} onClose={() => setModal(null)} update={update} /> : null}

      {modal?.kind === 'node-edit' ? (
        <NodeModal
          initial={modal.node}
          parentId={modal.parentId}
          onClose={() => setModal(null)}
          onSave={(node, parentId) =>
            update((draft) => {
              if (node.id) {
                const target = findNodeRef(draft.structure, node.id);
                if (target) {
                  target.label = node.label;
                  target.reference = node.reference;
                  target.note = node.note;
                  target.kind = node.kind;
                }
              } else {
                const created: StructureNode = { ...node, id: makeId(), children: [] };
                if (parentId) {
                  const parent = findNodeRef(draft.structure, parentId);
                  parent?.children.push(created);
                } else {
                  draft.structure.push(created);
                }
              }
            })
          }
        />
      ) : null}

      {modal?.kind === 'line' && line ? (
        <LineModal
          study={study}
          line={line}
          onClose={() => setModal(null)}
          onSave={saveLine}
          onDelete={() => {
            deleteLine(line.id);
            setModal(null);
          }}
        />
      ) : null}
    </div>
  );
}

function collectIds(node: StructureNode): string[] {
  const ids = [node.id];
  for (const c of node.children) ids.push(...collectIds(c));
  return ids;
}

function findParentId(study: Study, nodeId: string): string | null {
  const direct = (nodes: StructureNode[], parent: string | null): string | null => {
    for (const node of nodes) {
      if (node.id === nodeId) return parent;
      const found = direct(node.children, node.id);
      if (found !== null) return found;
    }
    return null;
  };
  const found = direct(study.structure, null);
  return found === null && study.structure.some((node) => node.id === nodeId)
    ? null
    : found;
}

function findNodeRef(nodes: StructureNode[], id: string): StructureNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNodeRef(n.children, id);
    if (found) return found;
  }
  return undefined;
}

function childKind(parent: StructureNode): StructureNode['kind'] {
  if (parent.kind === 'systeme') return 'sousSysteme';
  return 'composant';
}

function FicheModal({
  study,
  onClose,
  update
}: {
  study: Study;
  onClose: () => void;
  update: (mutate: (draft: Study) => void) => void;
}) {
  const set = <K extends keyof Study>(key: K, value: Study[K]) => update((d) => (d[key] = value));
  return (
    <Modal title="Fiche d’étude AMDEC produit" onClose={onClose} wide>
      <div className="form-grid">
        <Field label="Nom de l’étude" grow>
          <TextInput value={study.nom} onChange={(e) => set('nom', e.target.value)} />
        </Field>
        <Field label="Produit analysé">
          <TextInput value={study.produit} onChange={(e) => set('produit', e.target.value)} />
        </Field>
        <Field label="Référence doc.">
          <TextInput value={study.reference} onChange={(e) => set('reference', e.target.value)} />
        </Field>
        <Field label="Responsable">
          <TextInput value={study.responsable} onChange={(e) => set('responsable', e.target.value)} />
        </Field>
        <Field label="Équipe AMDEC">
          <TextInput value={study.equipe} onChange={(e) => set('equipe', e.target.value)} />
        </Field>
        <Field label="Révision">
          <TextInput value={study.revision} onChange={(e) => set('revision', e.target.value)} />
        </Field>
        <Field label="Date de révision">
          <TextInput type="date" value={study.dateRevision} onChange={(e) => set('dateRevision', e.target.value)} />
        </Field>
        <Field label="Seuil orange (C > … à surveiller)">
          <TextInput type="number" min={1} max={999} value={study.seuilOrange} onChange={(e) => set('seuilOrange', Number(e.target.value))} />
        </Field>
        <Field label="Seuil rouge (C > … inacceptable)" hint="Un risque au-dessus du seuil rouge impose des actions (AIAG : réduction F ou D).">
          <TextInput type="number" min={1} max={1000} value={study.seuilRouge} onChange={(e) => set('seuilRouge', Number(e.target.value))} />
        </Field>
      </div>
      <Field label="Objectif de l’étude" grow>
        <TextArea rows={3} value={study.objectif} onChange={(e) => set('objectif', e.target.value)} />
      </Field>
      <Field label="Périmètre d’analyse" grow>
        <TextArea rows={2} value={study.perimetre} onChange={(e) => set('perimetre', e.target.value)} />
      </Field>
      <div className="modal-foot">
        <button className="btn btn-primary" onClick={onClose}>
          Fermer
        </button>
      </div>
    </Modal>
  );
}

function NodeModal({
  initial,
  parentId,
  onClose,
  onSave
}: {
  initial: StructureNode;
  parentId: string | null;
  onClose: () => void;
  onSave: (node: StructureNode, parentId: string | null) => void;
}) {
  const [node, setNode] = useState<StructureNode>(initial);
  const isNew = !initial.id;
  const set = <K extends keyof StructureNode>(key: K, value: StructureNode[K]) =>
    setNode((n) => ({ ...n, [key]: value }));

  return (
    <Modal
      title={isNew ? 'Ajouter un élément' : 'Modifier l’élément'}
      subtitle={parentId ? 'Élément fils du parent sélectionné' : 'Élément racine de l’arborescence'}
      onClose={onClose}
    >
      <div className="form-grid">
        <Field label="Type">
          <select className="input" value={node.kind} onChange={(e) => set('kind', e.target.value as StructureNode['kind'])}>
            <option value="systeme">Système</option>
            <option value="sousSysteme">Sous-système</option>
            <option value="composant">Composant</option>
          </select>
        </Field>
        <Field label="Libellé" grow>
          <TextInput autoFocus value={node.label} onChange={(e) => set('label', e.target.value)} placeholder="ex. Moteur d’essuie-glace" />
        </Field>
        <Field label="Référence / repère plan" grow>
          <TextInput value={node.reference} onChange={(e) => set('reference', e.target.value)} placeholder="ex. A12-457" />
        </Field>
      </div>
      <Field label="Note" grow>
        <TextArea rows={2} value={node.note} onChange={(e) => set('note', e.target.value)} />
      </Field>
      <div className="modal-foot">
        <button className="btn" onClick={onClose}>
          Annuler
        </button>
        <button
          className="btn btn-primary"
          disabled={!node.label.trim()}
          onClick={() => {
            onSave({ ...node, label: node.label.trim() }, parentId);
            onClose();
          }}
        >
          Enregistrer
        </button>
      </div>
    </Modal>
  );
}

export function LineModal({
  study,
  line,
  onClose,
  onSave,
  onDelete
}: {
  study: Study;
  line: FailureLine;
  onClose: () => void;
  onSave: (line: FailureLine) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState<FailureLine>(structuredClone(line));
  const set = <K extends keyof FailureLine>(key: K, value: FailureLine[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const addAction = () =>
    setDraft((d) => ({
      ...d,
      actions: [
        ...d.actions,
        { id: makeId(), description: '', type: 'Préventive', responsable: '', echeance: '', statut: 'A faire', note: '' }
      ]
    }));

  const proposal = proposedSpecial(draft, study);

  return (
    <Modal title="Ligne d’analyse AMDEC" subtitle="Mode de défaillance — cause — effet — évaluation — actions" onClose={onClose} wide>
      <Field label="Élément (arborescence)">
        <select
          className="input"
          value={draft.nodeId}
          onChange={(e) => set('nodeId', e.target.value)}
        >
          {flattenAll(study.structure).map(([id, path]) => (
            <option key={id} value={id}>
              {path}
            </option>
          ))}
        </select>
      </Field>
      <div className="form-grid">
        <Field label="Fonction / performance attendue" grow>
          <TextInput value={draft.fonction} onChange={(e) => set('fonction', e.target.value)} placeholder="ex. Entraîner les balais selon la vitesse demandée" />
        </Field>
        <Field label="Mode de défaillance" grow>
          <TextInput value={draft.mode} onChange={(e) => set('mode', e.target.value)} placeholder="ex. Blocage mécanique du rotor" />
        </Field>
        <Field label="Cause(s) potentielle(s)" grow>
          <TextArea rows={2} value={draft.cause} onChange={(e) => set('cause', e.target.value)} placeholder="ex. Grippage du roulement" />
        </Field>
        <Field label="Effet(s) client / produit" grow>
          <TextArea rows={2} value={draft.effet} onChange={(e) => set('effet', e.target.value)} placeholder="ex. Perte de l’essuyage" />
        </Field>
        <Field label="Contrôle / moyens de détection actuels" grow>
          <TextInput value={draft.controle} onChange={(e) => set('controle', e.target.value)} placeholder="ex. Essai endurance sur banc" />
        </Field>
      </div>

      <div className="rating-row">
        <Field label="F — Fréquence">
          <select
            className="input"
            value={draft.f}
            onChange={(e) => set('f', Number(e.target.value))}
            title={grilleDescription(study, 'f', draft.f)}
          >
            {study.grilles.f.map((l) => (
              <option key={l.value} value={l.value}>
                {l.value} — {l.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="G — Gravité">
          <select
            className="input"
            value={draft.g}
            onChange={(e) => set('g', Number(e.target.value))}
            title={grilleDescription(study, 'g', draft.g)}
          >
            {study.grilles.g.map((l) => (
              <option key={l.value} value={l.value}>
                {l.value} — {l.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="D — Non-détection">
          <select
            className="input"
            value={draft.d}
            onChange={(e) => set('d', Number(e.target.value))}
            title={grilleDescription(study, 'd', draft.d)}
          >
            {study.grilles.d.map((l) => (
              <option key={l.value} value={l.value}>
                {l.value} — {l.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="field">
          <span className="field-label">Criticité initiale</span>
          <span className={'crit-badge crit-' + classOfC(draft.f * draft.g * draft.d, study)}>{draft.f * draft.g * draft.d}</span>
        </div>
        <Field label="Caractéristique spéciale" hint={proposal ? `${proposal} proposée par les règles de risque (G ≥ 9 ou C > seuil rouge).` : undefined}>
          <select className="input" value={draft.special} onChange={(e) => set('special', e.target.value as FailureLine['special'])}>
            <option value="">—</option>
            <option value="CC">CC — caractéristique critique</option>
            <option value="SC">SC — caractéristique significative</option>
          </select>
        </Field>
      </div>

      <h3 className="section-title">Re-cotation après actions</h3>
      <div className="rating-row">
        <label className="check-field">
          <input
            type="checkbox"
            checked={draft.postCotation}
            onChange={(e) => {
              const on = e.target.checked;
              setDraft((d) => ({
                ...d,
                postCotation: on,
                fPost: on ? d.fPost ?? d.f : null,
                gPost: on ? d.gPost ?? d.g : null,
                dPost: on ? d.dPost ?? d.d : null
              }));
            }}
          />
          Cotation après actions (mesure d’efficacité)
        </label>
        {(['fPost', 'gPost', 'dPost'] as const).map((key) => {
          const grilleKey = key === 'fPost' ? 'f' : key === 'gPost' ? 'g' : 'd';
          return (
            <Field key={key} label={grilleLabel(key)}>
              <select
                className="input"
                value={draft[grilleKey]}
                disabled={!draft.postCotation}
                onChange={(e) => setDraft((d) => ({ ...d, [key]: Number(e.target.value) }))}
              >
                {study.grilles[grilleKey].map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.value} — {l.label}
                  </option>
                ))}
              </select>
            </Field>
          );
        })}
        {draft.postCotation ? (
          <div className="field">
            <span className="field-label">Criticité résiduelle</span>
            <span className={'crit-badge crit-' + classOfC((draft.fPost ?? draft.f) * (draft.gPost ?? draft.g) * (draft.dPost ?? draft.d), study)}>
              {(draft.fPost ?? draft.f) * (draft.gPost ?? draft.g) * (draft.dPost ?? draft.d)}
            </span>
          </div>
        ) : null}
      </div>

      <h3 className="section-title">Actions (prévention / correction / détection)</h3>
      {draft.actions.map((action, i) => (
        <ActionRow
          key={action.id}
          action={action}
          index={i + 1}
          onChange={(next) =>
            setDraft((d) => ({ ...d, actions: d.actions.map((a) => (a.id === action.id ? next : a)) }))
          }
          onDelete={() => setDraft((d) => ({ ...d, actions: d.actions.filter((a) => a.id !== action.id) }))}
        />
      ))}
      <button className="btn" onClick={addAction}>
        + Ajouter une action
      </button>

      <div className="modal-foot modal-foot-spaced">
        <button className="btn btn-danger" onClick={onDelete}>
          Supprimer la ligne
        </button>
        <div className="foot-right">
          <button className="btn" onClick={onClose}>
            Annuler
          </button>
          <button className="btn btn-primary" onClick={() => { onSave(draft); onClose(); }}>
            Enregistrer
          </button>
        </div>
      </div>
    </Modal>
  );
}

function grilleLabel(key: 'fPost' | 'gPost' | 'dPost'): string {
  return key === 'fPost' ? 'F après' : key === 'gPost' ? 'G après' : 'D après';
}

function grilleDescription(study: Study, key: 'f' | 'g' | 'd', value: number): string {
  const level = study.grilles[key].find((l) => l.value === value);
  return level ? `${key.toUpperCase()} ${value} — ${level.label} : ${level.description}` : '';
}

function classOfC(c: number, study: Study): 'ok' | 'surveillance' | 'critique' {
  if (c > study.seuilRouge) return 'critique';
  if (c > study.seuilOrange) return 'surveillance';
  return 'ok';
}

export function ActionRow({
  action,
  index,
  onChange,
  onDelete
}: {
  action: LineAction;
  index?: number;
  onChange: (action: LineAction) => void;
  onDelete: () => void;
}) {
  const set = <K extends keyof LineAction>(key: K, value: LineAction[K]) =>
    onChange({ ...action, [key]: value });
  return (
    <div className="action-block">
      <div className="form-grid action-grid">
        <span className="action-index">{index ?? '•'}</span>
        <Field label="Action" grow>
          <TextInput value={action.description} onChange={(e) => set('description', e.target.value)} placeholder="ex. Spécifier une graisse résistante à l’endurance" />
        </Field>
        <Field label="Type">
          <select className="input" value={action.type} onChange={(e) => set('type', e.target.value as LineAction['type'])}>
            <option>Préventive</option>
            <option>Corrective</option>
            <option>Détection</option>
          </select>
        </Field>
        <Field label="Responsable">
          <TextInput value={action.responsable} onChange={(e) => set('responsable', e.target.value)} />
        </Field>
        <Field label="Échéance">
          <TextInput type="date" value={action.echeance} onChange={(e) => set('echeance', e.target.value)} />
        </Field>
        <Field label="Statut">
          <StatutSelect value={action.statut} onChange={(v) => set('statut', v)} />
        </Field>
        <button className="icon-btn action-del" title="Supprimer l’action" onClick={onDelete}>
          🗑
        </button>
      </div>
    </div>
  );
}

function flattenAll(nodes: StructureNode[], prefix = ''): [string, string][] {
  const out: [string, string][] = [];
  for (const n of nodes) {
    const path = prefix ? `${prefix} > ${n.label}` : n.label;
    out.push([n.id, path]);
    out.push(...flattenAll(n.children, path));
  }
  return out;
}

