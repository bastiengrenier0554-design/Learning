import { useMemo, useState } from 'react';
import type { Study } from '../types';
import { criticity, postCriticity } from '../lib/fmea';
import { CritBadge } from './ui';

type Filter = 'toutes' | 'A faire' | 'En cours' | 'Soldée' | 'en-retard';

export default function ActionsView({
  study,
  onStatut,
  onDeleteAction,
  onOpenLine
}: {
  study: Study;
  onStatut: (actionId: string, statut: 'A faire' | 'En cours' | 'Soldée') => void;
  onDeleteAction: (actionId: string) => void;
  onOpenLine: (lineId: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>('toutes');
  const today = new Date().toISOString().slice(0, 10);

  const rows = useMemo(() => {
    const out: {
      actionId: string;
      lineId: string;
      num: number;
      mode: string;
      cause: string;
      c: number;
      cPost: number | null;
      action: Study['lignes'][number]['actions'][number];
    }[] = [];
    study.lignes.forEach((line, i) => {
      for (const action of line.actions) {
        out.push({
          actionId: action.id,
          lineId: line.id,
          num: i + 1,
          mode: line.mode,
          cause: line.cause,
          c: criticity(line),
          cPost: postCriticity(line),
          action
        });
      }
    });
    return out.filter((r) => {
      if (filter === 'toutes') return true;
      if (filter === 'en-retard') return r.action.statut !== 'Soldée' && r.action.echeance !== '' && r.action.echeance < today;
      return r.action.statut === filter;
    });
  }, [study.lignes, filter, today]);

  const totalActions = study.lignes.reduce((acc, l) => acc + l.actions.length, 0);
  const soldées = study.lignes.reduce(
    (acc, l) => acc + l.actions.filter((a) => a.statut === 'Soldée').length,
    0
  );

  return (
    <div className="card">
      <div className="card-head">
        <h2 className="card-title">Portefeuille d’actions de l’étude</h2>
        <div className="card-filters">
          {(['toutes', 'A faire', 'En cours', 'Soldée', 'en-retard'] as Filter[]).map((f) => (
            <button key={f} className={'chip' + (filter === f ? ' chip-active' : '')} onClick={() => setFilter(f)}>
              {f === 'en-retard' ? 'En retard' : f}
            </button>
          ))}
          <span className="muted small">
            {soldées}/{totalActions} action(s) soldée(s)
          </span>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="muted">Aucune action {filter === 'toutes' ? 'dans cette étude' : 'pour ce filtre'}. Les actions se créent depuis chaque ligne d’analyse (bouton Actions ▸).</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th className="col-num">N°</th>
              <th>Action</th>
              <th>Type</th>
              <th>Responsable</th>
              <th>Échéance</th>
              <th>Statut</th>
              <th>Ligne liée</th>
              <th>C → C′</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.actionId} className={r.action.statut !== 'Soldée' && r.action.echeance !== '' && r.action.echeance < today ? 'row-late' : ''}>
                <td className="col-num">{r.num}</td>
                <td>
                  <strong>{r.action.description || <span className="muted">(action non renseignée)</span>}</strong>
                </td>
                <td>{r.action.type}</td>
                <td>{r.action.responsable || '—'}</td>
                <td>{r.action.echeance || '—'}</td>
                <td>
                  <select
                    className={'input statut-statut-' + r.action.statut.toLowerCase().replace(' ', '-')}
                    value={r.action.statut}
                    onChange={(e) => onStatut(r.actionId, e.target.value as 'A faire' | 'En cours' | 'Soldée')}
                  >
                    <option>A faire</option>
                    <option>En cours</option>
                    <option>Soldée</option>
                  </select>
                </td>
                <td>
                  <button className="btn btn-small" onClick={() => onOpenLine(r.lineId)} title="Ouvrir la ligne d’analyse">
                    n°{r.num} · {r.mode.slice(0, 40) || '…'}
                  </button>
                </td>
                <td className="col-crit">
                  <div className="crit-cell">
                    <CritBadge c={r.c} orange={study.seuilOrange} rouge={study.seuilRouge} />
                    {r.cPost !== null ? (
                      <span className="crit-after">
                        → <CritBadge c={r.cPost} orange={study.seuilOrange} rouge={study.seuilRouge} post />
                      </span>
                    ) : null}
                  </div>
                </td>
                <td>
                  <button
                    className="icon-btn"
                    title="Supprimer l’action"
                    onClick={() => {
                      if (window.confirm('Supprimer cette action ?')) onDeleteAction(r.actionId);
                    }}
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="muted small">
        Le suivi se pilote ici ; la re-cotation (C′) se règle dans la ligne d’analyse, onglet
        « Re-cotation après actions ».
      </p>
    </div>
  );
}
