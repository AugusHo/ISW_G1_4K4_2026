import { createContext, useContext, useEffect, useState } from 'react';

interface Usuario {
  nombre: string;
  email: string;
}

interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  login: (tk: string, usuario: Usuario) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u) as Usuario);
  }, []);

  const login = (tk: string, usuario: Usuario) => {
    localStorage.setItem('token', tk);
    localStorage.setItem('user', JSON.stringify(usuario));
    setToken(tk);
    setUser(usuario);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
