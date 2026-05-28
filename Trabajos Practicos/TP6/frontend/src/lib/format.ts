// Helpers de formato de moneda y fechas + reglas de apertura del parque.

export const ARS = (n: number) => '$' + n.toLocaleString('es-AR');

export const MES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
export const DIA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const sameDay = (a: Date | null, b: Date | null) =>
  !!a && !!b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// 'YYYY-MM-DD' en hora local (sin corrimiento por UTC).
export const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const fmtLong = (d: Date) =>
  cap(`${DIA[d.getDay()]} ${d.getDate()} de ${MES[d.getMonth()]} ${d.getFullYear()}`);

export const fmtISOLong = (iso: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return fmtLong(new Date(y, m - 1, d));
};

// Feriados en los que el parque cierra (espejo del backend): 25-dic y 1-ene.
export const FERIADOS = ['12-25', '01-01'];

export const esFeriado = (d: Date) => {
  const mmdd = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return FERIADOS.includes(mmdd);
};
