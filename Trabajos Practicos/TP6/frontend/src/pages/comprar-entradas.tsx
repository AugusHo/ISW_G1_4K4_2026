import { useEffect, useMemo, useState, type ReactNode, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Button, NumberField, RadioGroup, Radio,
  Alert, Separator, Modal, Label, toast,
} from '@heroui/react';
import {
  CalendarDays, Ticket, Users, Lock, Crown, Banknote, ShieldCheck, Clock3, Info,
} from 'lucide-react';
import { api } from '../lib/api';
import { ARS, fmtISOLong, toISO } from '../lib/format';
import { precioConDescuento, descuentoPorEdad, EDAD_MIN, EDAD_MAX } from '../lib/precios';
import { useVista } from '../lib/vista';
import { Calendar } from '../components/ui';
import mpLogo from '../assets/MercadoPago.png';

interface TipoTicket { id: number; nombre: string; precio: number; }
interface Horario { dia_semana: string; hora_apertura: string; hora_cierre: string; }
interface TicketForm { tipoTicketId: string; edad: number | null; }
type Errores = { fecha?: string; pago?: string; visitantes?: string };

const ORDEN_DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const DIA_LABEL: Record<string, string> = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves',
  viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo',
};

function resumirDias(dias: string[]): string {
  const ordenados = [...dias].sort((a, b) => ORDEN_DIAS.indexOf(a) - ORDEN_DIAS.indexOf(b));
  if (ordenados.length === 0) return '';
  const idxs = ordenados.map((d) => ORDEN_DIAS.indexOf(d));
  const contiguos = idxs.every((v, i) => i === 0 || v === idxs[i - 1] + 1);
  if (contiguos && ordenados.length > 1) return `${DIA_LABEL[ordenados[0]]} a ${DIA_LABEL[ordenados[ordenados.length - 1]]}`;
  return ordenados.map((d) => DIA_LABEL[d]).join(', ');
}

/* Sección = Card de HeroUI con cabecera numerada. */
function Seccion({
  id, n, icon: Icon, title, hint, children,
}: {
  id?: string;
  n: number;
  icon: ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <Card id={id} className="border-emerald-900/[0.06]">
      <Card.Header>
        <div className="flex w-full items-center gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,var(--p5),var(--a5))' }}>{n}</span>
          <Icon className="size-[18px] shrink-0 text-emerald-700" />
          <Card.Title className="font-display text-[15px]">{title}</Card.Title>
          {hint && <span className="ml-auto text-[11px] text-muted">{hint}</span>}
        </div>
      </Card.Header>
      <Card.Content>{children}</Card.Content>
    </Card>
  );
}

