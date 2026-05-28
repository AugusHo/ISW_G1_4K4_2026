# TP6 – TDD: Comprar entradas (EcoHarmony Park)

Implementación de la User Story **"Comprar entradas"** del bioparque EcoHarmony Park
aplicando el ciclo **Red → Green → Refactor**.

- **Backend:** Node.js + Express + SQLite (`better-sqlite3`) + Jest + Supertest
- **Frontend:** Vite + React + HeroUI + TailwindCSS

## Estructura

```
TP6/
├── backend/
│   ├── src/
│   │   ├── app.js                      # Composición Express (DI)
│   │   ├── server.js                   # Bootstrap del proceso
│   │   ├── db/
│   │   │   ├── index.js                # createDb / seedReferenceData
│   │   │   └── schema.sql              # DDL provisto por la cátedra
│   │   ├── middleware/auth.js          # JWT
│   │   ├── routes/
│   │   │   ├── auth.js                 # /register /login
│   │   │   ├── catalogo.js             # /tipos-ticket /horarios
│   │   │   └── compras.js              # POST /compras
│   │   └── services/
│   │       ├── compraService.js        # ← núcleo dirigido por tests
│   │       ├── mailer.js               # Mailer fake (consola)
│   │       └── mercadoPago.js          # Cliente MP real (TEST) + fake
│   └── tests/
│       ├── compraService.test.js       # Tests unitarios (TDD)
│       └── api.test.js                 # Tests de API (supertest)
└── frontend/
    └── src/
        ├── App.jsx                     # Router + Navbar
        ├── lib/{api.js, auth.jsx}      # Cliente HTTP + auth context
        └── pages/
            ├── Login.jsx / Register.jsx
            ├── ComprarEntradas.jsx     # Form principal
            └── Confirmacion.jsx        # Pantalla final
```

## Cómo correr

### Backend

```bash
cd backend
npm install
npm test         # Ejecutar la batería de pruebas
npm run dev      # Levantar API en http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173 (proxy a :3001/api)
```

## Integración con Mercado Pago (entorno de PRUEBA)

El pago con **tarjeta** usa **Checkout Pro** de Mercado Pago en modo TEST (SDK
oficial `mercadopago`). El flujo es:

1. El backend crea una **preferencia** (`POST /checkout/preferences`) con los
   ítems de la compra y devuelve el `init_point`.
2. El frontend redirige al comprador a ese `init_point` (checkout de MP).
3. Tras pagar, MP redirige a las `back_urls` del frontend
   (`/pago/exito`, `/pago/error`, `/pago/pendiente`) con `external_reference`
   (el id de compra) y el `status` del pago.
4. La página de resultado consulta `GET /api/compras/:id/estado`, que busca el
   pago real en Mercado Pago y sincroniza el estado de la compra
   (`pendiente → confirmado/cancelado`).

### Configuración

En `backend/.env` (ver `.env.example`):

```bash
MP_ACCESS_TOKEN=TEST-...        # Access Token de PRUEBA de tu app
FRONTEND_URL=http://localhost:5173
```

