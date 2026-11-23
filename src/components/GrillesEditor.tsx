import type { Study } from '../types';
import { Field, TextArea, TextInput } from './ui';

function GrilleRows({
  study,
  key_,
  label,
  update
}: {
  study: Study;
  key_: 'f' | 'g' | 'd';
  label: string;
  update: (mutate: (draft: Study) => void) => void;
}) {
  return (
    <section className="card">
      <h2 className="card-title">Grille {label}</h2>
      <table className="table table-grilles">
        <thead>
          <tr>
            <th className="col-num">Niveau</th>
            <th className="col-libelle">Libellé</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {study.grilles[key_].map((level) => (
            <tr key={level.value}>
              <td className="col-num">
                <span className={`crit-badge rate-pip rate-${level.value}`}>{level.value}</span>
              </td>
              <td className="col-libelle">
                <TextInput
                  value={level.label}
                  onChange={(e) =>
                    update((d) => {
                      const l = d.grilles[key_].find((x) => x.value === level.value);
                      if (l) l.label = e.target.value;
                    })
                  }
                />
              </td>
              <td>
                <TextArea
                  rows={2}
                  value={level.description}
                  onChange={(e) =>
                    update((d) => {
                      const l = d.grilles[key_].find((x) => x.value === level.value);
                      if (l) l.description = e.target.value;
                    })
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function GrillesEditor({
  study,
  update
}: {
  study: Study;
  update: (mutate: (draft: Study) => void) => void;
}) {
  return (
    <div className="grilles-layout">
      <section className="card">
        <h2 className="card-title">Seuils de criticité (C = F × G × D)</h2>
        <p className="muted">
          Les classes déterminent le code couleur de l’arborescence, des lignes et des rapports.
        </p>
        <div className="form-grid">
          <Field label="Seuil orange — accepté si C ≤ ce niveau" hint="Au-delà : classe « à surveiller ».">
            <TextInput
              type="number"
              min={1}
              max={999}
              value={study.seuilOrange}
              onChange={(e) => update((d) => (d.seuilOrange = Number(e.target.value)))}
            />
          </Field>
          <Field label="Seuil rouge — au-delà : inacceptable" hint="Ces risques imposent des actions réduisant F ou D.">
            <TextInput
              type="number"
              min={2}
              max={1000}
              value={study.seuilRouge}
              onChange={(e) => update((d) => (d.seuilRouge = Number(e.target.value)))}
            />
          </Field>
        </div>
        <div className="legend">
          <span className="crit-badge crit-ok">≤ {study.seuilOrange} — acceptable</span>
          <span className="crit-badge crit-surveillance">{study.seuilOrange + 1} à {study.seuilRouge} — à surveiller</span>
          <span className="crit-badge crit-critique">&gt; {study.seuilRouge} — inacceptable</span>
        </div>
        <p className="muted small">
          Règles de détection des caractéristiques spéciales : <strong>CC</strong> proposée si
          gravité G ≥ 9 ; <strong>SC</strong> si criticité au-dessus du seuil rouge. La proposition
          s’affiche avec un astérisque * et peut être figée manuellement sur chaque ligne.
        </p>
      </section>
      <GrilleRows study={study} key_="f" label="F — fréquence d’apparition" update={update} />
      <GrilleRows study={study} key_="g" label="G — gravité des effets" update={update} />
      <GrilleRows study={study} key_="d" label="D — non-détection" update={update} />
    </div>
  );
}
