import type { Study, StructureNode } from '../types';
import { flattenStructure } from '../lib/structure';
import { nodeStats } from '../lib/fmea';

const KIND_LABEL: Record<StructureNode['kind'], string> = {
  systeme: 'Système',
  sousSysteme: 'Sous-système',
  composant: 'Composant'
};

export default function StructureTree({
  study,
  selectedId,
  onSelect,
  onEdit,
  onAddChild,
  onDelete
}: {
  study: Study;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onEdit: (node: StructureNode) => void;
  onAddChild: (node: StructureNode) => void;
  onDelete: (node: StructureNode) => void;
}) {
  const flat = flattenStructure(study.structure);

  return (
    <aside className="tree card">
      <div className="tree-head">
        <h2>Arborescence produit</h2>
        <div className="tree-actions">
          <button
            className="btn btn-small"
            title="Ajouter un système racine"
            onClick={() => onEdit({ id: '', kind: 'systeme', label: '', reference: '', note: '', children: [] })}
          >
            + Système
          </button>
        </div>
      </div>
      <button
        className={'tree-item tree-root' + (selectedId === null ? ' tree-selected' : '')}
        onClick={() => onSelect(null)}
      >
        <span className="tree-dot" /> Toute l’étude
      </button>
      {flat.map(({ node, depth }) => {
        const stats = nodeStats(study, node, study.seuilOrange, study.seuilRouge);
        return (
          <div key={node.id} className={'tree-item' + (selectedId === node.id ? ' tree-selected' : '')} style={{ paddingLeft: 10 + depth * 16 }}>
            <button className="tree-label" onClick={() => onSelect(node.id)} title={`${KIND_LABEL[node.kind]}${node.reference ? ' — ' + node.reference : ''}`}>
              <span className={`tree-kind tree-kind-${node.kind}`}>{KIND_LABEL[node.kind][0]}</span>
              <span className="tree-name">
                {node.label}
                {node.reference ? <em className="tree-ref">{node.reference}</em> : null}
              </span>
            </button>
            <span className={'crit-badge crit-' + stats.worstClass} title={`Criticité max de la branche : ${stats.maxCriticity}`}>
              {stats.maxCriticity}
            </span>
            <div className="tree-btns">
              <button className="icon-btn" title="Ajouter un sous-élément" onClick={() => onAddChild(node)}>
                +
              </button>
              <button className="icon-btn" title="Modifier" onClick={() => onEdit(node)}>
                ✎
              </button>
              <button className="icon-btn" title="Supprimer" onClick={() => onDelete(node)}>
                🗑
              </button>
            </div>
          </div>
        );
      })}
      <p className="muted small tree-help">
        La structure reflète la nomenclature : Système → Sous-systèmes → Composants. Chaque
        élément porte ses lignes d’analyse (modes de défaillance).
      </p>
    </aside>
  );
}
