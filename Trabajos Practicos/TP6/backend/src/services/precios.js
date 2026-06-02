// Reglas de precios por edad de EcoHarmony Park.
//
// Aclaración de la clienta (Constanza):
//  - Menores o iguales a 3 años: no pagan (entrada gratis, 100% de descuento).
//  - Menores o iguales a 15 años: 50% de descuento.
//  - Mayores o iguales a 60 años: 50% de descuento.
//  - Resto (16 a 59 años): pagan el precio completo.
// Se puede comprar para cualquier edad entre 0 y 99 años inclusive.

const EDAD_MIN = 0;
const EDAD_MAX = 99;

// Descuento aplicable según la edad, como fracción del precio (0 = paga todo,
// 0.5 = mitad, 1 = gratis). El tramo de ≤3 años (gratis) tiene prioridad sobre
// el de ≤15 (50%) por ser el más beneficioso para el visitante.
function descuentoPorEdad(edad) {
  const e = Number(edad);
  if (e <= 3) return 1;     // gratis
  if (e <= 15) return 0.5;  // 50% off
  if (e >= 60) return 0.5;  // 50% off
  return 0;                 // precio completo
}

// Precio final de una entrada para un visitante de la edad indicada.
function precioConDescuento(precioBase, edad) {
  return Math.round(Number(precioBase) * (1 - descuentoPorEdad(edad)));
}

module.exports = { descuentoPorEdad, precioConDescuento, EDAD_MIN, EDAD_MAX };
