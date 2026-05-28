import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@heroui/react';
import {
  CalendarDays, Ticket, Users, Lock, Crown, Banknote,
  ShieldCheck, Check, X, Info, Clock3, CalendarX,
} from 'lucide-react';
import { api } from '../lib/api';
import { ARS, fmtISOLong, toISO } from '../lib/format';
import { useVista } from '../lib/vista';
import { Glass, SectionLabel, PrimaryBtn, FieldError, Stepper, Calendar } from '../components/ui';
import mpLogo from '../assets/MercadoPago.png';

interface TipoTicket { id: number; nombre: string; precio: number; }
interface Horario { dia_semana: string; hora_apertura: string; hora_cierre: string; }
interface TicketForm { tipoTicketId: string; edad: string; }
type Errores = { fecha?: string; pago?: string; visitantes?: string };

const ORDEN_DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const DIA_LABEL: Record<string, string> = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves',
  viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo',
};

// Resume los horarios de la tabla Horarios en un texto legible.
// Ej: "Martes a Domingo" si los días abiertos son contiguos.
function resumirDias(dias: string[]): string {
  const ordenados = [...dias].sort((a, b) => ORDEN_DIAS.indexOf(a) - ORDEN_DIAS.indexOf(b));
  if (ordenados.length === 0) return '';
  const idxs = ordenados.map((d) => ORDEN_DIAS.indexOf(d));
  const contiguos = idxs.every((v, i) => i === 0 || v === idxs[i - 1] + 1);
  if (contiguos && ordenados.length > 1) {
    return `${DIA_LABEL[ordenados[0]]} a ${DIA_LABEL[ordenados[ordenados.length - 1]]}`;
  }
  return ordenados.map((d) => DIA_LABEL[d]).join(', ');
}

