import { useState } from 'react';
import { Card, CardHeader, CardContent, TextField, Label, Input, FieldError, Button, Spinner } from '@heroui/react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

interface RegisterResponse {
  token: string;
  usuario: { nombre: string; email: string };
}

export default function Register() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const r = await api.register({ email, nombre, contrasena }) as RegisterResponse;
      login(r.token, r.usuario);
      nav('/');
    } catch (error) {
      setErr((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader><h1 className="text-xl font-bold">Crear cuenta</h1></CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <TextField value={nombre} onChange={setNombre} isRequired>
            <Label>Nombre</Label>
            <Input />
            <FieldError />
          </TextField>
          <TextField value={email} onChange={setEmail} isRequired>
            <Label>Email</Label>
            <Input type="email" />
            <FieldError />
          </TextField>
          <TextField value={contrasena} onChange={setContrasena} isRequired>
            <Label>Contraseña</Label>
            <Input type="password" />
            <FieldError />
          </TextField>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <Button type="submit" isDisabled={loading}>
            {loading ? <Spinner /> : 'Registrarme'}
          </Button>
          <p className="text-sm">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="underline">Ingresar</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
