import { useLocation, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, Button } from '@heroui/react';

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
      <Card>
        <CardContent>
          <p>No hay compra para mostrar.</p>
          <Link to="/"><Button className="mt-3">Volver</Button></Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h1 className="text-2xl font-bold">¡Compra registrada!</h1>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p>Cantidad de entradas: <strong>{compra.cantidad}</strong></p>
        <p>Fecha de visita: <strong>{compra.fechaVisita}</strong></p>
        <p>Monto total: <strong>${compra.montoTotal.toLocaleString('es-AR')}</strong></p>
        <p>Método de pago: <strong>{compra.metodoPago}</strong></p>
        <p className="text-sm mt-2">
          Te enviamos un mail de confirmación. Mostralo al ingresar al parque.
        </p>
        <Link to="/"><Button variant="outline" className="mt-3">Comprar más</Button></Link>
      </CardContent>
    </Card>
  );
}
