import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toast } from '@heroui/react';
import { useAuth } from './lib/auth';
import { VistaContext, type Vista } from './lib/vista';
import { Aurora, AppBar, Navbar } from './components/ui';
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

function vistaInicial(): Vista {
  const guardada = localStorage.getItem('eco-vista');
  if (guardada === 'mobile' || guardada === 'desktop') return guardada;
  return typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'desktop' : 'mobile';
}

export default function App() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const nav = useNavigate();
  const [vista, setVista] = useState<Vista>(vistaInicial);

  useEffect(() => { localStorage.setItem('eco-vista', vista); }, [vista]);

  const meta = TITULOS[pathname] ?? TITULOS['/'];
  const esInicio = pathname === '/';
  const toggle = () => setVista((v) => (v === 'desktop' ? 'mobile' : 'desktop'));

  const routes = (
    <Routes>
      <Route path="/" element={<ComprarEntradas />} />
      <Route path="/confirmacion" element={<Confirmacion />} />
      <Route path="/pago/exito" element={<PagoResultado />} />
      <Route path="/pago/error" element={<PagoResultado />} />
      <Route path="/pago/pendiente" element={<PagoResultado />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  // Vista escritorio: web normal con navbar a todo el ancho y flujo de documento.
  if (vista === 'desktop') {
    return (
      <VistaContext.Provider value={vista}>
        <div className="min-h-screen bg-[var(--stage-bg)]">
          <Navbar usuario={user.nombre} vista={vista} onToggleVista={toggle} onHome={() => nav('/')} />
          <main>{routes}</main>
        </div>
        <Toast.Provider placement="top end" />
      </VistaContext.Provider>
    );
  }

  // Vista móvil: marco tipo app con aurora y pantalla.
  return (
    <VistaContext.Provider value={vista}>
      <div className="app-stage">
        <Aurora />
        <div className="screen">
          <AppBar
            title={meta.title}
            subtitle={meta.subtitle}
            usuario={user.nombre}
            onBack={esInicio ? undefined : () => nav('/')}
            vista={vista}
            onToggleVista={toggle}
          />
          <main className="flex-1 overflow-y-auto overscroll-contain">{routes}</main>
        </div>
        <Toast.Provider placement="top" />
      </div>
    </VistaContext.Provider>
  );
}
