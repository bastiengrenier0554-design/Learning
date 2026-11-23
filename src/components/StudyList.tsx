import { useRef } from 'react';
import type { Study } from '../types';
import { studyStats } from '../lib/fmea';
import { importStudyJSON } from '../lib/io';
import { KpiCard } from './ui';

export default function StudyList({
  etudes,
  flash,
  onNotify,
  onOpen,
  onCreateStudy,
  onImportStudy,
  onDuplicate,
  onDelete
}: {
  etudes: Study[];
  flash: string | null;
  onNotify: (msg: string) => void;
  onOpen: (id: string) => void;
  onCreateStudy: (nom: string) => void;
  onImportStudy: (study: Study) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      const study = importStudyJSON(text);
      onImportStudy(study);
      onNotify(`Étude « ${study.nom} » importée`);
    } catch (err) {
      onNotify(`Import impossible : ${(err as Error).message}`);
    }
  };

  const totalLignes = etudes.reduce((acc, s) => acc + s.lignes.length, 0);
  const totalActions = etudes.reduce(
    (acc, s) => acc + s.lignes.reduce((a, l) => a + l.actions.length, 0),
    0
  );
  const totalRisques = etudes.reduce(
    (acc, s) => acc + studyStats(s).counts.critique,
    0
  );

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">AMDEC</span>
          <span className="brand-sub">Pro Web — AMDEC Produit (FMEA design)</span>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={() => {
            const nom = window.prompt('Nom de la nouvelle étude AMDEC produit :', 'AMDEC produit — nouveau projet');
            if (nom && nom.trim()) onCreateStudy(nom.trim());
          }}>
            + Nouvelle étude
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Importer une étude (.json)
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = '';
            }}
          />
        </div>
      </header>

      {flash ? <div className="flash">{flash}</div> : null}

      <section className="kpi-row">
        <KpiCard label="Études AMDEC" value={etudes.length} />
        <KpiCard label="Lignes d'analyse" value={totalLignes} />
        <KpiCard label="Actions en portefeuille" value={totalActions} />
        <KpiCard label="Risques inacceptables" value={totalRisques} tone="danger" />
      </section>

      <section className="card">
        <h2 className="card-title">Portefeuille d'études</h2>
        {etudes.length === 0 ? (
          <p className="muted">
            Aucune étude. Créez-en une ou importez un fichier d'étude exporté depuis cette
            application.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Étude</th>
                <th>Produit</th>
                <th>Référence</th>
                <th>Responsable</th>
                <th>Rév.</th>
                <th>Maj</th>
                <th>Lignes</th>
                <th>Risques &gt; seuil</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {etudes.map((s) => {
                const stats = studyStats(s);
                return (
                  <tr key={s.id} className="row-click" onClick={() => onOpen(s.id)}>
                    <td>
                      <strong>{s.nom}</strong>
                      <div className="muted small">{s.objectif ? s.objectif.slice(0, 90) + (s.objectif.length > 90 ? '…' : '') : ''}</div>
                    </td>
                    <td>{s.produit || '—'}</td>
                    <td>{s.reference || '—'}</td>
                    <td>{s.responsable || '—'}</td>
                    <td>{s.revision}</td>
                    <td>{s.dateRevision}</td>
                    <td>{stats.lineCount}</td>
                    <td>
                      {stats.counts.critique + stats.counts.surveillance > 0 ? (
                        <span className={`crit-badge ${stats.counts.critique > 0 ? 'crit-critique' : 'crit-surveillance'}`}>
                          {stats.counts.critique + stats.counts.surveillance}
                        </span>
                      ) : (
                        <span className="muted">0</span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                        <button className="btn btn-small" onClick={() => onOpen(s.id)}>
                          Ouvrir
                        </button>
                        <button className="btn btn-small" onClick={() => onDuplicate(s.id)}>
                          Dupliquer
                        </button>
                        <button
                          className="btn btn-small btn-danger"
                          onClick={() => {
                            if (window.confirm(`Supprimer définitivement « ${s.nom} » ?`)) onDelete(s.id);
                          }}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <footer className="footer muted small">
        Données enregistrées localement dans votre navigateur (localStorage). Exportez vos études en
        JSON pour les sauvegarder ou les partager.
      </footer>
    </div>
  );
}