export default function ComprarEntradas() {
  const [tipos, setTipos] = useState<TipoTicket[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [fecha, setFecha] = useState<Date | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [tickets, setTickets] = useState<TicketForm[]>([{ tipoTicketId: '', edad: null }]);
  const [metodoPago, setMetodoPago] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const [loadError, setLoadError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const esDesktop = useVista() === 'desktop';

  useEffect(() => {
    Promise.all([api.tipos(), api.horarios()])
      .then(([t, h]) => {
        const tt = t as TipoTicket[];
        setTipos(tt);
        setHorarios(h as Horario[]);
        const barato = [...tt].sort((a, b) => a.precio - b.precio)[0];
        if (barato) setTickets([{ tipoTicketId: String(barato.id), edad: null }]);
      })
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  const diasAbiertos = useMemo(() => new Set(horarios.map((h) => h.dia_semana)), [horarios]);
  const horarioInfo = useMemo(() => {
    if (horarios.length === 0) return null;
    return { dias: resumirDias(horarios.map((h) => h.dia_semana)), apertura: horarios[0].hora_apertura, cierre: horarios[0].hora_cierre };
  }, [horarios]);
  const tipoById = useMemo(() => Object.fromEntries(tipos.map((t) => [String(t.id), t])), [tipos]);
  const tipoBarato = useMemo(() => [...tipos].sort((a, b) => a.precio - b.precio)[0], [tipos]);
  // Precio final de cada visitante = precio del pase con el descuento por edad aplicado.
  const precioTicket = (t: TicketForm) =>
    precioConDescuento(tipoById[t.tipoTicketId]?.precio ?? 0, t.edad);
  const total = tickets.reduce((acc, t) => acc + precioTicket(t), 0);
  const esTarjeta = metodoPago === 'tarjeta';
  const fechaISO = fecha ? toISO(fecha) : '';

  const clearErr = (k: keyof Errores) => setErrores((e) => ({ ...e, [k]: undefined }));

  function setCantidadYTickets(v: number) {
    const n = Math.max(1, Math.min(10, Number.isNaN(v) ? 1 : v));
    setCantidad(n);
    setTickets((prev) => {
      const next = [...prev];
      while (next.length < n) next.push({ tipoTicketId: tipoBarato ? String(tipoBarato.id) : '', edad: null });
      next.length = n;
      return next;
    });
    clearErr('visitantes');
  }

  function setTicket(i: number, patch: Partial<TicketForm>) {
    setTickets((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
    clearErr('visitantes');
  }

  function validar(): Errores {
    const e: Errores = {};
    if (!fechaISO) e.fecha = 'Elegí una fecha de visita.';
    if (cantidad < 1 || cantidad > 10) e.visitantes = 'La cantidad debe estar entre 1 y 10 entradas.';
    for (const [i, t] of tickets.entries()) {
      if (!t.tipoTicketId) { e.visitantes = `Elegí el tipo de pase del visitante #${i + 1}.`; break; }
      if (t.edad == null || Number.isNaN(t.edad) || t.edad < EDAD_MIN || t.edad > EDAD_MAX) {
        e.visitantes = `Completá una edad válida (${EDAD_MIN}–${EDAD_MAX}) para el visitante #${i + 1}.`; break;
      }
    }
    if (!metodoPago) e.pago = 'Seleccioná una forma de pago.';
    setErrores(e);
    return e;
  }

  function abrirConfirmacion() {
    const e = validar();
    const orden: { key: keyof Errores; id: string }[] = [
      { key: 'fecha', id: 'sec-fecha' },
      { key: 'visitantes', id: 'sec-visitantes' },
      { key: 'pago', id: 'sec-pago' },
    ];
    const primero = orden.find((o) => e[o.key]);
    if (primero) {
      document.getElementById(primero.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast.warning('Faltan datos para continuar', { description: e[primero.key]! });
      return;
    }
    setConfirmOpen(true);
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
    <div className="relative animate-fade-in-up overflow-hidden rounded-[1.6rem] p-5 text-white sm:p-6" style={{ background: 'linear-gradient(130deg,var(--p6),var(--a6))' }}>
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 85% 15%,#fff 0,transparent 40%),radial-gradient(circle at 10% 90%,#fff 0,transparent 35%)' }} />
      <div className="relative">
        <h2 className="font-display text-2xl font-bold leading-tight sm:text-3xl">Reservá tu visita</h2>
        <p className="mt-1 text-[13px] text-white/85 sm:text-sm">Asegurá tu lugar en EcoHarmony Park en pocos pasos.</p>
      </div>
    </div>
  );

  /* ---------- Resumen ---------- */
  const resumen = (
    <Card className="border-emerald-900/[0.06]">
      <Card.Content>
        <div className="flex items-center justify-between text-[13px] text-muted">
          <span>{cantidad} {cantidad === 1 ? 'entrada' : 'entradas'}</span>
          {fechaISO && <span className="capitalize">{fmtISOLong(fechaISO)}</span>}
        </div>
        <Separator className="my-2" />
        <div className="flex items-center justify-between">
          <span className="font-display font-semibold text-slate-700">Total</span>
          <span className="bg-clip-text font-display text-2xl font-bold text-transparent" style={{ backgroundImage: 'linear-gradient(135deg,var(--p6),var(--a6))' }}>{ARS(total)}</span>
        </div>
      </Card.Content>
    </Card>
  );

  /* ---------- CTA ---------- */
  const cta = (
    <Button variant="primary" size="lg" className="w-full" onPress={abrirConfirmacion} isDisabled={tipos.length === 0}>
      <Lock className="size-4" />
      {esTarjeta ? 'Pagar con Mercado Pago' : 'Confirmar compra'} · {ARS(total)}
    </Button>
  );

  /* ---------- Secciones ---------- */
  const secciones = (
    <>
      {/* 1 · Fecha */}
      <Seccion id="sec-fecha" n={1} icon={CalendarDays} title="Fecha de visita" hint={fechaISO ? '✓' : 'requerido'}>
        {horarioInfo && (
          <div className="mb-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[13px] font-medium text-slate-700">
              <Clock3 className="size-4 shrink-0 text-emerald-600" />
              <span>{horarioInfo.dias} · {horarioInfo.apertura} a {horarioInfo.cierre} hs</span>
            </div>
            <Alert status="warning">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>
                  Cerrado los <b>lunes</b> y feriados (<b>25 dic</b> y <b>1 ene</b>). La compra para esos días es rechazada.
                </Alert.Description>
              </Alert.Content>
            </Alert>
          </div>
        )}
        {fechaISO && (
          <div className="mb-3 rounded-xl bg-accent-soft px-3 py-2 text-[13px] font-medium text-accent-soft-foreground capitalize">
            {fmtISOLong(fechaISO)}
          </div>
        )}
        <Calendar
          selected={fecha}
          onSelect={(d) => { setFecha(d); clearErr('fecha'); }}
          diasAbiertos={diasAbiertos}
        />
        {errores.fecha && <p className="mt-2 text-[12.5px] font-medium text-danger">{errores.fecha}</p>}
      </Seccion>

      {/* 2 · Pases */}
      <Seccion n={2} icon={Ticket} title="Tipos de pase" hint="precios">
        <div className="flex flex-col gap-2.5">
          {tipos.map((tipo) => {
            const vip = tipo.nombre.toLowerCase().includes('vip');
            const I = vip ? Crown : Ticket;
            return (
              <div key={tipo.id} className="flex items-center gap-3 rounded-2xl border border-emerald-900/10 bg-default-50 p-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: vip ? 'linear-gradient(135deg,var(--a6),var(--p6))' : 'linear-gradient(135deg,var(--p4),var(--a5))' }}>
                  <I className="size-5" />
                </span>
                <h4 className="min-w-0 flex-1 font-display text-[15px] font-semibold text-slate-800">Pase {tipo.nombre}</h4>
                <div className="shrink-0 text-right">
                  <span className="font-display text-lg font-bold text-slate-900">{ARS(tipo.precio)}</span>
                  <span className="text-[11px] text-muted"> /pers.</span>
                </div>
              </div>
            );
          })}
        </div>
        <Alert status="accent" className="mt-3">
          <Alert.Indicator><Info className="size-4" /></Alert.Indicator>
          <Alert.Content>
            <Alert.Description>
              Descuentos por edad: <b>menores o iguales a 3 años</b> no pagan; <b>menores o iguales a 15 años</b> y <b>mayores o iguales a 60 años</b> abonan el <b>50%</b>. El precio se ajusta automáticamente con la edad de cada visitante.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      </Seccion>

      {/* 3 · Cantidad y visitantes */}
      <Seccion id="sec-visitantes" n={3} icon={Users} title="Cantidad y visitantes" hint="máx. 10">
        <NumberField value={cantidad} minValue={1} maxValue={10} onChange={setCantidadYTickets}>
          <Label className="text-[12.5px] text-muted">Cantidad de entradas</Label>
          <NumberField.Group className="mt-1 w-full max-w-[12rem]">
            <NumberField.DecrementButton />
            <NumberField.Input />
            <NumberField.IncrementButton />
          </NumberField.Group>
        </NumberField>

        <p className="mb-2 mt-4 text-[12.5px] text-muted">Elegí el tipo de pase y la edad de cada visitante</p>
        <div className="flex flex-col gap-2.5">
          {tickets.map((t, i) => (
            <div key={i} className="rounded-xl border border-emerald-900/10 bg-default-50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-bold text-accent-soft-foreground">{i + 1}</span>
                <span className="text-[12.5px] font-medium text-slate-600">Visitante {i + 1}</span>
                <div className="ml-auto">
                  <NumberField
                    value={t.edad ?? Number.NaN}
                    minValue={EDAD_MIN}
                    onChange={(v) => setTicket(i, { edad: Number.isNaN(v) ? null : v })}
                  >
                    <Label className="sr-only">Edad del visitante {i + 1}</Label>
                    <NumberField.Group className="w-[8.5rem]">
                      <NumberField.DecrementButton />
                      <NumberField.Input placeholder="Edad" />
                      <NumberField.IncrementButton />
                    </NumberField.Group>
                  </NumberField>
                  {t.edad != null && t.edad > EDAD_MAX && (
                    <p className="mt-1 text-[11.5px] font-medium text-danger">La edad máxima es {EDAD_MAX} años.</p>
                  )}
                </div>
              </div>
              <RadioGroup
                aria-label={`Tipo de pase del visitante ${i + 1}`}
                orientation="horizontal"
                value={t.tipoTicketId || null}
                onChange={(v) => setTicket(i, { tipoTicketId: v ?? '' })}
              >
                {tipos.map((tipo) => (
                  <Radio key={tipo.id} value={String(tipo.id)}>
                    <Radio.Control><Radio.Indicator /></Radio.Control>
                    <Radio.Content>
                      <span className="text-[13px] font-medium">{tipo.nombre}</span>
                      <span className="text-[11.5px] text-muted"> · {ARS(tipo.precio)}</span>
                    </Radio.Content>
                  </Radio>
                ))}
              </RadioGroup>
              {t.tipoTicketId && descuentoPorEdad(t.edad) > 0 && (
                <p className="mt-2 text-[12px] font-medium text-emerald-700">
                  {descuentoPorEdad(t.edad) === 1
                    ? 'Entrada gratis (menor o igual a 3 años)'
                    : `${Math.round(descuentoPorEdad(t.edad) * 100)}% off por edad`}
                  {' · '}
                  <span className="text-muted line-through">{ARS(tipoById[t.tipoTicketId]?.precio ?? 0)}</span>
                  {' '}
                  <span className="font-bold">{ARS(precioTicket(t))}</span>
                </p>
              )}
            </div>
          ))}
        </div>
        {errores.visitantes && <p className="mt-2 text-[12.5px] font-medium text-danger">{errores.visitantes}</p>}
      </Seccion>

      {/* 4 · Forma de pago */}
      <Seccion id="sec-pago" n={4} icon={Lock} title="Forma de pago" hint={metodoPago ? '✓' : 'requerido'}>
        <RadioGroup aria-label="Forma de pago" value={metodoPago || null} onChange={(v) => { setMetodoPago(v ?? ''); clearErr('pago'); }}>
          <Radio value="tarjeta">
            <Radio.Control><Radio.Indicator /></Radio.Control>
            <Radio.Content>
              <div className="flex items-center gap-2">
                <img src={mpLogo} alt="Mercado Pago" className="h-5 w-auto" />
                <span className="font-display text-[14.5px] font-semibold">Tarjeta</span>
                <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-accent-soft-foreground">Recomendado</span>
              </div>
              <span className="text-[12px] text-muted">Pago seguro vía Mercado Pago</span>
            </Radio.Content>
          </Radio>
          <Radio value="efectivo">
            <Radio.Control><Radio.Indicator /></Radio.Control>
            <Radio.Content>
              <div className="flex items-center gap-2">
                <Banknote className="size-5 text-emerald-600" />
                <span className="font-display text-[14.5px] font-semibold">Efectivo</span>
              </div>
              <span className="text-[12px] text-muted">Abonás al ingresar, en boletería</span>
            </Radio.Content>
          </Radio>
        </RadioGroup>
        {errores.pago && <p className="mt-2 text-[12.5px] font-medium text-danger">{errores.pago}</p>}
      </Seccion>
    </>
  );

  /* ---------- Modal de confirmación (HeroUI) ---------- */
  const confirmacionModal = (
    <Modal.Backdrop isOpen={confirmOpen} onOpenChange={(v) => !loading && setConfirmOpen(v)}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-[440px]">
          {!loading && <Modal.CloseTrigger />}
          <Modal.Header>
            <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
              {esTarjeta ? <ShieldCheck className="size-5" /> : <Ticket className="size-5" />}
            </Modal.Icon>
            <Modal.Heading>Confirmá tu compra</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <p className="text-[13px] text-muted capitalize">{fmtISOLong(fechaISO)}</p>
            <Separator className="my-3" />
            <ul className="flex max-h-44 flex-col gap-1.5 overflow-y-auto text-[13px]">
              {tickets.map((t, i) => {
                const tipo = tipoById[t.tipoTicketId];
                const dto = descuentoPorEdad(t.edad);
                return (
                  <li key={i} className="flex items-center justify-between gap-3">
                    <span className="text-muted">
                      Visitante {i + 1} · {tipo?.nombre} · {t.edad} años
                      {dto > 0 && (
                        <span className="text-emerald-700"> · {dto === 1 ? 'gratis' : `${Math.round(dto * 100)}% off`}</span>
                      )}
                    </span>
                    <span className="font-medium">{ARS(precioTicket(t))}</span>
                  </li>
                );
              })}
            </ul>
            <Separator className="my-3" />
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-muted">Forma de pago: <span className="font-medium capitalize text-foreground">{metodoPago}</span></span>
              <span className="font-display text-lg font-bold">{ARS(total)}</span>
            </div>
            {esTarjeta && (
              <Alert status="accent" className="mt-3">
                <Alert.Indicator><Info className="size-4" /></Alert.Indicator>
                <Alert.Content>
                  <Alert.Description>Te redirigimos a Mercado Pago para completar el pago de forma segura.</Alert.Description>
                </Alert.Content>
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button slot="close" variant="secondary" isDisabled={loading}>Cancelar</Button>
            <Button variant="primary" onPress={confirmarCompra} isPending={loading}>{esTarjeta ? 'Ir a pagar' : 'Confirmar'}</Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );

  /* ════════════ Layout escritorio (web normal) ════════════ */
  if (esDesktop) {
    return (
      <div className="px-6 py-8">
        <div className="mx-auto max-w-5xl">
          {hero}
          {loadError && (
            <Alert status="danger" className="mt-4">
              <Alert.Indicator />
              <Alert.Content><Alert.Description>{loadError}</Alert.Description></Alert.Content>
            </Alert>
          )}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            <div className="flex flex-col gap-4">{secciones}</div>
            <aside className="flex flex-col gap-3 lg:sticky lg:top-20">
              {resumen}
              {cta}
              <p className="text-center text-[11px] text-muted">Compra disponible solo para usuarios registrados</p>
            </aside>
          </div>
        </div>
        {confirmacionModal}
      </div>
    );
  }

  /* ════════════ Layout móvil (app) ════════════ */
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3">
        <div className="mb-4">{hero}</div>
        {loadError && (
          <Alert status="danger" className="mb-3">
            <Alert.Indicator />
            <Alert.Content><Alert.Description>{loadError}</Alert.Description></Alert.Content>
          </Alert>
        )}
        <div className="flex flex-col gap-3.5">{secciones}</div>
        <div className="mt-3.5">{resumen}</div>
      </div>
      <div className="border-t border-emerald-900/[0.06] bg-white/70 px-4 py-3 backdrop-blur-xl">
        {cta}
        <p className="mt-2 text-center text-[11px] text-muted">Compra disponible solo para usuarios registrados</p>
      </div>
      {confirmacionModal}
    </div>
  );
}
