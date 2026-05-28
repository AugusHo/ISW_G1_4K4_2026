import { useLocation, Link } from 'react-router-dom';
import { Card, CardContent, Button, Separator } from '@heroui/react';
import { Leaf } from 'lucide-react';

interface CompraState {
  cantidad: number;
  fechaVisita: string;
  montoTotal: number;
  metodoPago: string;
}

export default function Confirmacion() {
  const { state } = useLocation();
  const compra = state as CompraState | null;

  if (!compra) {
    return (
      <Card className="animate-fade-in-up shadow-md">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <p className="text-muted">No hay ninguna compra para mostrar.</p>
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
        <div className="grid size-20 place-items-center rounded-full bg-success-soft text-success-soft-foreground ring-8 ring-success/30 animate-pop-in">
          <svg viewBox="0 0 24 24" fill="none" className="size-10" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path className="check-path" d="M20 6 9 17l-5-5" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold">¡Compra registrada!</h1>
          <p className="mt-1 text-sm text-muted">Ya tenés tu lugar en EcoHarmony Park.</p>
        </div>

        <div className="w-full rounded-xl bg-default-50 p-4 text-left text-sm">
          <dl className="flex flex-col gap-2">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Entradas</dt>
              <dd className="font-medium">{compra.cantidad}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Fecha de visita</dt>
              <dd className="font-medium">{compra.fechaVisita}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Forma de pago</dt>
              <dd className="font-medium capitalize">{compra.metodoPago}</dd>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between gap-4 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-bold">${compra.montoTotal.toLocaleString('es-AR')}</dd>
            </div>
          </dl>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-sm text-muted">
          Te enviamos un mail de confirmación. Mostralo al ingresar al parque.
          <Leaf className="size-4 text-success" />
        </p>

        <Link to="/" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">Comprar más entradas</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
