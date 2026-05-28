import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, Button, Spinner } from '@heroui/react';
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
const TEXTO: Record<string, { titulo: string; emoji: string; color: string }> = {
  approved: { titulo: '¡Pago aprobado!', emoji: '✅', color: 'text-green-600' },
  pending: { titulo: 'Pago pendiente', emoji: '⏳', color: 'text-amber-600' },
  in_process: { titulo: 'Pago en proceso', emoji: '⏳', color: 'text-amber-600' },
  rejected: { titulo: 'Pago rechazado', emoji: '❌', color: 'text-red-600' },
  cancelled: { titulo: 'Pago cancelado', emoji: '❌', color: 'text-red-600' },
};

export default function PagoResultado() {
  const [params] = useSearchParams();
  const [compra, setCompra] = useState<EstadoCompra | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // status del query, o fallback al collection_status (formato legacy de MP)
  const status = params.get('status') ?? params.get('collection_status') ?? 'pending';
  const externalRef = params.get('external_reference');
  const info = TEXTO[status] ?? TEXTO.pending;

  useEffect(() => {
    if (!externalRef) {
      setErr('No se recibió la referencia de la compra.');
      setLoading(false);
      return;
    }
    api.estadoCompra(externalRef)
      .then((c) => setCompra(c as EstadoCompra))
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [externalRef]);

  return (
    <Card>
      <CardHeader>
        <h1 className="text-2xl font-bold">
          <span className="mr-2">{info.emoji}</span>
          <span className={info.color}>{info.titulo}</span>
        </h1>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {loading && <Spinner />}
        {err && <p className="text-sm text-red-600">{err}</p>}
        {compra && (
          <>
            <p>Compra: <strong>#{compra.compraId}</strong></p>
            <p>Estado de la compra: <strong>{compra.estado}</strong></p>
            {compra.estadoPago && <p>Estado del pago (MP): <strong>{compra.estadoPago}</strong></p>}
            <p>Cantidad de entradas: <strong>{compra.cantidad}</strong></p>
            <p>Fecha de visita: <strong>{compra.fechaVisita}</strong></p>
            <p>Monto total: <strong>${compra.montoTotal.toLocaleString('es-AR')}</strong></p>
            {compra.estado === 'confirmado' && (
              <p className="text-sm mt-2">
                Te enviamos un mail de confirmación. Mostralo al ingresar al parque.
              </p>
            )}
          </>
        )}
        <Link to="/"><Button variant="outline" className="mt-3">Volver al inicio</Button></Link>
      </CardContent>
    </Card>
  );
}
