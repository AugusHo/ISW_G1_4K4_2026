/* ═══════════════ EcoHarmony — shared UI primitives ═══════════════ */
const { useState, useEffect, useRef, useMemo } = React;

/* ---------- icons (inline, stroke=currentColor) ---------- */
const _I = (p, vb = "0 0 24 24") => ({ className = "w-5 h-5", style, fill = "none", ...r }) => (
  <svg viewBox={vb} fill={fill} stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" className={className} style={style} {...r}>{p}</svg>
);
const Icon = {
  ArrowLeft:   _I(<><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></>),
  ChevronLeft: _I(<path d="m15 18-6-6 6-6"/>),
  ChevronRight:_I(<path d="m9 18 6-6-6-6"/>),
  ChevronDown: _I(<path d="m6 9 6 6 6-6"/>),
  Check:       _I(<path d="M20 6 9 17l-5-5"/>),
  Minus:       _I(<path d="M5 12h14"/>),
  Plus:        _I(<><path d="M12 5v14"/><path d="M5 12h14"/></>),
  Calendar:    _I(<><rect width="18" height="18" x="3" y="4" rx="2.5"/><path d="M16 2v4M8 2v4M3 10h18"/></>),
  User:        _I(<><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>),
  Users:       _I(<><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6M22 20a6.5 6.5 0 0 0-4-6"/></>),
  Card:        _I(<><rect width="20" height="14" x="2" y="5" rx="2.5"/><path d="M2 10h20"/></>),
  Cash:        _I(<><rect width="20" height="12" x="2" y="6" rx="2.5"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/></>),
  Mail:        _I(<><rect width="20" height="16" x="2" y="4" rx="2.5"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></>),
  Ticket:      _I(<><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v14" strokeDasharray="2 3"/></>),
  Lock:        _I(<><rect width="18" height="11" x="3" y="11" rx="2.5"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>),
  Shield:      _I(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>),
  Alert:       _I(<><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></>),
  Sparkles:    _I(<path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z"/>),
  Crown:       _I(<path d="M2 18h20l-2-9-4.5 4L12 5 8.5 13 4 9Z"/>),
  Leaf:        _I(<><path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 16-9 0 7-4 16-16 16Z"/><path d="M11 20c0-6 3-9 7-11"/></>),
  X:           _I(<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>),
  Clock:       _I(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>),
  Info:        _I(<><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></>),
  MapPin:      _I(<><path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>),
};

/* ---------- money + dates ---------- */
const ARS = (n) => "$" + n.toLocaleString("es-AR");
const MES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const DIA = ["dom","lun","mar","mié","jue","vie","sáb"];
const sameDay = (a,b) => a&&b&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
const _cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const fmtLong = (d) => _cap(`${DIA[d.getDay()]} ${d.getDate()} de ${MES[d.getMonth()]} ${d.getFullYear()}`);
// El parque cierra los lunes (getDay()===1)
const isClosed = (d) => d.getDay() === 1;

/* ---------- primitives ---------- */
function Glass({ children, className = "", ...r }) {
  return (
    <div className={`relative rounded-[1.6rem] bg-white/80 dark:bg-white/[0.045] backdrop-blur-xl
      border border-emerald-900/[0.06] dark:border-white/[0.08]
      shadow-[0_8px_30px_-12px_rgba(6,78,59,0.18)] dark:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] ${className}`} {...r}>
      {children}
    </div>
  );
}

function SectionLabel({ n, icon: I, children, hint }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <span className="grid place-items-center w-7 h-7 rounded-full text-white text-xs font-bold shrink-0"
            style={{ background: "linear-gradient(135deg,var(--p5),var(--a5))" }}>
        {n}
      </span>
      <div className="flex items-center gap-1.5 min-w-0">
        {I && <I className="w-[18px] h-[18px] text-emerald-700 dark:text-emerald-300 shrink-0" />}
        <h3 className="font-poppins font-semibold text-[15px] text-slate-800 dark:text-slate-100 leading-tight truncate">{children}</h3>
      </div>
      {hint && <span className="ml-auto text-[11px] text-slate-400 dark:text-slate-500 shrink-0">{hint}</span>}
    </div>
  );
}

function PrimaryBtn({ children, onClick, disabled, className = "" }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5
        font-poppins font-semibold text-[15px] text-white transition-all
        active:scale-[0.985] disabled:opacity-40 disabled:active:scale-100 ${className}`}
      style={{ background: "linear-gradient(135deg,var(--p5),var(--a6))",
               boxShadow: disabled ? "none" : "0 12px 26px -10px var(--p6)" }}>
      {children}
    </button>
  );
}

function FieldError({ children }) {
  if (!children) return null;
  return (
    <div className="flex items-start gap-1.5 mt-2 text-[12.5px] font-medium text-rose-600 dark:text-rose-400">
      <Icon.Alert className="w-[15px] h-[15px] mt-px shrink-0" />
      <span>{children}</span>
    </div>
  );
}

/* ---------- stepper ---------- */
function Stepper({ value, min = 1, max = 10, onChange }) {
  const btn = "grid place-items-center w-11 h-11 rounded-xl border border-emerald-900/10 dark:border-white/10 " +
    "bg-white/70 dark:bg-white/5 text-emerald-700 dark:text-emerald-300 transition active:scale-90 " +
    "disabled:opacity-30 disabled:active:scale-100";
  return (
    <div className="flex items-center gap-3">
      <button className={btn} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))} aria-label="menos">
        <Icon.Minus className="w-5 h-5" />
      </button>
      <div className="flex-1 text-center">
        <div className="font-poppins font-bold text-3xl text-slate-800 dark:text-white tabular-nums leading-none">{value}</div>
        <div className="text-[11px] text-slate-400 mt-1">{value === 1 ? "entrada" : "entradas"}</div>
      </div>
      <button className={btn} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))} aria-label="más">
        <Icon.Plus className="w-5 h-5" />
      </button>
    </div>
  );
}

/* ---------- calendar ---------- */
function Calendar({ selected, onSelect }) {
  const today = useMemo(() => { const t = new Date(); t.setHours(0,0,0,0); return t; }, []);
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const y = view.getFullYear(), m = view.getMonth();
  const firstDow = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(y, m, d));

  const canPrev = new Date(y, m, 1) > new Date(today.getFullYear(), today.getMonth(), 1);
  const navBtn = "grid place-items-center w-9 h-9 rounded-full text-slate-500 dark:text-slate-400 " +
    "hover:bg-emerald-500/10 transition disabled:opacity-25 disabled:hover:bg-transparent";

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button className={navBtn} disabled={!canPrev} onClick={() => setView(new Date(y, m - 1, 1))}>
          <Icon.ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-poppins font-semibold text-[15px] capitalize text-slate-700 dark:text-slate-200">
          {MES[m]} {y}
        </span>
        <button className={navBtn} onClick={() => setView(new Date(y, m + 1, 1))}>
          <Icon.ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DIA.map((d) => <div key={d} className="text-center text-[10.5px] font-semibold uppercase tracking-wide text-slate-400 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const past = d < today;
          const closed = isClosed(d);
          const disabled = past || closed;
          const sel = sameDay(d, selected);
          return (
            <button key={i} disabled={disabled} onClick={() => onSelect(d)}
              className={`relative aspect-square rounded-xl text-[13.5px] font-medium transition
                ${sel ? "text-white font-bold" : disabled
                  ? "text-slate-300 dark:text-slate-600 line-through decoration-1"
                  : "text-slate-700 dark:text-slate-200 hover:bg-emerald-500/10"}`}
              style={sel ? { background: "linear-gradient(135deg,var(--p5),var(--a6))", boxShadow: "0 6px 14px -6px var(--p6)" } : {}}>
              {d.getDate()}
              {sameDay(d, today) && !sel && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: "var(--p5)" }} />}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-3 text-[11.5px] text-slate-400 dark:text-slate-500">
        <span className="line-through decoration-1">lun</span>
        <span>· El parque permanece cerrado los lunes</span>
      </div>
    </div>
  );
}

Object.assign(window, { Icon, ARS, MES, DIA, sameDay, fmtLong, isClosed, Glass, SectionLabel, PrimaryBtn, FieldError, Stepper, Calendar });
