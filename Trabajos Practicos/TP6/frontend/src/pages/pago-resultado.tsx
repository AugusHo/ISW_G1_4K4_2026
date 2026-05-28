import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, Button, Spinner, Separator } from '@heroui/react';
import { Clock3, X, Leaf } from 'lucide-react';
import { api } from '../lib/api';

interface EstadoCompra {
  compraId: number;
  estado: string;
  estadoPago: string | null;
  cantidad: number;
  fechaVisita: string;
  montoTotal: number;
  metodoPago: string;
}

// Mercado Pago redirige a las back_urls con query params:
// ?status=approved&payment_id=...&external_reference=<compraId>&merchant_order_id=...
const TEXTO: Record<string, {
  titulo: string;
  detalle: string;
  tono: 'success' | 'warning' | 'danger';
}> = {
  approved: { titulo: '¡Pago aprobado!', detalle: 'Tu compra quedó confirmada.', tono: 'success' },
  pending: { titulo: 'Pago pendiente', detalle: 'Estamos esperando la acreditación del pago.', tono: 'warning' },
  in_process: { titulo: 'Pago en proceso', detalle: 'Estamos procesando tu pago.', tono: 'warning' },
  rejected: { titulo: 'Pago rechazado', detalle: 'No pudimos procesar el pago. Probá con otro medio.', tono: 'danger' },
  cancelled: { titulo: 'Pago cancelado', detalle: 'Cancelaste el pago antes de finalizar.', tono: 'danger' },
};

const TONO_CLASES: Record<'success' | 'warning' | 'danger', { bg: string; text: string; ring: string }> = {
  success: { bg: 'bg-success-soft', text: 'text-success-soft-foreground', ring: 'ring-success/30' },
  warning: { bg: 'bg-warning-soft', text: 'text-warning-soft-foreground', ring: 'ring-warning/30' },
  danger: { bg: 'bg-danger-soft', text: 'text-danger-soft-foreground', ring: 'ring-danger/30' },
};

const MAX_REINTENTOS = 4;

function IconoResultado({ tono }: { tono: 'success' | 'warning' | 'danger' }) {
  const c = TONO_CLASES[tono];
  return (
    <div className={`grid size-20 place-items-center rounded-full ${c.bg} ${c.text} ring-8 ${c.ring} animate-pop-in`}>
      {tono === 'success' ? (
        <svg viewBox="0 0 24 24" fill="none" className="size-10" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path className="check-path" d="M20 6 9 17l-5-5" />
        </svg>
      ) : tono === 'warning' ? (
        <Clock3 className="size-10" />
      ) : (
        <X className="size-10" strokeWidth={2.5} />
      )}
    </div>
  );
}

export default function PagoResultado() {
  const [params] = useSearchParams();
  const [compra, setCompra] = useState<EstadoCompra | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const intentos = useRef(0);

  // status del query, o fallback al collection_status (formato legacy de MP)
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

    // MP puede tardar unos instantes en acreditar el pago. Si volvimos con
    // status "approved" pero el backend todavía ve la compra "pendiente",
    // reintentamos un par de veces antes de mostrar el resultado.
    async function sincronizar() {
      try {
        const c = await api.estadoCompra(externalRef as string) as EstadoCompra;
        if (cancelado) return;

        const esperandoAcreditacion =
          status === 'approved' &&
          c.estado === 'pendiente' &&
          intentos.current < MAX_REINTENTOS;

        if (esperandoAcreditacion) {
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
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [externalRef, status]);

  // El estado real lo manda el backend (sincronizado con MP); si aún no llegó,
  // usamos el status del query como referencia visual.
  const estadoEfectivo = compra
    ? (compra.estado === 'confirmado' ? 'approved'
      : compra.estado === 'cancelado' ? (compra.estadoPago ?? 'rejected')
      : (compra.estadoPago ?? status))
    : status;
  const info = TEXTO[estadoEfectivo] ?? TEXTO.pending;

  if (loading) {
    return (
      <Card className="animate-fade-in-up shadow-md">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <Spinner size="lg" />
          <div>
            <p className="text-lg font-semibold">Confirmando tu pago…</p>
            <p className="text-sm text-muted">Estamos verificando el estado con Mercado Pago.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (err) {
    return (
      <Card className="animate-fade-in-up shadow-md">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <IconoResultado tono="danger" />
          <div>
            <h1 className="text-xl font-bold">Algo salió mal</h1>
            <p className="mt-1 text-sm text-muted">{err}</p>
          </div>
          <Link to="/" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">Volver al inicio</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in-up shadow-md">
      <CardContent className="flex flex-col items-center gap-5 py-8 text-center">
        <IconoResultado tono={info.tono} />
        <div>
          <h1 className="text-2xl font-bold">{info.titulo}</h1>
          <p className="mt-1 text-sm text-muted">{info.detalle}</p>
        </div>

        {compra && (
          <div className="w-full rounded-xl bg-default-50 p-4 text-left text-sm">
            <dl className="flex flex-col gap-2">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Compra</dt>
                <dd className="font-medium">#{compra.compraId}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Estado</dt>
                <dd className="font-medium capitalize">{compra.estado}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Entradas</dt>
                <dd className="font-medium">{compra.cantidad}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Fecha de visita</dt>
                <dd className="font-medium">{compra.fechaVisita}</dd>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between gap-4 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="font-bold">${compra.montoTotal.toLocaleString('es-AR')}</dd>
              </div>
            </dl>
          </div>
        )}

        {compra?.estado === 'confirmado' && (
          <p className="flex items-center justify-center gap-1.5 text-sm text-muted">
            Te enviamos un mail de confirmación. Mostralo al ingresar al parque.
            <Leaf className="size-4 text-success" />
          </p>
        )}

        <Link to="/" className="w-full sm:w-auto">
          <Button variant={info.tono === 'success' ? 'primary' : 'secondary'} className="w-full sm:w-auto">
            {info.tono === 'success' ? 'Comprar más entradas' : 'Volver al inicio'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