export default function ComprarEntradas() {
  const [tipos, setTipos] = useState<TipoTicket[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [fecha, setFecha] = useState<Date | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [tickets, setTickets] = useState<TicketForm[]>([{ tipoTicketId: '', edad: '' }]);
  const [metodoPago, setMetodoPago] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const [loadError, setLoadError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const vista = useVista();
  const esDesktop = vista === 'desktop';

  useEffect(() => {
    Promise.all([api.tipos(), api.horarios()])
      .then(([t, h]) => {
        const tt = t as TipoTicket[];
        setTipos(tt);
        setHorarios(h as Horario[]);
        // Por defecto, el tipo más económico (Regular) para el primer visitante.
        const barato = [...tt].sort((a, b) => a.precio - b.precio)[0];
        if (barato) setTickets([{ tipoTicketId: String(barato.id), edad: '' }]);
      })
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  const diasAbiertos = useMemo(() => new Set(horarios.map((h) => h.dia_semana)), [horarios]);
  const horarioInfo = useMemo(() => {
    if (horarios.length === 0) return null;
    return {
      dias: resumirDias(horarios.map((h) => h.dia_semana)),
      apertura: horarios[0].hora_apertura,
      cierre: horarios[0].hora_cierre,
    };
  }, [horarios]);
  const tipoById = useMemo(() => Object.fromEntries(tipos.map((t) => [String(t.id), t])), [tipos]);
  const tipoBarato = useMemo(() => [...tipos].sort((a, b) => a.precio - b.precio)[0], [tipos]);
  const total = tickets.reduce((acc, t) => acc + (tipoById[t.tipoTicketId]?.precio ?? 0), 0);
  const esTarjeta = metodoPago === 'tarjeta';
  const fechaISO = fecha ? toISO(fecha) : '';

  function setCantidadYTickets(v: number) {
    setCantidad(v);
    setTickets((prev) => {
      const next = [...prev];
      while (next.length < v) next.push({ tipoTicketId: tipoBarato ? String(tipoBarato.id) : '', edad: '' });
      next.length = v;
      return next;
    });
    setErrores((e) => ({ ...e, visitantes: undefined }));
  }

  function setTicket(i: number, patch: Partial<TicketForm>) {
    setTickets((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
    setErrores((e) => ({ ...e, visitantes: undefined }));
  }

  function validar(): boolean {
    const e: Errores = {};
    if (!fechaISO) e.fecha = 'Elegí una fecha de visita.';
    if (cantidad < 1 || cantidad > 10) e.visitantes = 'La cantidad debe estar entre 1 y 10 entradas.';
    for (const [i, t] of tickets.entries()) {
      if (!t.tipoTicketId) { e.visitantes = `Elegí el tipo de pase del visitante #${i + 1}.`; break; }
      if (t.edad === '' || Number.isNaN(Number(t.edad)) || Number(t.edad) < 0 || Number(t.edad) > 120) {
        e.visitantes = `Completá una edad válida (0–120) para el visitante #${i + 1}.`; break;
      }
    }
    if (!metodoPago) e.pago = 'Seleccioná una forma de pago.';
    setErrores(e);
    return Object.keys(e).length === 0;
  }

  function abrirConfirmacion() {
    if (validar()) setConfirmOpen(true);
  }

  async function confirmarCompra() {
    setLoading(true);
    try {
      const res = await api.comprar({
        fechaVisita: fechaISO,
        metodoPago,
        tickets: tickets.map((t) => ({ tipoTicketId: Number(t.tipoTicketId), edad: Number(t.edad) })),
      }) as { redirectUrl?: string };
      if (res.redirectUrl) {
        toast.info('Te llevamos a Mercado Pago…', { description: 'No cierres esta pestaña.' });
        window.location.href = res.redirectUrl;
        return;
      }
      setConfirmOpen(false);
      toast.success('¡Compra registrada!', { description: 'Te enviamos un mail de confirmación.' });
      nav('/confirmacion', { state: res });
    } catch (error) {
      setConfirmOpen(false);
      toast.danger('No pudimos registrar la compra', { description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }

  /* ---------- Hero ---------- */
  const hero = (
    <div
      className="relative animate-fade-in-up overflow-hidden rounded-[1.6rem] p-5 text-white sm:p-6"
      style={{ background: 'linear-gradient(130deg,var(--p6),var(--a6))' }}
    >
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 85% 15%,#fff 0,transparent 40%),radial-gradient(circle at 10% 90%,#fff 0,transparent 35%)' }} />
      <div className="relative">
        <h2 className="font-poppins text-2xl font-bold leading-tight sm:text-3xl">Reservá tu visita</h2>
        <p className="mt-1 text-[13px] text-white/85 sm:text-sm">Asegurá tu lugar en EcoHarmony Park en pocos pasos.</p>
      </div>
    </div>
  );

  /* ---------- Resumen ---------- */
  const resumen = (
    <Glass className="p-4">
      <div className="flex items-center justify-between text-[13px] text-slate-500">
        <span>{cantidad} {cantidad === 1 ? 'entrada' : 'entradas'}</span>
        {fechaISO && <span className="capitalize">{fmtISOLong(fechaISO)}</span>}
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-emerald-900/[0.07] pt-2">
        <span className="font-poppins font-semibold text-slate-700">Total</span>
        <span className="bg-clip-text font-poppins text-2xl font-bold text-transparent" style={{ backgroundImage: 'linear-gradient(135deg,var(--p6),var(--a6))' }}>{ARS(total)}</span>
      </div>
    </Glass>
  );

  /* ---------- CTA ---------- */
  const cta = (
    <PrimaryBtn onClick={abrirConfirmacion} disabled={tipos.length === 0}>
      <Lock className="size-4" />
      {esTarjeta ? 'Pagar con Mercado Pago' : 'Confirmar compra'} · {ARS(total)}
    </PrimaryBtn>
  );

  /* ---------- Secciones del formulario ---------- */
  const secciones = (
    <>
          {/* 1 · Fecha */}
          <Glass className="animate-fade-in-up p-4">
            <SectionLabel n={1} icon={CalendarDays} hint={fechaISO ? '✓' : 'requerido'}>Fecha de visita</SectionLabel>

            {/* Horarios del parque (tabla Horarios) + días cerrados */}
            {horarioInfo && (
              <div className="mb-3 rounded-xl border border-emerald-900/10 bg-white/60 p-3">
                <div className="flex items-center gap-2 text-[13px] font-medium text-slate-700">
                  <Clock3 className="size-4 shrink-0 text-emerald-600" />
                  <span>{horarioInfo.dias} · {horarioInfo.apertura} a {horarioInfo.cierre} hs</span>
                </div>
                <div className="mt-1.5 flex items-start gap-2 text-[12px] text-slate-500">
                  <CalendarX className="mt-px size-4 shrink-0 text-rose-500" />
                  <span>Cerrado los <b>lunes</b> y feriados (<b>25 dic</b> y <b>1 ene</b>). La compra para esos días es rechazada.</span>
                </div>
              </div>
            )}

            {fechaISO && (
              <div className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-[13px] font-medium text-emerald-800">
                <Check className="size-4" /><span className="capitalize">{fmtISOLong(fechaISO)}</span>
              </div>
            )}
            <Calendar selected={fecha} onSelect={(d) => { setFecha(d); setErrores((e) => ({ ...e, fecha: undefined })); }} diasAbiertos={diasAbiertos} />
            <FieldError>{errores.fecha}</FieldError>
          </Glass>

          {/* 2 · Pases (precios) */}
          <Glass className="animate-fade-in-up p-4">
            <SectionLabel n={2} icon={Ticket} hint="precios">Tipos de pase</SectionLabel>
            <div className="space-y-2.5">
              {tipos.map((tipo) => {
                const vip = tipo.nombre.toLowerCase().includes('vip');
                const I = vip ? Crown : Ticket;
                return (
                  <div key={tipo.id} className="flex items-center gap-3 rounded-2xl border border-emerald-900/10 bg-white/60 p-3">
                    <span
                      className="grid size-10 shrink-0 place-items-center rounded-xl text-white"
                      style={{ background: vip ? 'linear-gradient(135deg,var(--a6),var(--p6))' : 'linear-gradient(135deg,var(--p4),var(--a5))' }}
                    >
                      <I className="size-5" />
                    </span>
                    <h4 className="min-w-0 flex-1 font-poppins text-[15px] font-semibold text-slate-800">Pase {tipo.nombre}</h4>
                    <div className="shrink-0 text-right">
                      <span className="font-poppins text-lg font-bold text-slate-900">{ARS(tipo.precio)}</span>
                      <span className="text-[11px] text-slate-400"> /pers.</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Glass>

          {/* 3 · Cantidad y visitantes */}
          <Glass className="animate-fade-in-up p-4">
            <SectionLabel n={3} icon={Users} hint="máx. 10">Cantidad y visitantes</SectionLabel>
            <Stepper value={cantidad} min={1} max={10} onChange={setCantidadYTickets} />
            <p className="mb-2 mt-4 text-[12.5px] text-slate-500">Elegí el tipo de pase y la edad de cada visitante</p>
            <div className="space-y-2.5">
              {tickets.map((t, i) => (
                <div key={i} className="animate-fade-in-up rounded-xl border border-emerald-900/10 bg-white/60 p-3" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500/12 text-[11px] font-bold text-emerald-700">{i + 1}</span>
                    <span className="text-[12.5px] font-medium text-slate-600">Visitante {i + 1}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={120}
                      placeholder="Edad"
                      value={t.edad}
                      onChange={(e) => setTicket(i, { edad: e.target.value })}
                      className="ml-auto w-24 rounded-lg border border-emerald-900/10 bg-white px-3 py-1.5 text-right text-[14px] font-medium text-slate-800 outline-none transition focus:border-emerald-500/60 placeholder:font-normal placeholder:text-slate-400"
                    />
                    <span className="text-[11px] text-slate-400">años</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {tipos.map((tipo) => {
                      const sel = t.tipoTicketId === String(tipo.id);
                      return (
                        <button
                          key={tipo.id}
                          type="button"
                          onClick={() => setTicket(i, { tipoTicketId: String(tipo.id) })}
                          className={`flex items-center justify-between gap-1 rounded-xl border-2 px-3 py-2 text-left transition active:scale-[0.98] ${
                            sel ? 'border-transparent bg-emerald-500/[0.07]' : 'border-emerald-900/10 bg-white/70 hover:border-emerald-500/40'
                          }`}
                          style={sel ? { boxShadow: '0 0 0 2px var(--p5)' } : {}}
                        >
                          <div className="min-w-0">
                            <div className="truncate text-[13px] font-semibold text-slate-800">{tipo.nombre}</div>
                            <div className="text-[11.5px] text-slate-500">{ARS(tipo.precio)}</div>
                          </div>
                          <span
                            className={`grid size-4 shrink-0 place-items-center rounded-full border-2 ${sel ? 'border-transparent text-white' : 'border-slate-300 text-transparent'}`}
                            style={sel ? { background: 'linear-gradient(135deg,var(--p5),var(--a6))' } : {}}
                          >
                            <Check className="size-2.5" strokeWidth={3} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <FieldError>{errores.visitantes}</FieldError>
          </Glass>

          {/* 4 · Forma de pago */}
          <Glass className="animate-fade-in-up p-4">
            <SectionLabel n={4} icon={Lock} hint={metodoPago ? '✓' : 'requerido'}>Forma de pago</SectionLabel>
            <div className="space-y-2.5">
              {[
                { id: 'tarjeta', t: 'Tarjeta', s: 'Pago seguro vía Mercado Pago', badge: 'Recomendado' },
                { id: 'efectivo', t: 'Efectivo', s: 'Abonás al ingresar, en boletería' },
              ].map((o) => {
                const sel = metodoPago === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => { setMetodoPago(o.id); setErrores((e) => ({ ...e, pago: undefined })); }}
                    className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition active:scale-[0.99] ${
                      sel ? 'border-transparent bg-emerald-500/[0.06]' : 'border-emerald-900/10 bg-white/60 hover:border-emerald-500/40'
                    }`}
                    style={sel ? { boxShadow: '0 0 0 2px var(--p5)' } : {}}
                  >
                    <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white" style={o.id === 'efectivo' ? { background: 'linear-gradient(135deg,var(--p5),var(--a6))' } : {}}>
                      {o.id === 'tarjeta'
                        ? <img src={mpLogo} alt="Mercado Pago" className="size-7 object-contain" />
                        : <Banknote className="size-5 text-white" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-poppins text-[14.5px] font-semibold text-slate-800">{o.t}</span>
                        {o.badge && <span className="rounded-full bg-emerald-500/12 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-emerald-700">{o.badge}</span>}
                      </div>
                      <div className="text-[12px] text-slate-500">{o.s}</div>
                    </div>
                    <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${sel ? 'border-transparent text-white' : 'border-slate-300 text-transparent'}`} style={sel ? { background: 'linear-gradient(135deg,var(--p5),var(--a6))' } : {}}>
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  </button>
                );
              })}
            </div>
            <FieldError>{errores.pago}</FieldError>
          </Glass>
    </>
  );

  /* ---------- Bottom-sheet de confirmación (compartido) ---------- */
  const confirmacionSheet = confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => !loading && setConfirmOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            style={{ animation: 'fade-in-up .2s ease' }}
          />
          <div className="relative w-full max-w-[420px] rounded-t-[1.8rem] bg-[var(--screen-bg)] p-5 shadow-2xl sm:rounded-[1.8rem]" style={{ animation: 'fade-in-up .3s cubic-bezier(0.22,1,0.36,1) both' }}>
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-300 sm:hidden" />
            {!loading && (
              <button type="button" onClick={() => setConfirmOpen(false)} className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-500/10" aria-label="Cerrar">
                <X className="size-5" />
              </button>
            )}
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl text-white" style={{ background: 'linear-gradient(135deg,var(--p5),var(--a6))' }}>
                {esTarjeta ? <ShieldCheck className="size-5" /> : <Ticket className="size-5" />}
              </span>
              <div>
                <h3 className="font-poppins text-lg font-bold text-slate-900">Confirmá tu compra</h3>
                <p className="text-[12.5px] text-slate-500 capitalize">{fmtISOLong(fechaISO)}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white/70 p-3">
              <ul className="flex max-h-44 flex-col gap-1.5 overflow-y-auto text-[13px]">
                {tickets.map((t, i) => {
                  const tipo = tipoById[t.tipoTicketId];
                  return (
                    <li key={i} className="flex items-center justify-between gap-3">
                      <span className="text-slate-600">Visitante {i + 1} · {tipo?.nombre} · {t.edad} años</span>
                      <span className="font-medium text-slate-800">{ARS(tipo?.precio ?? 0)}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-2 flex items-center justify-between border-t border-emerald-900/[0.07] pt-2">
                <span className="text-[13px] text-slate-500">Forma de pago: <span className="font-medium capitalize text-slate-700">{metodoPago}</span></span>
                <span className="font-poppins text-lg font-bold text-slate-900">{ARS(total)}</span>
              </div>
            </div>

            {esTarjeta && (
              <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-800">
                <Info className="size-4 shrink-0" />
                Te redirigimos a Mercado Pago para completar el pago de forma segura.
              </p>
            )}

            <div className="mt-4 flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={loading}
                className="flex-1 rounded-2xl border border-emerald-900/10 bg-white/70 px-5 py-3.5 font-poppins text-[15px] font-semibold text-slate-600 transition active:scale-[0.985] disabled:opacity-40"
              >
                Cancelar
              </button>
              <div className="flex-1">
                <PrimaryBtn onClick={confirmarCompra} disabled={loading}>
                  {loading ? (
                    <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <>{esTarjeta ? 'Ir a pagar' : 'Confirmar'}</>
                  )}
                </PrimaryBtn>
              </div>
            </div>
          </div>
        </div>
  );

  /* ════════════ Layout escritorio (web normal) ════════════ */
  if (esDesktop) {
    return (
      <div className="px-6 py-8">
        <div className="mx-auto max-w-5xl">
          {hero}
          {loadError && <Glass className="mt-4 p-4"><FieldError>{loadError}</FieldError></Glass>}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            {/* Columna formulario */}
            <div className="flex flex-col gap-4">{secciones}</div>
            {/* Columna resumen (sticky) */}
            <aside className="flex flex-col gap-3 lg:sticky lg:top-6">
              {resumen}
              {cta}
              <p className="text-center text-[11px] text-slate-400">Compra disponible solo para usuarios registrados</p>
            </aside>
          </div>
        </div>
        {confirmacionSheet}
      </div>
    );
  }

  /* ════════════ Layout móvil (app) ════════════ */
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3">
        <div className="mb-4">{hero}</div>
        {loadError && <Glass className="mb-3 p-4"><FieldError>{loadError}</FieldError></Glass>}
        <div className="eco-sections">{secciones}</div>
        <div className="mt-3.5">{resumen}</div>
      </div>
      <div className="border-t border-emerald-900/[0.06] bg-white/70 px-4 py-3 backdrop-blur-xl">
        {cta}
        <p className="mt-2 text-center text-[11px] text-slate-400">Compra disponible solo para usuarios registrados</p>
      </div>
      {confirmacionSheet}
    </div>
  );
}
