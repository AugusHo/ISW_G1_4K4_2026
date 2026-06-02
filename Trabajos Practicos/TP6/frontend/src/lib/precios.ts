// Reglas de precios por edad (espejo del backend, ver backend/src/services/precios.js).
//
// Aclaración de la clienta (Constanza):
//  - Menores o iguales a 3 años: no pagan (entrada gratis).
//  - Menores o iguales a 15 años: 50% de descuento.
//  - Mayores o iguales a 60 años: 50% de descuento.
//  - Resto (16 a 59 años): pagan el precio completo.
// Se puede comprar para cualquier edad entre 0 y 99 años inclusive.

export const EDAD_MIN = 0;
export const EDAD_MAX = 99;

// Descuento aplicable según la edad, como fracción del precio (0 = paga todo,
// 0.5 = mitad, 1 = gratis). El tramo de ≤3 años tiene prioridad sobre el de ≤15.
export function descuentoPorEdad(edad: number | null): number {
  if (edad == null || Number.isNaN(edad)) return 0;
  if (edad <= 3) return 1;     // gratis
  if (edad <= 15) return 0.5;  // 50% off
  if (edad >= 60) return 0.5;  // 50% off
  return 0;                    // precio completo
}

// Precio final de una entrada para un visitante de la edad indicada.
export function precioConDescuento(precioBase: number, edad: number | null): number {
  return Math.round(precioBase * (1 - descuentoPorEdad(edad)));
}
