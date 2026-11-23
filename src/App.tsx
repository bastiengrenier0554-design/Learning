import { useCallback, useEffect, useState } from 'react';
import type { Study, Workspace } from './types';
import { createStudy } from './lib/defaults';
import { loadWorkspace, saveWorkspace } from './lib/storage';
import { makeId } from './lib/structure';
import StudyList from './components/StudyList';
import StudyView from './components/StudyView';

type View = { kind: 'portfolio' } | { kind: 'study'; studyId: string };

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace>(() => loadWorkspace());
  const [view, setView] = useState<View>({ kind: 'portfolio' });
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    saveWorkspace(workspace);
  }, [workspace]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 3200);
    return () => clearTimeout(t);
  }, [flash]);

  const notify = useCallback((msg: string) => setFlash(msg), []);

  const updateStudy = useCallback((studyId: string, mutate: (draft: Study) => void) => {
    setWorkspace((w) => {
      const etudes = w.etudes.map((s) => {
        if (s.id !== studyId) return s;
        const draft = structuredClone(s);
        mutate(draft);
        draft.dateRevision = new Date().toISOString().slice(0, 10);
        return draft;
      });
      return { ...w, etudes };
    });
  }, []);

  if (view.kind === 'study') {
    const study = workspace.etudes.find((s) => s.id === view.studyId);
    if (!study) {
      setView({ kind: 'portfolio' });
      return null;
    }
    return (
      <StudyView
        study={study}
        flash={flash}
        onNotify={notify}
        onBack={() => setView({ kind: 'portfolio' })}
        update={(mutate) => updateStudy(study.id, mutate)}
      />
    );
  }

  return (
    <StudyList
      etudes={workspace.etudes}
      flash={flash}
      onNotify={notify}
      onOpen={(id) => setView({ kind: 'study', studyId: id })}
      onCreateStudy={(nom: string) => {
        const study = createStudy(nom);
        setWorkspace((w) => ({ ...w, etudes: [study, ...w.etudes] }));
        setView({ kind: 'study', studyId: study.id });
      }}
      onImportStudy={(study) => {
        setWorkspace((w) => ({ ...w, etudes: [study, ...w.etudes] }));
        setView({ kind: 'study', studyId: study.id });
      }}
      onDuplicate={(id) =>
        setWorkspace((w) => {
          const src = w.etudes.find((s) => s.id === id);
          if (!src) return w;
          const copy: Study = structuredClone(src);
          copy.id = makeId();
          copy.nom = `${src.nom} (copie)`;
          return { ...w, etudes: [copy, ...w.etudes] };
        })
      }
      onDelete={(id) =>
        setWorkspace((w) => ({ ...w, etudes: w.etudes.filter((s) => s.id !== id) }))
      }
    />
  );
}
