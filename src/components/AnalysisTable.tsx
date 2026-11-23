import type { FailureLine, Study } from '../types';
import { flattenStructure } from '../lib/structure';
import { criticity, nodeStats, postCriticity, specialOf } from '../lib/fmea';
import { CritBadge, RateSelect, SpecialBadge } from './ui';

export default function AnalysisTable({
  study,
  filterNodeId,
  collapsed,
  onToggleCollapse,
  onEditLine,
  onAddLine,
  onDeleteLine,
  onRate,
  onSpecial
}: {
  study: Study;
  filterNodeId: string | null;
  collapsed: Set<string>;
  onToggleCollapse: (nodeId: string) => void;
  onEditLine: (line: FailureLine) => void;
  onAddLine: (nodeId: string) => void;
  onDeleteLine: (lineId: string) => void;
  onRate: (lineId: string, key: 'f' | 'g' | 'd', value: number) => void;
  onSpecial: (lineId: string, value: '' | 'CC' | 'SC') => void;
}) {
  const flat = flattenStructure(study.structure);
  const visibleNodes = filterNodeId
    ? flat.filter((f) => f.node.id === filterNodeId)
    : flat;

  if (flat.length === 0) {
    return (
      <div className="card empty-state">
        <p>Commencez par construire l’arborescence produit (bouton « + Système »).</p>
      </div>
    );
  }

  return (
    <div className="card analysis-wrap">
      <table className="table table-analysis">
        <thead>
          <tr>
            <th className="col-num">N°</th>
            <th>Fonction</th>
            <th>Mode de défaillance</th>
            <th>Cause</th>
            <th>Effet</th>
            <th>Contrôle / détection</th>
            <th className="col-rate">F</th>
            <th className="col-rate">G</th>
            <th className="col-rate">D</th>
            <th className="col-crit">C = F×G×D</th>
            <th>Caract. spéciale</th>
            <th>Actions</th>
            <th />
          </tr>
        </thead>
        {visibleNodes.map(({ node, path }) => {
          const stats = nodeStats(study, node, study.seuilOrange, study.seuilRouge);
          const isCollapsed = collapsed.has(node.id);
          const lines = study.lignes.filter((l) => l.nodeId === node.id);
          return (
            <tbody key={node.id}>
              <tr className={'group-row group-' + stats.worstClass}>
                <td colSpan={12}>
                  <button className="group-toggle" onClick={() => onToggleCollapse(node.id)}>
                    {isCollapsed ? '▸' : '▾'}
                  </button>
                  <strong>{node.label}</strong>
                  <span className="group-path">{path}</span>
                  <span className="group-meta">
                    {stats.lineCount} ligne{stats.lineCount > 1 ? 's' : ''} · criticité max :{' '}
                    <strong>{stats.maxCriticity}</strong>
                    {stats.specialCount > 0 ? ' · ' + stats.specialCount + ' caract. spéciale(s)' : ''}
                    {stats.openActionCount > 0 ? ' · ' + stats.openActionCount + ' action(s) ouverte(s)' : ''}
                  </span>
                </td>
                <td className="group-add">
                  <button className="btn btn-small btn-primary" onClick={() => onAddLine(node.id)}>
                    + Ligne
                  </button>
                </td>
              </tr>
              {!isCollapsed &&
                lines.map((line) => {
                  const index = study.lignes.indexOf(line) + 1;
                  const post = postCriticity(line);
                  const special = specialOf(line, study);
                  const specialAuto = !line.special && special !== null;
                  return (
                    <tr key={line.id} className="line-row" onDoubleClick={() => onEditLine(line)}>
                      <td className="col-num">{index}</td>
                      <td className="cell-text">{line.fonction || <span className="muted">—</span>}</td>
                      <td className="cell-text">{line.mode || <span className="muted">—</span>}</td>
                      <td className="cell-text">{line.cause || <span className="muted">—</span>}</td>
                      <td className="cell-text">{line.effet || <span className="muted">—</span>}</td>
                      <td className="cell-text">{line.controle || <span className="muted">—</span>}</td>
                      <td className="col-rate">
                        <RateSelect value={line.f} grille={study.grilles.f} ariaLabel="Fréquence" onChange={(v) => onRate(line.id, 'f', v)} />
                      </td>
                      <td className="col-rate">
                        <RateSelect value={line.g} grille={study.grilles.g} ariaLabel="Gravité" onChange={(v) => onRate(line.id, 'g', v)} />
                      </td>
                      <td className="col-rate">
                        <RateSelect value={line.d} grille={study.grilles.d} ariaLabel="Non-détection" onChange={(v) => onRate(line.id, 'd', v)} />
                      </td>
                      <td className="col-crit">
                        <div className="crit-cell">
                          <CritBadge c={criticity(line)} orange={study.seuilOrange} rouge={study.seuilRouge} />
                          {post !== null && (
                            <span className="crit-after" title="Criticité après actions : C = F·G·D re-cotées">
                              → <CritBadge c={post} orange={study.seuilOrange} rouge={study.seuilRouge} post />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="col-special">
                        <select
                          className={'input special-select' + (specialAuto ? ' special-auto' : '')}
                          value={line.special}
                          title={specialAuto ? `${special} proposée automatiquement (règle de risque) — choisir une valeur pour figer` : ''}
                          onChange={(e) => onSpecial(line.id, e.target.value as '' | 'CC' | 'SC')}
                        >
                          <option value="">—</option>
                          <option value="CC">CC</option>
                          <option value="SC">SC</option>
                          {specialAuto ? (
                            <option value="" disabled>
                              (auto : {special})
                            </option>
                          ) : null}
                        </select>
                        <SpecialBadge kind={special} auto={specialAuto} />
                      </td>
                      <td>
                        <button className="btn btn-small" onClick={() => onEditLine(line)}>
                          {line.actions.length} ▸
                        </button>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="icon-btn" title="Éditer la ligne" onClick={() => onEditLine(line)}>
                            ✎
                          </button>
                          <button
                            className="icon-btn"
                            title="Supprimer la ligne"
                            onClick={() => {
                              if (window.confirm('Supprimer cette ligne d’analyse ?')) onDeleteLine(line.id);
                            }}
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {!isCollapsed && lines.length === 0 ? (
                <tr>
                  <td colSpan={13} className="muted empty-line">
                    Aucune ligne pour cet élément — cliquez sur « + Ligne ».
                  </td>
                </tr>
              ) : null}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
