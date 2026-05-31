import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Separator } from '@heroui/react';
import { Leaf, Mail, Clock3, X, Info, Ticket } from 'lucide-react';
import { ARS, fmtISOLong } from '../lib/format';
import { api } from '../lib/api';
import logo from '../assets/logo.png';

interface EstadoCompra {
  compraId: number;
  estado: string;
  estadoPago: string | null;
  cantidad: number;
  fechaVisita: string;
  montoTotal: number;
  metodoPago: string;
}

const TEXTO: Record<string, { titulo: string; detalle: string; tono: 'success' | 'warning' | 'danger' }> = {
  approved: { titulo: '¡Pago aprobado!', detalle: 'Tu compra quedó confirmada.', tono: 'success' },
  pending: { titulo: 'Pago pendiente', detalle: 'Estamos esperando la acreditación del pago.', tono: 'warning' },
  in_process: { titulo: 'Pago en proceso', detalle: 'Estamos procesando tu pago.', tono: 'warning' },
  rejected: { titulo: 'Pago rechazado', detalle: 'No pudimos procesar el pago. Probá con otro medio.', tono: 'danger' },
  cancelled: { titulo: 'Pago cancelado', detalle: 'Cancelaste el pago antes de finalizar.', tono: 'danger' },
};

const GRAD: Record<'success' | 'warning' | 'danger', string> = {
  success: 'linear-gradient(135deg,var(--p5),var(--a5))',
  warning: 'linear-gradient(135deg,#f59e0b,#d97706)',
  danger: 'linear-gradient(135deg,#cf5e60,var(--brick))',
};

const MAX_REINTENTOS = 4;

function IconoResultado({ tono }: { tono: 'success' | 'warning' | 'danger' }) {
  return (
    <div className="relative grid size-20 place-items-center rounded-full animate-pop-in" style={{ background: GRAD[tono], boxShadow: '0 16px 36px -12px rgba(56,102,65,0.45)' }}>
      {tono === 'success' && <span className="absolute inset-0 animate-ping rounded-full opacity-30" style={{ background: 'var(--p5)' }} />}
      {tono === 'success' ? (
        <svg viewBox="0 0 24 24" fill="none" className="relative size-10 text-white" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path className="check-path" d="M20 6 9 17l-5-5" />
        </svg>
      ) : tono === 'warning' ? (
        <Clock3 className="size-10 text-white" />
      ) : (
        <X className="size-10 text-white" strokeWidth={2.5} />
      )}
    </div>
  );
}

export default function PagoResultado() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [compra, setCompra] = useState<EstadoCompra | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const intentos = useRef(0);

  const status = params.get('status') ?? params.get('collection_status') ?? 'pending';
  const externalRef = params.get('external_reference');

  useEffect(() => {
    if (!externalRef) {
      setErr('No se recibió la referencia de la compra.');
      setLoading(false);
      return;
    }
    let cancelado = false;
    let timer: ReturnType<typeof setTimeout>;

    async function sincronizar() {
      try {
        const c = await api.estadoCompra(externalRef as string) as EstadoCompra;
        if (cancelado) return;
        const esperando = status === 'approved' && c.estado === 'pendiente' && intentos.current < MAX_REINTENTOS;
        if (esperando) {
          intentos.current += 1;
          timer = setTimeout(sincronizar, 1500);
          return;
        }
        setCompra(c);
        setLoading(false);
      } catch (e) {
        if (cancelado) return;
        setErr((e as Error).message);
        setLoading(false);
      }
    }

    sincronizar();
    return () => { cancelado = true; clearTimeout(timer); };
  }, [externalRef, status]);

  const estadoEfectivo = compra
    ? (compra.estado === 'confirmado' ? 'approved'
      : compra.estado === 'cancelado' ? (compra.estadoPago ?? 'rejected')
      : (compra.estadoPago ?? status))
    : status;
  const info = TEXTO[estadoEfectivo] ?? TEXTO.pending;

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <Spinner size="lg" />
        <div>
          <p className="font-display text-lg font-semibold text-slate-700">Confirmando tu pago…</p>
          <p className="mt-1 text-[13px] text-muted">Verificando el estado con Mercado Pago.</p>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-12 text-center">
        <IconoResultado tono="danger" />
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">Algo salió mal</h2>
          <p className="mt-1 text-[13.5px] text-muted">{err}</p>
        </div>
        <Button variant="primary" onPress={() => nav('/')}><Leaf className="size-4" />Volver al inicio</Button>
      </div>
    );
  }

  const confirmado = compra?.estado === 'confirmado';

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-12 pt-6">
      <div className="mb-5 flex flex-col items-center text-center">
        <IconoResultado tono={info.tono} />
        <h2 className="mt-4 font-display text-2xl font-bold text-slate-900">{info.titulo}</h2>
        <p className="mt-1 px-2 text-[14px] text-slate-600">{info.detalle}</p>
        {confirmado && (
          <div className="mt-3 flex items-center gap-2 rounded-full bg-accent-soft px-3.5 py-2 text-[13px] font-medium text-accent-soft-foreground">
            <Mail className="size-4" />Enviamos la confirmación a tu correo
          </div>
        )}
      </div>

      {compra && (
        <Card className="overflow-hidden border-emerald-900/[0.06]">
          <div className="p-5 text-white" style={{ background: 'linear-gradient(120deg,var(--p6),var(--a6))' }}>
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="EcoHarmony Park" className="size-9 shrink-0 rounded-full bg-white object-cover ring-2 ring-white/60" />
              <span className="font-display font-bold tracking-tight">EcoHarmony Park</span>
            </div>
            <div className="mt-3 flex items-center gap-2 font-display text-lg font-semibold">
              <Ticket className="size-5" />Compra #{compra.compraId}
            </div>
          </div>
          <Card.Content>
            <div className="grid grid-cols-2 gap-x-3 gap-y-4">
              <div><div className="mb-0.5 text-[11px] text-muted">Fecha de visita</div><div className="text-[13.5px] font-medium capitalize text-slate-800">{fmtISOLong(compra.fechaVisita)}</div></div>
              <div><div className="mb-0.5 text-[11px] text-muted">Entradas</div><div className="text-[13.5px] font-medium text-slate-800">{compra.cantidad} {compra.cantidad === 1 ? 'persona' : 'personas'}</div></div>
              <div><div className="mb-0.5 text-[11px] text-muted">Estado</div><div className="text-[13.5px] font-medium capitalize text-slate-800">{compra.estado}</div></div>
              <div><div className="mb-0.5 text-[11px] text-muted">Total</div><div className="font-display text-[16px] font-bold text-slate-800">{ARS(compra.montoTotal)}</div></div>
            </div>
          </Card.Content>
        </Card>
      )}

      <div className="mt-4 flex items-start gap-2 px-1 text-[12.5px] text-muted">
        <Info className="mt-px size-4 shrink-0" style={{ color: 'var(--p5)' }} />
        <span>
          {confirmado
            ? 'Mostrá la confirmación en el acceso para validar tus entradas al ingresar.'
            : 'Si el pago quedó pendiente, podés volver a intentarlo desde el inicio.'}
        </span>
      </div>

      <Separator className="my-5" />
      <Button variant="primary" className="w-full" onPress={() => nav('/')}>
        <Leaf className="size-4" />{info.tono === 'success' ? 'Comprar más entradas' : 'Volver al inicio'}
      </Button>
    </div>
  );
}
