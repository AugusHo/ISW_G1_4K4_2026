import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { Toast } from '@heroui/react';
import { Leaf } from 'lucide-react';
import { useAuth } from './lib/auth';
import ComprarEntradas from './pages/comprar-entradas';
import Confirmacion from './pages/confirmacion';
import PagoResultado from './pages/pago-resultado';

export default function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-success-soft/30 via-background to-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold">
            <Leaf className="size-6 text-success" />
            <span className="hidden xs:inline sm:inline">EcoHarmony Park</span>
            <span className="inline xs:hidden sm:hidden">EcoHarmony</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-success-soft text-success-soft-foreground font-semibold">
              {user.nombre.charAt(0).toUpperCase()}
            </span>
            <div className="leading-tight">
              <div className="font-medium">{user.nombre}</div>
              <div className="hidden text-xs text-muted sm:block">{user.email}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-6 sm:py-10">
        <Routes>
          <Route path="/" element={<ComprarEntradas />} />
          <Route path="/confirmacion" element={<Confirmacion />} />
          <Route path="/pago/exito" element={<PagoResultado />} />
          <Route path="/pago/error" element={<PagoResultado />} />
          <Route path="/pago/pendiente" element={<PagoResultado />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Toast.Provider placement="top end" />
    </div>
  );
}
