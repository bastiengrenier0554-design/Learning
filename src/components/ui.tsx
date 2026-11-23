import { useEffect } from 'react';
import type { ReactNode } from 'react';
import type { CriticityClass, GrilleLevel } from '../types';

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={'modal' + (wide ? ' modal-wide' : '')} role="dialog" aria-label={title}>
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p className="modal-sub">{subtitle}</p> : null}
          </div>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  grow
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  grow?: boolean;
}) {
  return (
    <label className={'field' + (grow ? ' field-grow' : '')}>
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="input textarea" {...props} />;
}

const CLASS_LABEL: Record<CriticityClass, string> = {
  ok: 'Acceptable',
  surveillance: 'À surveiller',
  critique: 'Inacceptable'
};

export function classOf(c: number, orange: number, rouge: number): CriticityClass {
  if (c > rouge) return 'critique';
  if (c > orange) return 'surveillance';
  return 'ok';
}

export function CritBadge({
  c,
  orange,
  rouge,
  post
}: {
  c: number;
  orange: number;
  rouge: number;
  post?: boolean;
}) {
  return (
    <span className={`crit-badge crit-${classOf(c, orange, rouge)}`} title={CLASS_LABEL[classOf(c, orange, rouge)]}>
      {c}
      {post ? <span className="crit-post"> ▾</span> : null}
    </span>
  );
}

export function SpecialBadge({ kind, auto }: { kind: 'CC' | 'SC' | null; auto?: boolean }) {
  if (!kind) return <span className="muted">—</span>;
  return (
    <span className={'special-badge special-' + kind} title={auto ? 'Proposée automatiquement par les règles de risque' : ''}>
      {kind}
      {auto ? '*' : ''}
    </span>
  );
}

export function StatutSelect({
  value,
  onChange
}: {
  value: string;
  onChange: (v: 'A faire' | 'En cours' | 'Soldée') => void;
}) {
  return (
    <select className={'input statut-statut-' + value.toLowerCase().replace(' ', '-')} value={value} onChange={(e) => onChange(e.target.value as 'A faire' | 'En cours' | 'Soldée')}>
      <option>A faire</option>
      <option>En cours</option>
      <option>Soldée</option>
    </select>
  );
}

export function RateSelect({
  value,
  onChange,
  grille,
  ariaLabel
}: {
  value: number;
  onChange: (v: number) => void;
  grille: GrilleLevel[];
  ariaLabel: string;
}) {
  const level = grille.find((l) => l.value === value) ?? grille[0];
  return (
    <select
      className={`input rate-select rate-${value}`}
      value={value}
      aria-label={ariaLabel}
      title={`${ariaLabel} — ${level.value}. ${level.label} : ${level.description}`}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      {grille.map((l) => (
        <option key={l.value} value={l.value}>
          {l.value} — {l.label}
        </option>
      ))}
    </select>
  );
}

export function KpiCard({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className={'kpi' + (tone ? ' kpi-' + tone : '')}>
      <span className="kpi-value">{value}</span>
      <span className="kpi-label">{label}</span>
    </div>
  );
}
