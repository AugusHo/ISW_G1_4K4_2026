import { useMemo, useState } from 'react';
import { Button } from '@heroui/react';
import { ArrowLeft, Monitor, Smartphone, ChevronLeft, ChevronRight } from 'lucide-react';
import { DIA, MES, sameDay, esFeriado } from '../lib/format';
import logo from '../assets/logo.png';

/* ---------- Calendar (custom) ---------- */
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
        <span className="font-display text-[15px] font-semibold capitalize text-slate-700">{MES[m]} {y}</span>
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

/* ---------- Aurora background (vista móvil) ---------- */
export function Aurora() {
  return (
    <div className="aurora">
      <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
    </div>
  );
}

function iniciales(usuario?: string) {
  return (usuario ?? '')
    .split(' ').map((p) => p.charAt(0)).slice(0, 2).join('').toUpperCase() || 'VM';
}

/* ---------- App bar (vista móvil) ---------- */
export function AppBar({
  title, subtitle, onBack, usuario, vista, onToggleVista,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  usuario?: string;
  vista?: 'mobile' | 'desktop';
  onToggleVista?: () => void;
}) {
  const esDesktop = vista === 'desktop';
  return (
    <div className="flex items-center gap-2 border-b border-emerald-900/[0.06] px-4 py-3 sm:gap-3">
      {onBack ? (
        <Button variant="tertiary" size="sm" className="size-9 rounded-full p-0" onPress={onBack} aria-label="Volver">
          <ArrowLeft className="size-5" />
        </Button>
      ) : (
        <img src={logo} alt="EcoHarmony Park" className="size-9 shrink-0 rounded-full object-cover ring-1 ring-emerald-900/10" />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-[15px] font-bold leading-tight text-slate-900">{title}</div>
        {subtitle && <div className="text-[11px] leading-tight text-emerald-700">{subtitle}</div>}
      </div>
      {onToggleVista && (
        <Button
          variant="tertiary"
          size="sm"
          className="size-9 rounded-full p-0"
          onPress={onToggleVista}
          aria-label={esDesktop ? 'Cambiar a vista móvil' : 'Cambiar a vista escritorio'}
        >
          {esDesktop ? <Smartphone className="size-5" /> : <Monitor className="size-5" />}
        </Button>
      )}
      <div className="flex shrink-0 items-center gap-2 rounded-full bg-emerald-500/[0.08] py-1 pl-1 pr-2">
        <span className="grid size-6 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg,var(--p6),var(--a6))' }}>
          {iniciales(usuario)}
        </span>
        <span className="hidden text-[11.5px] font-medium text-slate-600 xs:inline">Sesión iniciada</span>
      </div>
    </div>
  );
}

/* ---------- Navbar (vista escritorio, web normal) ---------- */
export function Navbar({
  usuario, vista, onToggleVista, onHome,
}: {
  usuario?: string;
  vista?: 'mobile' | 'desktop';
  onToggleVista?: () => void;
  onHome?: () => void;
}) {
  const esDesktop = vista === 'desktop';
  return (
    <header className="sticky top-0 z-30 border-b border-emerald-900/[0.06] bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-3">
        <button type="button" onClick={onHome} className="flex items-center gap-2.5" aria-label="Inicio">
          <img src={logo} alt="EcoHarmony Park" className="size-10 rounded-full object-cover ring-1 ring-emerald-900/10" />
          <span className="font-display text-[17px] font-bold tracking-tight text-slate-900">EcoHarmony Park</span>
        </button>
        <div className="ml-auto flex items-center gap-3">
          {onToggleVista && (
            <Button variant="secondary" size="sm" onPress={onToggleVista}>
              {esDesktop ? <Smartphone className="size-4" /> : <Monitor className="size-4" />}
              {esDesktop ? 'Vista móvil' : 'Vista escritorio'}
            </Button>
          )}
          <div className="flex shrink-0 items-center gap-2 rounded-full bg-emerald-500/[0.08] py-1 pl-1 pr-3">
            <span className="grid size-7 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: 'linear-gradient(135deg,var(--p6),var(--a6))' }}>{iniciales(usuario)}</span>
            <span className="text-[12.5px] font-medium text-slate-600">{usuario ?? 'Sesión iniciada'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