> El Access Token de prueba se obtiene en
> [panel de desarrolladores → tu app → Credenciales de prueba](https://www.mercadopago.com.ar/developers/panel/app).
> Si `MP_ACCESS_TOKEN` está vacío, la app usa un cliente **FAKE** (útil para
> tests y dev sin credenciales). Por eso la batería de tests TDD no necesita red.

### Redirección automática al volver del pago (túnel)

Mercado Pago **no permite redirigir (`auto_return`) a `localhost`**: exige una
URL pública **https**. En desarrollo se resuelve con un túnel que publica el
frontend local. El código activa `auto_return` automáticamente cuando
`FRONTEND_URL` es https público.

```bash
# 1) Levantar un túnel al frontend (puerto 5173)
npx cloudflared tunnel --url http://localhost:5173
#    -> devuelve una URL tipo https://<random>.trycloudflare.com
```

```bash
# 2) En backend/.env apuntar FRONTEND_URL a esa URL y reiniciar el backend
FRONTEND_URL=https://<random>.trycloudflare.com
```

- El `vite.config.ts` ya permite estos hosts (`allowedHosts`).
- **Abrí la app desde la URL del túnel** (no desde `localhost`), porque MP
  redirige a ese dominio. El túnel solo reenvía a tu `localhost:5173`.

> **Duración del túnel:** vive mientras corra el proceso `cloudflared`. Si lo
> cerrás, reiniciás la PC o se cae, la URL deja de existir y al relevantarlo te
> da **otra URL distinta** (hay que volver a actualizar `FRONTEND_URL`). Los
> quick tunnels sin cuenta no tienen garantía de uptime.
>
> Si no querés túnel, dejá `FRONTEND_URL=http://localhost:5173`: el flujo
> funciona igual, pero al terminar el pago se vuelve con el botón
> **"Volver al sitio"** del checkout en vez de redirigir solo.

### Probar el pago

- Iniciá sesión en el checkout con un **usuario de prueba comprador** (creado
  desde el panel de MP o vía MCP), **no** con tu cuenta real.
- Tarjetas de prueba (Argentina): p. ej. **Mastercard 5031 7557 3453 0604**,
  CVV `123`, vencimiento futuro. El nombre del titular define el resultado:
  `APRO` (aprobado), `OTHE` (rechazo general), `CONT` (pendiente).

## Ciclo TDD aplicado

Cada criterio de aceptación se construyó siguiendo Red → Green → Refactor:

| # | Criterio de aceptación | Test (Red) | Implementación (Green) | Refactor |
|---|------------------------|------------|------------------------|----------|
| 1 | Indicar fecha, cantidad, edades y tipo de pase | `compra válida con tarjeta…` | `comprar()` con validaciones de payload | Extracción de helpers `_validarCantidad`, `_validarEdades`, `_cargarTipos` |
| 2 | Fecha del día actual o futura | `falla si la fecha … anterior` + `permite … igual al día actual` | Inyección de `clock` y comparación a medianoche | Helper `parseFechaLocal` reutilizable |
| 3 | Confirmación por mail | Spy de mailer en tests | Llamada a `mailer.send(...)` post-persistencia | Mailer inyectable; `ConsoleMailer` por defecto |
| 4 | Redirigir a Mercado Pago si paga con tarjeta | `compra válida con tarjeta retorna init_point` | Llamada a `mp.createPreference` y persistencia de `mp_preferencia_id` | Cliente MP inyectable (`FakeMercadoPago` en dev) |
| 5 | Fecha dentro de días abiertos | `falla … parque cerrado (lunes)` | Consulta a `Horarios` por `dia_semana` | Tabla `DIAS_SEMANA` + `_validarFecha` |
| 6 | Selección de forma de pago obligatoria | `falla si no se selecciona forma de pago` + `método inválido` | Whitelist `METODOS_PAGO` | `_validarMetodoPago` |
| 7 | Máximo 10 entradas | `falla si la cantidad … mayor a 10` | Constante `MAX_ENTRADAS = 10` | `_validarCantidad` también cubre `tickets vacíos` |
| 8 | Informar cantidad y fecha al finalizar | `cantidad`, `fechaVisita` en `result` | Retorno enriquecido del service | DTO único usado por API y frontend |
| 9 | Solo usuarios registrados | `falla si el usuario no está registrado` + test API `requiere autenticación` | Middleware JWT + `SELECT` por `usuario_id` | Auth y service desacoplados |

### Decisiones de diseño guiadas por los tests

1. **Inyección de dependencias** (`db`, `mailer`, `mp`, `clock`) en `CompraService`.
   Los tests usan dobles en memoria y un reloj determinístico — sin ese diseño,
   testear "fecha del día actual" obligaría a manipular el reloj del sistema.
2. **Errores tipados (`CompraError`)** con `status` HTTP. El router los traduce
   sin sentencias `if` específicas por mensaje: las reglas de negocio viven en
   el service y se exponen uniformemente como respuestas 400/401.
3. **SQLite en memoria** para tests (`:memory:`) → cada test arranca limpio,
   schema real y consultas reales (no se mockea la DB).
4. **Transacción** sobre `Compras` + `Tickets`: si falla la inserción de un ticket
   no quedan compras huérfanas. Aparece naturalmente al escribir el test
   "persiste la compra y los tickets".
5. **Validación en orden**: forma de pago → cantidad → edades → fecha → usuario.
   El orden importa porque los mensajes de error son los esperados por los tests
   de usuario del enunciado.

## Pruebas

### Unit (`compraService.test.js`)

Cubren el núcleo de negocio sin Express:

- compra válida con tarjeta (mail + redirect MP + total correcto)
- compra válida con efectivo (sin redirect)
- falla sin método de pago / método inválido
- falla con día cerrado (lunes)
- falla con fecha pasada
- permite fecha igual al día actual
- falla con más de 10 entradas / sin entradas / sin edad
- falla con usuario no registrado
- persistencia correcta de compra y tickets con QR

### Integración (`api.test.js`)

Mediante supertest:

- GET `/api/tipos-ticket` lista los tipos sembrados
- POST `/api/compras` exige `Authorization`
- Compra completa con tarjeta devuelve `redirectUrl` + envía mail
- 400 con más de 10 entradas / día cerrado / sin forma de pago

### Resultado actual

```
Test Suites: 2 passed, 2 total
Tests:       18 passed, 18 total
```

## Mapeo Pruebas de usuario del enunciado

| Prueba de usuario | Cubierta por |
|-------------------|--------------|
| Comprar con fecha válida, tarjeta y mail | `compra válida con tarjeta…` + API equivalente |
| Comprar sin forma de pago (falla) | `falla si no se selecciona forma de pago` + API |
| Fecha con parque cerrado (falla) | `falla si la fecha … cerrado` + API |
| Más de 10 entradas (falla) | `falla si la cantidad … mayor a 10` + API |
