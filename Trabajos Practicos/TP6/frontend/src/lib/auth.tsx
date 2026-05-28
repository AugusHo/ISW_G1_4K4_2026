import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

interface AuthContextType {
  user: Usuario;
}

// Usuario hardcodeado: la sesión está "siempre iniciada" para esta entrega del TP.
// Se sincroniza con el backend vía GET /api/me (mismo usuario id=1).
const HARDCODED_USER: Usuario = {
  id: 1,
  email: 'visitante@ecoharmony.com',
  nombre: 'Visitante EcoHarmony',
};

const AuthContext = createContext<AuthContextType>({ user: HARDCODED_USER });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario>(HARDCODED_USER);

  useEffect(() => {
    api.me()
      .then((u) => setUser(u as Usuario))
      .catch(() => { /* offline: dejamos el hardcoded */ });
  }, []);

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
