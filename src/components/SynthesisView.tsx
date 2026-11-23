import type { CriticityClass, Study } from '../types';
import { criticity, postCriticity, specialOf, studyStats } from '../lib/fmea';
import { flattenStructure, findNode } from '../lib/structure';
import { exportStudyCSV, sortLinesByCriticity } from '../lib/io';
import { CritBadge, KpiCard, SpecialBadge } from './ui';

const CLASS_LABEL: Record<CriticityClass, string> = {
  ok: 'Acceptables',
  surveillance: 'À surveiller',
  critique: 'Inacceptables'
};

export default function SynthesisView({ study }: { study: Study }) {
  const stats = studyStats(study);
  const sorted = sortLinesByCriticity(study.lignes);
  const flat = flattenStructure(study.structure);
  const labelOf = (id: string) => {
    const entry = flat.find((f) => f.node.id === id);
    if (entry) return entry.path;
    const node = findNode(study.structure, id);
    return node?.label ?? '(élément supprimé)';
  };

  const maxCount = Math.max(1, ...Object.values(stats.counts));
  const top = sorted.filter((l) => criticity(l) > study.seuilOrange).slice(0, 10);

  return (
    <div className="synthesis">
      <div className="card print-hide" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <h2 className="card-title" style={{ flex: 1 }}>
          Synthèse des risques
        </h2>
        <button className="btn" onClick={() => exportStudyCSV(study)}>
          Exporter (.csv)
        </button>
        <button className="btn btn-primary" onClick={() => window.print()}>
          Imprimer le rapport
        </button>
      </div>

      <section className="kpi-row">
        <KpiCard label="Lignes d’analyse" value={stats.lineCount} />
        <KpiCard label="Criticités acceptables" value={stats.counts.ok} tone="ok" />
        <KpiCard label="À surveiller" value={stats.counts.surveillance} tone="warn" />
        <KpiCard label="Inacceptables" value={stats.counts.critique} tone="danger" />
        <KpiCard label="Criticités moyenne / max" value={`${stats.averageC} / ${stats.maxC}`} />
        <KpiCard label="Caract. spéciales" value={stats.specialCount} />
        <KpiCard label="Actions soldées" value={`${stats.doneActionCount}/${stats.actionCount}`} />
      </section>

      <section className="card">
        <h2 className="card-title">Répartition des risques par classe de criticité</h2>
        <div className="chart">
          {(['ok', 'surveillance', 'critique'] as CriticityClass[]).map((cls) => (
            <div key={cls} className="chart-row">
              <span className="chart-label">{CLASS_LABEL[cls]}</span>
              <div className="chart-bar-track">
                <div
                  className={`chart-bar chart-${cls}`}
                  style={{ width: `${(stats.counts[cls] / maxCount) * 100}%` }}
                />
              </div>
              <span className="chart-value">{stats.counts[cls]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">Top risques (C &gt; {study.seuilOrange})</h2>
        {top.length === 0 ? (
          <p className="muted">Aucun risque au-dessus du seuil orange — analyse conforme.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th className="col-num">N°</th>
                <th>Élément</th>
                <th>Mode de défaillance / cause</th>
                <th>C</th>
                <th>C′</th>
                <th>Caract. spéciale</th>
              </tr>
            </thead>
            <tbody>
              {top.map((line) => (
                <tr key={line.id}>
                  <td className="col-num">{study.lignes.indexOf(line) + 1}</td>
                  <td>{labelOf(line.nodeId)}</td>
                  <td>
                    <strong>{line.mode || '—'}</strong>
                    {line.cause ? <div className="muted small">Cause : {line.cause}</div> : null}
                  </td>
                  <td className="col-crit">
                    <CritBadge c={criticity(line)} orange={study.seuilOrange} rouge={study.seuilRouge} />
                  </td>
                  <td className="col-crit">
                    {postCriticity(line) !== null ? (
                      <CritBadge c={postCriticity(line)!} orange={study.seuilOrange} rouge={study.seuilRouge} post />
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <SpecialBadge kind={specialOf(line, study)} auto={!line.special && specialOf(line, study) !== null} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2 className="card-title">Rapport AMDEC — toutes les lignes (triées par criticité décroissante)</h2>
        <div className="report-head">
          <div>
            <strong>{study.nom}</strong>
            <div className="muted small">
              Produit : {study.produit || '—'} · Réf. : {study.reference || '—'} · Responsable :{' '}
              {study.responsable || '—'} · Révision {study.revision} du {study.dateRevision}
            </div>
          </div>
          <div className="muted small" style={{ maxWidth: 480 }}>
            {study.objectif}
          </div>
        </div>
        <table className="table table-report">
          <thead>
            <tr>
              <th className="col-num">N°</th>
              <th>Élément</th>
              <th>Fonction</th>
              <th>Mode</th>
              <th>Cause</th>
              <th>Effet</th>
              <th>Contrôle</th>
              <th className="col-rate">F</th>
              <th className="col-rate">G</th>
              <th className="col-rate">D</th>
              <th className="col-crit">C</th>
              <th className="col-crit">C′</th>
              <th>Caract.</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((line) => (
              <tr key={line.id}>
                <td className="col-num">{study.lignes.indexOf(line) + 1}</td>
                <td>{labelOf(line.nodeId)}</td>
                <td className="cell-text">{line.fonction || '—'}</td>
                <td className="cell-text">{line.mode || '—'}</td>
                <td className="cell-text">{line.cause || '—'}</td>
                <td className="cell-text">{line.effet || '—'}</td>
                <td className="cell-text">{line.controle || '—'}</td>
                <td className="col-rate">{line.f}</td>
                <td className="col-rate">{line.g}</td>
                <td className="col-rate">{line.d}</td>
                <td className="col-crit">
                  <CritBadge c={criticity(line)} orange={study.seuilOrange} rouge={study.seuilRouge} />
                </td>
                <td className="col-crit">
                  {postCriticity(line) !== null ? <CritBadge c={postCriticity(line)!} orange={study.seuilOrange} rouge={study.seuilRouge} post /> : '—'}
                </td>
                <td>
                  <SpecialBadge kind={specialOf(line, study)} auto={!line.special && specialOf(line, study) !== null} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
