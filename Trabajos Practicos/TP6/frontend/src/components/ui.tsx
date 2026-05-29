import { Button } from '@heroui/react';
import { Leaf, ArrowLeft, Monitor, Smartphone } from 'lucide-react';

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
        <span className="grid size-9 shrink-0 place-items-center rounded-full text-white" style={{ background: 'linear-gradient(135deg,var(--p5),var(--a5))' }}>
          <Leaf className="size-[18px]" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate font-poppins text-[15px] font-bold leading-tight text-slate-900">{title}</div>
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
          <span className="grid size-9 place-items-center rounded-xl text-white" style={{ background: 'linear-gradient(135deg,var(--p5),var(--a5))' }}>
            <Leaf className="size-[18px]" />
          </span>
          <span className="font-poppins text-[17px] font-bold tracking-tight text-slate-900">EcoHarmony Park</span>
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
