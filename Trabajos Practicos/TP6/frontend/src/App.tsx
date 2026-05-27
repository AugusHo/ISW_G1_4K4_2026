import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import { useAuth } from './lib/auth';
import Login from './pages/login';
import Register from './pages/register';
import ComprarEntradas from './pages/comprar-entradas';
import Confirmacion from './pages/confirmacion';

function Private({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <Link to="/" className="font-bold text-lg">EcoHarmony Park</Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:inline text-sm">Hola, {user.nombre}</span>
              <Button
                variant="outline"
                size="sm"
                onPress={() => { logout(); nav('/login'); }}
              >
                Salir
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm hover:underline">Ingresar</Link>
              <Link to="/register" className="text-sm hover:underline">Registrarse</Link>
            </>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Routes>
          <Route path="/" element={<Private><ComprarEntradas /></Private>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/confirmacion" element={<Private><Confirmacion /></Private>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
