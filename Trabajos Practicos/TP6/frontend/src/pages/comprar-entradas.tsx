import { useEffect, useMemo, useState } from 'react';
import {
  Card, CardHeader, CardContent,
  TextField, Label, Input, FieldError,
  Select, ListBox, ListBoxItem,
  RadioGroup, Radio,
  Button, Spinner, Separator,
} from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface TipoTicket {
  id: number;
  nombre: string;
  precio: number;
}

interface Horario {
  dia_semana: string;
}

interface TicketForm {
  tipoTicketId: string;
  edad: string;
}

const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const HOY = new Date().toISOString().slice(0, 10);

function diaSemana(fechaISO: string): string | null {
  if (!fechaISO) return null;
  const [y, m, d] = fechaISO.split('-').map(Number);
  return DIAS[new Date(y, m - 1, d).getDay()];
}

export default function ComprarEntradas() {
  const [tipos, setTipos] = useState<TipoTicket[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [fecha, setFecha] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [tickets, setTickets] = useState<TicketForm[]>([{ tipoTicketId: '', edad: '' }]);
  const [metodoPago, setMetodoPago] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    Promise.all([api.tipos(), api.horarios()])
      .then(([t, h]) => {
        setTipos(t as TipoTicket[]);
        setHorarios(h as Horario[]);
      })
      .catch((e: Error) => setErr(e.message));
  }, []);

  function ajustarCantidad(n: string) {
    const v = Math.max(1, Math.min(10, Number(n) || 1));
    setCantidad(v);
    setTickets((prev) => {
      const next = [...prev];
      while (next.length < v) next.push({ tipoTicketId: '', edad: '' });
      next.length = v;
      return next;
    });
  }

  function setTicket(i: number, patch: Partial<TicketForm>) {
    setTickets((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }

  const tipoById = useMemo(
    () => Object.fromEntries(tipos.map((t) => [t.id, t])),
    [tipos],
  );
  const total = tickets.reduce((acc, t) => acc + (tipoById[t.tipoTicketId]?.precio ?? 0), 0);
  const diasAbiertos = useMemo(() => new Set(horarios.map((h) => h.dia_semana)), [horarios]);
  const diaInvalido = fecha && !diasAbiertos.has(diaSemana(fecha) ?? '');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!fecha) return setErr('Indicá la fecha de visita');
    if (diaInvalido) return setErr('El parque está cerrado ese día');
    if (!metodoPago) return setErr('Seleccioná una forma de pago');
    if (cantidad > 10) return setErr('La cantidad máxima es 10 entradas');
    for (const [i, t] of tickets.entries()) {
      if (!t.tipoTicketId) return setErr(`Seleccioná el tipo de pase del visitante #${i + 1}`);
      if (t.edad === '' || Number.isNaN(Number(t.edad))) return setErr(`Indicá la edad del visitante #${i + 1}`);
    }

    setLoading(true);
    try {
      const res = await api.comprar({
        fechaVisita: fecha,
        metodoPago,
        tickets: tickets.map((t) => ({ tipoTicketId: Number(t.tipoTicketId), edad: Number(t.edad) })),
      }) as { redirectUrl?: string };
      if (res.redirectUrl) {
        window.location.href = res.redirectUrl;
        return;
      }
      nav('/confirmacion', { state: res });
    } catch (error) {
      setErr((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <h1 className="text-2xl font-bold">Comprar entradas</h1>
          <p className="text-sm">Asegurá tu visita al parque</p>
        </div>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-5" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              value={fecha}
              onChange={setFecha}
              isRequired
              isInvalid={!!diaInvalido}
            >
              <Label>Fecha de visita</Label>
              <Input type="date" min={HOY} />
              {diaInvalido && <FieldError>El parque está cerrado ese día</FieldError>}
            </TextField>
            <TextField
              value={String(cantidad)}
              onChange={ajustarCantidad}
              isRequired
            >
              <Label>Cantidad de entradas (máx 10)</Label>
              <Input type="number" min={1} max={10} />
              <FieldError />
            </TextField>
          </div>

          <Separator />

          <div className="flex flex-col gap-3">
            <h2 className="font-semibold">Visitantes</h2>
            {tickets.map((t, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-default-50">
                <Select
                  selectedKey={t.tipoTicketId || null}
                  onSelectionChange={(key) => setTicket(i, { tipoTicketId: key != null ? String(key) : '' })}
                  isRequired
                >
                  <Label>Tipo de pase #{i + 1}</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {tipos.map((tipo) => (
                        <ListBoxItem key={String(tipo.id)} id={String(tipo.id)} textValue={`${tipo.nombre} - $${tipo.precio}`}>
                          {tipo.nombre} - ${tipo.precio}
                        </ListBoxItem>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
                <TextField
                  value={t.edad}
                  onChange={(v) => setTicket(i, { edad: v })}
                  isRequired
                >
                  <Label>Edad</Label>
                  <Input type="number" min={0} max={120} />
                  <FieldError />
                </TextField>
              </div>
            ))}
          </div>

          <Separator />

          <RadioGroup value={metodoPago} onChange={setMetodoPago} isRequired>
            <Label>Forma de pago</Label>
            <div className="flex gap-4 mt-1">
              <Radio value="efectivo">
                <Radio.Control><Radio.Indicator /></Radio.Control>
                <Radio.Content>Efectivo (en boletería)</Radio.Content>
              </Radio>
              <Radio value="tarjeta">
                <Radio.Control><Radio.Indicator /></Radio.Control>
                <Radio.Content>Tarjeta (Mercado Pago)</Radio.Content>
              </Radio>
            </div>
          </RadioGroup>

          <div className="flex items-center justify-between mt-2">
            <span className="text-lg">
              Total: <strong>${total.toLocaleString('es-AR')}</strong>
            </span>
            <Button type="submit" isDisabled={loading}>
              {loading
                ? <Spinner />
                : metodoPago === 'tarjeta'
                  ? 'Pagar con Mercado Pago'
                  : 'Confirmar compra'}
            </Button>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
