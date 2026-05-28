import { useEffect, useMemo, useState } from 'react';
import {
  Card, CardHeader, CardContent,
  TextField, Label, Input, FieldError,
  Select, ListBox, ListBoxItem,
  RadioGroup, Radio,
  Button, Spinner, Separator, Modal,
  DatePicker, DateField, Calendar,
  toast,
} from '@heroui/react';
import { today, getLocalTimeZone, type DateValue } from '@internationalized/date';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, Users, Ticket, Banknote,
  ShieldCheck, AlertTriangle,
} from 'lucide-react';
import { api } from '../lib/api';
import mpLogo from '../assets/MercadoPago.png';

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

function diaSemana(fechaISO: string): string | null {
  if (!fechaISO) return null;
  const [y, m, d] = fechaISO.split('-').map(Number);
  return DIAS[new Date(y, m - 1, d).getDay()];
}

function formatearFecha(fechaISO: string): string {
  if (!fechaISO) return '';
  const [y, m, d] = fechaISO.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function ComprarEntradas() {
  const [tipos, setTipos] = useState<TipoTicket[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [fechaValue, setFechaValue] = useState<DateValue | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [tickets, setTickets] = useState<TicketForm[]>([{ tipoTicketId: '', edad: '' }]);
  const [metodoPago, setMetodoPago] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const nav = useNavigate();

  const hoy = today(getLocalTimeZone());
  const fecha = fechaValue ? fechaValue.toString() : ''; // 'YYYY-MM-DD'

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
  const esTarjeta = metodoPago === 'tarjeta';

  // Valida el formulario y, si está OK, abre el modal de confirmación.
  function onSubmit(e: React.FormEvent) {
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
    setConfirmOpen(true);
  }

  // Confirma la compra desde el modal (ya validada).
  async function confirmarCompra() {
    setLoading(true);
    try {
      const res = await api.comprar({
        fechaVisita: fecha,
        metodoPago,
        tickets: tickets.map((t) => ({ tipoTicketId: Number(t.tipoTicketId), edad: Number(t.edad) })),
      }) as { redirectUrl?: string };
      if (res.redirectUrl) {
        toast.info('Te llevamos a Mercado Pago…', { description: 'No cierres esta pestaña.' });
        window.location.href = res.redirectUrl;
        return;
      }
      setConfirmOpen(false);
      toast.success('¡Compra registrada!', { description: 'Te enviamos un mail de confirmación.' });
      nav('/confirmacion', { state: res });
    } catch (error) {
      setConfirmOpen(false);
      const msg = (error as Error).message;
      setErr(msg);
      toast.danger('No pudimos registrar la compra', { description: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="animate-fade-in-up shadow-md">
      <CardHeader>
        <div>
          <h1 className="text-2xl font-bold">Comprar entradas</h1>
          <p className="text-sm text-muted">Asegurá tu visita al parque</p>
        </div>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-5" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DatePicker
              value={fechaValue}
              onChange={setFechaValue}
              minValue={hoy}
              isRequired
              isInvalid={!!diaInvalido}
            >
              <Label className="flex items-center gap-1.5">
                <CalendarDays className="size-4 text-muted" /> Fecha de visita
              </Label>
              <DateField.Group fullWidth>
                <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
                <DateField.Suffix>
                  <DatePicker.Trigger>
                    <DatePicker.TriggerIndicator />
                  </DatePicker.Trigger>
                </DateField.Suffix>
              </DateField.Group>
              {diaInvalido && <FieldError>El parque está cerrado ese día</FieldError>}
              <DatePicker.Popover>
                <Calendar aria-label="Fecha de visita">
                  <Calendar.Header>
                    <Calendar.YearPickerTrigger>
                      <Calendar.YearPickerTriggerHeading />
                      <Calendar.YearPickerTriggerIndicator />
                    </Calendar.YearPickerTrigger>
                    <Calendar.NavButton slot="previous" />
                    <Calendar.NavButton slot="next" />
                  </Calendar.Header>
                  <Calendar.Grid>
                    <Calendar.GridHeader>
                      {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                    </Calendar.GridHeader>
                    <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
                  </Calendar.Grid>
                  <Calendar.YearPickerGrid>
                    <Calendar.YearPickerGridBody>
                      {({ year }) => <Calendar.YearPickerCell year={year} />}
                    </Calendar.YearPickerGridBody>
                  </Calendar.YearPickerGrid>
                </Calendar>
              </DatePicker.Popover>
            </DatePicker>

            <TextField
              value={String(cantidad)}
              onChange={ajustarCantidad}
              isRequired
            >
              <Label className="flex items-center gap-1.5">
                <Users className="size-4 text-muted" /> Cantidad de entradas (máx 10)
              </Label>
              <Input type="number" min={1} max={10} />
              <FieldError />
            </TextField>
          </div>

          <Separator />

          <div className="flex flex-col gap-3">
            <h2 className="flex items-center gap-1.5 font-semibold">
              <Ticket className="size-4 text-muted" /> Visitantes
            </h2>
            {tickets.map((t, i) => (
              <div
                key={i}
                className="grid animate-fade-in-up grid-cols-1 gap-3 rounded-lg bg-default-50 p-3 sm:grid-cols-[1fr_8rem]"
                style={{ animationDelay: `${i * 60}ms` }}
              >
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
            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Radio value="efectivo">
                <Radio.Control><Radio.Indicator /></Radio.Control>
                <Radio.Content className="flex items-center gap-2">
                  <Banknote className="size-5 text-success" /> Efectivo (en boletería)
                </Radio.Content>
              </Radio>
              <Radio value="tarjeta">
                <Radio.Control><Radio.Indicator /></Radio.Control>
                <Radio.Content className="flex items-center gap-2">
                  <img src={mpLogo} alt="Mercado Pago" className="h-5 w-auto" /> Tarjeta (Mercado Pago)
                </Radio.Content>
              </Radio>
            </div>
          </RadioGroup>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-lg">
              Total: <strong>${total.toLocaleString('es-AR')}</strong>
            </span>
            <Button type="submit" className="w-full sm:w-auto">
              {esTarjeta ? 'Pagar con Mercado Pago' : 'Confirmar compra'}
            </Button>
          </div>

          {err && (
            <p className="flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-soft-foreground" role="alert">
              <AlertTriangle className="size-4 shrink-0" /> {err}
            </p>
          )}
        </form>
      </CardContent>

      {/* Modal de confirmación */}
      <Modal.Backdrop isOpen={confirmOpen} onOpenChange={(v) => !loading && setConfirmOpen(v)}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[440px]">
            {!loading && <Modal.CloseTrigger />}
            <Modal.Header>
              <Modal.Icon className="bg-success-soft text-success-soft-foreground">
                {esTarjeta ? <ShieldCheck className="size-5" /> : <Ticket className="size-5" />}
              </Modal.Icon>
              <Modal.Heading>Confirmá tu compra</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Fecha de visita</dt>
                  <dd className="text-right font-medium capitalize">{formatearFecha(fecha)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Entradas</dt>
                  <dd className="font-medium">{cantidad}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Forma de pago</dt>
                  <dd className="font-medium capitalize">{metodoPago}</dd>
                </div>
              </dl>

              <Separator className="my-3" />

              <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto text-sm">
                {tickets.map((t, i) => {
                  const tipo = tipoById[t.tipoTicketId];
                  return (
                    <li key={i} className="flex justify-between gap-4">
                      <span className="text-muted">
                        {tipo?.nombre ?? 'Pase'} · {t.edad} años
                      </span>
                      <span className="font-medium">${(tipo?.precio ?? 0).toLocaleString('es-AR')}</span>
                    </li>
                  );
                })}
              </ul>

              <Separator className="my-3" />

              <div className="flex items-center justify-between text-base">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold">${total.toLocaleString('es-AR')}</span>
              </div>

              {esTarjeta && (
                <p className="mt-3 flex items-center gap-2 rounded-lg bg-accent-soft px-3 py-2 text-xs text-accent-soft-foreground">
                  <img src={mpLogo} alt="Mercado Pago" className="h-4 w-auto" />
                  Te redirigimos a Mercado Pago para completar el pago de forma segura.
                </p>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="secondary" isDisabled={loading}>
                Cancelar
              </Button>
              <Button onPress={confirmarCompra} isDisabled={loading}>
                {loading ? <Spinner /> : esTarjeta ? 'Ir a pagar' : 'Confirmar'}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Card>
  );
}
