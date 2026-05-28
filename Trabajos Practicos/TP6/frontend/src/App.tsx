import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toast } from '@heroui/react';
import { useAuth } from './lib/auth';
import { Aurora, AppBar } from './components/ui';
import ComprarEntradas from './pages/comprar-entradas';
import Confirmacion from './pages/confirmacion';
import PagoResultado from './pages/pago-resultado';

const TITULOS: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: 'Comprar entradas', subtitle: 'EcoHarmony Park' },
  '/confirmacion': { title: 'Confirmación' },
  '/pago/exito': { title: 'Resultado del pago' },
  '/pago/error': { title: 'Resultado del pago' },
  '/pago/pendiente': { title: 'Resultado del pago' },
};

export default function App() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const nav = useNavigate();

  const meta = TITULOS[pathname] ?? TITULOS['/'];
  const esInicio = pathname === '/';

  return (
    <div className="app-stage">
      <Aurora />
      <div className="screen">
        <AppBar
          title={meta.title}
          subtitle={meta.subtitle}
          usuario={user.nombre}
          onBack={esInicio ? undefined : () => nav('/')}
        />
        <main className="flex-1 overflow-y-auto overscroll-contain">
          <Routes>
            <Route path="/" element={<ComprarEntradas />} />
            <Route path="/confirmacion" element={<Confirmacion />} />
            <Route path="/pago/exito" element={<PagoResultado />} />
            <Route path="/pago/error" element={<PagoResultado />} />
            <Route path="/pago/pendiente" element={<PagoResultado />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <Toast.Provider placement="top end" />
    </div>
  );
}
