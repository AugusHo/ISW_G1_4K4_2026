import { useMemo, useState, type ReactNode } from 'react';
import {
  Minus, Plus, ChevronLeft, ChevronRight, TriangleAlert, Leaf, ArrowLeft,
} from 'lucide-react';
import { DIA, MES, sameDay, esFeriado } from '../lib/format';

/* ---------- Glass card ---------- */
export function Glass({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-[1.6rem] bg-white/80 backdrop-blur-xl border border-emerald-900/[0.06] shadow-[0_8px_30px_-12px_rgba(6,78,59,0.18)] ${className}`}
    >
      {children}
    </div>
  );
}

/* ---------- Section label (numbered step) ---------- */
export function SectionLabel({
  n, icon: Icon, children, hint,
}: {
  n: number | string;
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span
        className="grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
        style={{ background: 'linear-gradient(135deg,var(--p5),var(--a5))' }}
      >
        {n}
      </span>
      <div className="flex min-w-0 items-center gap-1.5">
        {Icon && <Icon className="size-[18px] shrink-0 text-emerald-700" />}
        <h3 className="truncate font-poppins text-[15px] font-semibold leading-tight text-slate-800">{children}</h3>
      </div>
      {hint && <span className="ml-auto shrink-0 text-[11px] text-slate-400">{hint}</span>}
    </div>
  );
}

/* ---------- Primary button (gradient) ---------- */
export function PrimaryBtn({
  children, onClick, disabled, type = 'button', className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-poppins text-[15px] font-semibold text-white transition-all active:scale-[0.985] disabled:opacity-40 disabled:active:scale-100 ${className}`}
      style={{
        background: 'linear-gradient(135deg,var(--p5),var(--a6))',
        boxShadow: disabled ? 'none' : '0 12px 26px -10px var(--p6)',
      }}
    >
      {children}
    </button>
  );
}

/* ---------- Field error ---------- */
export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <div className="mt-2 flex items-start gap-1.5 text-[12.5px] font-medium text-rose-600">
      <TriangleAlert className="mt-px size-[15px] shrink-0" />
      <span>{children}</span>
    </div>
  );
}

/* ---------- Stepper ---------- */
export function Stepper({
  value, min = 1, max = 10, onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  const btn =
    'grid size-11 place-items-center rounded-xl border border-emerald-900/10 bg-white/70 text-emerald-700 transition active:scale-90 disabled:opacity-30 disabled:active:scale-100';
  return (
    <div className="flex items-center gap-3">
      <button type="button" className={btn} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))} aria-label="menos">
        <Minus className="size-5" />
      </button>
      <div className="flex-1 text-center">
        <div className="font-poppins text-3xl font-bold leading-none tabular-nums text-slate-800">{value}</div>
        <div className="mt-1 text-[11px] text-slate-400">{value === 1 ? 'entrada' : 'entradas'}</div>
      </div>
      <button type="button" className={btn} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))} aria-label="más">
        <Plus className="size-5" />
      </button>
    </div>
  );
}

/* ---------- Calendar ---------- */
// `diasAbiertos` es el set de días de semana abiertos ('lunes', 'martes', ...) que viene del backend.
const DOW = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

export function Calendar({
  selected, onSelect, diasAbiertos,
}: {
  selected: Date | null;
  onSelect: (d: Date) => void;
  diasAbiertos: Set<string>;
}) {
  const today = useMemo(() => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; }, []);
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const y = view.getFullYear();
  const m = view.getMonth();
  const firstDow = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(y, m, d));

  const canPrev = new Date(y, m, 1) > new Date(today.getFullYear(), today.getMonth(), 1);
  const navBtn =
    'grid size-9 place-items-center rounded-full text-slate-500 transition hover:bg-emerald-500/10 disabled:opacity-25 disabled:hover:bg-transparent';

  const isClosed = (d: Date) =>
    (diasAbiertos.size > 0 && !diasAbiertos.has(DOW[d.getDay()])) || esFeriado(d);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button type="button" className={navBtn} disabled={!canPrev} onClick={() => setView(new Date(y, m - 1, 1))}>
          <ChevronLeft className="size-5" />
        </button>
        <span className="font-poppins text-[15px] font-semibold capitalize text-slate-700">{MES[m]} {y}</span>
        <button type="button" className={navBtn} onClick={() => setView(new Date(y, m + 1, 1))}>
          <ChevronRight className="size-5" />
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 gap-1">
        {DIA.map((d) => (
          <div key={d} className="py-1 text-center text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const past = d < today;
          const closed = isClosed(d);
          const disabled = past || closed;
          const sel = sameDay(d, selected);
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(d)}
              className={`relative aspect-square rounded-xl text-[13.5px] font-medium transition ${
                sel ? 'font-bold text-white'
                  : disabled ? 'text-slate-300 line-through decoration-1'
                  : 'text-slate-700 hover:bg-emerald-500/10'
              }`}
              style={sel ? { background: 'linear-gradient(135deg,var(--p5),var(--a6))', boxShadow: '0 6px 14px -6px var(--p6)' } : {}}
            >
              {d.getDate()}
              {sameDay(d, today) && !sel && (
                <span className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full" style={{ background: 'var(--p5)' }} />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11.5px] text-slate-400">
        <span className="line-through decoration-1">cerrado</span>
        <span>· lunes y feriados (25 dic · 1 ene)</span>
      </div>
    </div>
  );
}

/* ---------- Aurora background ---------- */
export function Aurora() {
  return (
    <div className="aurora">
      <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
    </div>
  );
}

/* ---------- App bar ---------- */
export function AppBar({
  title, subtitle, onBack, usuario,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  usuario?: string;
}) {
  const iniciales = (usuario ?? '')
    .split(' ').map((p) => p.charAt(0)).slice(0, 2).join('').toUpperCase() || 'VM';
  return (
    <div className="flex items-center gap-3 border-b border-emerald-900/[0.06] px-4 py-3">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="grid size-9 shrink-0 place-items-center rounded-full text-slate-600 transition hover:bg-emerald-500/10"
          aria-label="Volver"
        >
          <ArrowLeft className="size-5" />
        </button>
      ) : (
        <span className="grid size-9 shrink-0 place-items-center rounded-full text-white" style={{ background: 'linear-gradient(135deg,var(--p5),var(--a5))' }}>
          <Leaf className="size-[18px]" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate font-poppins text-[15px] font-bold leading-tight text-slate-900">{title}</div>
        {subtitle && <div className="text-[11px] leading-tight text-emerald-700">{subtitle}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-2 rounded-full bg-emerald-500/[0.08] py-1 pl-1 pr-2">
        <span className="grid size-6 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg,var(--p6),var(--a6))' }}>
          {iniciales}
        </span>
        <span className="hidden text-[11.5px] font-medium text-slate-600 xs:inline">Sesión iniciada</span>
      </div>
    </div>
  );
}
