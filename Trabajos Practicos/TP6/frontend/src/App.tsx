import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth';
import ComprarEntradas from './pages/comprar-entradas';
import Confirmacion from './pages/confirmacion';

export default function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <Link to="/" className="font-bold text-lg">🌿 EcoHarmony Park</Link>
        <div className="text-sm">
          Sesión: <strong>{user.nombre}</strong>
          <span className="hidden sm:inline text-default-500"> ({user.email})</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Routes>
          <Route path="/" element={<ComprarEntradas />} />
          <Route path="/confirmacion" element={<Confirmacion />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
