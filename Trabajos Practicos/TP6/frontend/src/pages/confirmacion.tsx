import { useLocation, useNavigate } from 'react-router-dom';
import { Leaf, Mail, Info, Ticket } from 'lucide-react';
import { Glass, PrimaryBtn } from '../components/ui';
import { ARS, fmtISOLong } from '../lib/format';

interface CompraState {
  compraId?: number;
  cantidad: number;
  fechaVisita: string;
  montoTotal: number;
  metodoPago: string;
}

function Info2({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <div className="mb-0.5 text-[11px] text-slate-400">{label}</div>
      <div className={`${strong ? 'font-poppins text-[16px] font-bold' : 'text-[13.5px] font-medium'} text-slate-800`}>{value}</div>
    </div>
  );
}

export default function Confirmacion() {
  const { state } = useLocation();
  const nav = useNavigate();
  const compra = state as CompraState | null;

  if (!compra) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-12 text-center">
        <p className="text-slate-500">No hay ninguna compra para mostrar.</p>
        <div className="w-full max-w-xs"><PrimaryBtn onClick={() => nav('/')}><Leaf className="size-4" />Volver al inicio</PrimaryBtn></div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-12 pt-6">
      <div className="mb-5 flex flex-col items-center text-center">
        <div className="relative mb-4 grid size-20 place-items-center rounded-full animate-pop-in" style={{ background: 'linear-gradient(135deg,var(--p5),var(--a5))', boxShadow: '0 16px 36px -12px var(--p6)' }}>
          <span className="absolute inset-0 animate-ping rounded-full opacity-30" style={{ background: 'var(--p5)' }} />
          <svg viewBox="0 0 24 24" fill="none" className="relative size-10 text-white" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path className="check-path" d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 className="font-poppins text-2xl font-bold text-slate-900">¡Compra registrada!</h2>
        <p className="mt-1.5 px-2 text-[14px] text-slate-600">
          Reservaste <b>{compra.cantidad} {compra.cantidad === 1 ? 'entrada' : 'entradas'}</b> para el <b className="capitalize">{fmtISOLong(compra.fechaVisita)}</b>.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-full bg-emerald-500/10 px-3.5 py-2 text-[13px] font-medium text-emerald-800">
          <Mail className="size-4" />Enviamos la confirmación a tu correo
        </div>
      </div>

      {/* Ticket */}
      <Glass className="overflow-hidden">
        <div className="p-5 text-white" style={{ background: 'linear-gradient(120deg,var(--p6),var(--a6))' }}>
          <div className="flex items-center gap-2">
            <Leaf className="size-5" />
            <span className="font-poppins font-bold tracking-tight">EcoHarmony Park</span>
          </div>
          <div className="mt-3 flex items-center gap-2 font-poppins text-lg font-semibold">
            <Ticket className="size-5" />Entradas confirmadas
          </div>
        </div>
        <div className="relative h-0">
          <span className="absolute -left-2.5 -top-2.5 size-5 rounded-full bg-[var(--screen-bg)]" />
          <span className="absolute -right-2.5 -top-2.5 size-5 rounded-full bg-[var(--screen-bg)]" />
          <div className="absolute left-3 right-3 top-0 border-t-2 border-dashed border-emerald-900/15" />
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 p-5">
          <Info2 label="Fecha de visita" value={fmtISOLong(compra.fechaVisita)} />
          <Info2 label="Entradas" value={`${compra.cantidad} ${compra.cantidad === 1 ? 'persona' : 'personas'}`} />
          <Info2 label="Forma de pago" value={compra.metodoPago === 'tarjeta' ? 'Tarjeta (Mercado Pago)' : 'Efectivo en boletería'} />
          <Info2 label="Total" value={ARS(compra.montoTotal)} strong />
          {compra.compraId != null && <Info2 label="N° de compra" value={`#${compra.compraId}`} />}
          <Info2 label="Estado" value={compra.metodoPago === 'tarjeta' ? 'Pagada' : 'A abonar en ingreso'} />
        </div>
      </Glass>

      <div className="mt-4 flex items-start gap-2 px-1 text-[12.5px] text-slate-500">
        <Info className="mt-px size-4 shrink-0" style={{ color: 'var(--p5)' }} />
        <span>
          {compra.metodoPago === 'tarjeta'
            ? 'Mostrá la confirmación en el acceso para validar tus entradas al ingresar.'
            : 'Presentá esta confirmación en boletería para abonar y retirar tus entradas el día de la visita.'}
        </span>
      </div>

      <div className="mt-5"><PrimaryBtn onClick={() => nav('/')}><Leaf className="size-4" />Volver al inicio</PrimaryBtn></div>
    </div>
  );
}
