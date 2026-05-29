# TP6 – TDD: Comprar entradas (EcoHarmony Park)

Implementación de la User Story **"Comprar entradas"** del bioparque EcoHarmony Park
aplicando el ciclo **Red → Green → Refactor**.

- **Backend:** Node.js + Express + SQLite (`better-sqlite3`) + Jest + Supertest
- **Frontend:** Vite + React + TypeScript + HeroUI + TailwindCSS + React Router
- **Pagos:** Mercado Pago Checkout Pro (entorno de PRUEBA)
- **Correo:** Nodemailer (Gmail / SMTP) con comprobante en PDF (`pdfkit` + `qrcode`)

> **Sesión:** para esta entrega la app trabaja con un **usuario hardcodeado**
> (id=1, `visitante@ecoharmony.com`), siempre "logueado". No hay login/registro
> ni JWT: el frontend lo obtiene con `GET /api/me` y el backend lo usa en cada compra.

## Paleta de colores

La identidad visual usa una paleta natural verde con un cálido cremoso y un rojo
ladrillo para alertas. Vive en `frontend/src/styles/globals.css` como variables
CSS (`--p4..--p6`, `--a5/--a6`, `--champagne`, `--brick`) y, además, sobrescribe
la escala `emerald-*` de Tailwind para que las utilidades existentes adopten la
paleta automáticamente.

| Color           | Hex       | Variable           | Uso                                                        |
|-----------------|-----------|--------------------|------------------------------------------------------------|
| Hunter Green    | `#386641` | `--p6`             | Verde más oscuro: extremo de gradientes, bordes, sombras   |
| Sage Green      | `#6a994e` | `--p5` / `--accent`| Acento principal (botones, foco, indicadores)              |
| Yellow Green    | `#a7c957` | `--a5`             | Acento vivo: brillo de gradientes de marca                 |
| Champagne Mist  | `#f2e8cf` | `--champagne`      | Fondo cálido de la página / escenario                      |
| Blushed Brick   | `#bc4749` | `--brick`          | Alertas y pagos rechazados                                 |

> Verdes auxiliares derivados: `--p4 #8cb85f` (verde claro) y `--a6 #7a9e3f`
> (oliva) completan la rampa de los gradientes verde → amarillo-verde.

## Estructura

```
TP6/
├── backend/
│   ├── src/
│   │   ├── app.js                      # Composición Express (DI: db, mailer, mp)
│   │   ├── server.js                   # Bootstrap del proceso + seed
│   │   ├── db/
│   │   │   ├── index.js                # createDb / seedReferenceData / usuario hardcodeado
│   │   │   └── schema.sql              # DDL (Usuarios, Horarios, TiposTicket, Compras, Tickets)
│   │   ├── routes/
│   │   │   ├── catalogo.js             # GET /tipos-ticket  /horarios
│   │   │   └── compras.js              # POST /compras · GET /compras/:id/estado · POST /compras/webhook
│   │   └── services/
│   │       ├── compraService.js        # ← núcleo dirigido por tests (reglas de negocio)
│   │       ├── mercadoPago.js          # Cliente MP real (TEST) + FakeMercadoPago
│   │       ├── mailer.js               # SmtpMailer (Nodemailer) + ConsoleMailer (fallback)
│   │       └── comprobante.js          # Genera el comprobante de compra en PDF (con QR)
│   ├── tests/
│   │   ├── compraService.test.js       # Tests unitarios (TDD)
│   │   └── api.test.js                 # Tests de API (supertest)
│   ├── .env.example                    # Variables de entorno de referencia
│   └── data.sqlite                     # Base SQLite persistente (dev)
└── frontend/
    └── src/
        ├── App.tsx                     # Router + layout (vista móvil / escritorio)
        ├── main.tsx, provider.tsx
        ├── lib/{api.ts, auth.tsx, format.ts, vista.ts}
        ├── components/ui.tsx           # Navbar, AppBar, Calendar, etc.
        └── pages/
            ├── comprar-entradas.tsx    # Formulario principal de compra
            ├── confirmacion.tsx        # Pantalla final (efectivo)
            └── pago-resultado.tsx      # Vuelta de Mercado Pago (tarjeta)
```

## Cómo levantar todo

> Necesitás **dos terminales** (backend y frontend) y, para que la redirección
> automática de Mercado Pago funcione, una **tercera** con el túnel de Cloudflare
> (ver más abajo).

### 1) Backend

```bash
cd backend
npm install
cp .env.example .env     # y completá las variables (ver abajo)
npm test                 # corre la batería de pruebas (no necesita red)
npm run dev              # API en http://localhost:3001 (--watch)
```

> El seed de datos de referencia (horarios, tipos de ticket y usuario id=1) se
> ejecuta **automáticamente** al arrancar el server; no hace falta un paso aparte.
> La base persiste en `backend/data.sqlite`.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173 (Vite proxea /api a :3001)
```

### Variables de entorno (`backend/.env`)

```bash
PORT=3001
DB_PATH=./data.sqlite

# --- Mercado Pago (entorno de PRUEBA) ---
MP_ACCESS_TOKEN=TEST-...                 # Access Token de PRUEBA de tu app
FRONTEND_URL=http://localhost:5173       # o la URL del túnel (ver más abajo)
# MP_NOTIFICATION_URL=                   # (opcional) webhook público

# --- Correo de confirmación (con comprobante PDF) ---
MAIL_SERVICE=gmail
MAIL_USER=tu-cuenta@gmail.com            # cuenta que ENVÍA
MAIL_PASS=xxxx xxxx xxxx xxxx            # contraseña de APLICACIÓN (no la normal)
MAIL_FROM=EcoHarmony Park <tu-cuenta@gmail.com>
MAIL_TO=destino@gmail.com                # casilla que RECIBE las confirmaciones
```

## Correo de confirmación + comprobante PDF

Al **confirmarse** una compra se envía un correo con el detalle y un **comprobante
en PDF adjunto** (incluye un código QR por entrada). El disparo depende del medio:

| Medio de pago | Momento del envío |
|---------------|-------------------|
| **Efectivo**  | Al registrarse la compra (se abona en boletería). |
| **Tarjeta**   | Recién cuando **Mercado Pago aprueba** el pago (al sincronizar `GET /api/compras/:id/estado`). Es idempotente: no reenvía si se reconsulta. |

### Configurar el envío (Gmail con contraseña de aplicación)

1. Activá la **verificación en 2 pasos** en la cuenta de Gmail que enviará.
2. Generá una **contraseña de aplicación** en
   [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   (es un código de 16 caracteres; **no** es tu contraseña habitual).
3. Cargá en `backend/.env`:
   - `MAIL_USER` = la cuenta de Gmail remitente.
   - `MAIL_PASS` = la contraseña de aplicación generada.
   - `MAIL_TO` = la casilla que recibe las confirmaciones. Si se define, **todas**
     las confirmaciones se envían ahí (útil porque el usuario de la app es de prueba
     y su email `visitante@ecoharmony.com` no es real).
   - `MAIL_FROM` (opcional) = nombre/dirección del remitente.
4. Reiniciá el backend.

> **Sin credenciales:** si `MAIL_USER` o `MAIL_PASS` quedan vacíos, la app usa un
> `ConsoleMailer` que **solo loguea** el correo por consola (no envía nada real).
> Útil para tests y para correr sin configurar Gmail.
>
> **SMTP propio:** en vez de Gmail podés definir `MAIL_HOST`, `MAIL_PORT` y
> `MAIL_SECURE`; si `MAIL_HOST` está presente, se ignora `MAIL_SERVICE`.

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
   (`pendiente → confirmado/cancelado`). **Al confirmarse, dispara el correo** con
   el comprobante PDF.

> El Access Token de prueba se obtiene en
> [panel de desarrolladores → tu app → Credenciales de prueba](https://www.mercadopago.com.ar/developers/panel/app).
> Si `MP_ACCESS_TOKEN` está vacío, la app usa un cliente **FAKE** (útil para
> tests y dev sin credenciales). Por eso la batería de tests TDD no necesita red.

### URL pública del frontend con Cloudflare (para que MP redirija solo)

Mercado Pago **no permite redirigir (`auto_return`) a `localhost`**: exige una
URL pública **https**. En desarrollo se resuelve con un túnel de Cloudflare que
publica el frontend local. El código activa `auto_return` automáticamente cuando
`FRONTEND_URL` es https público.

```bash
# Terminal 3 — túnel al frontend (puerto 5173)
npx cloudflared tunnel --url http://localhost:5173
#   -> imprime una URL tipo https://<random>.trycloudflare.com
```

```bash
# En backend/.env: apuntar FRONTEND_URL a esa URL y reiniciar el backend
FRONTEND_URL=https://<random>.trycloudflare.com
```

- El `vite.config.ts` ya permite estos hosts (`allowedHosts`).
- **Abrí la app desde la URL del túnel** (no desde `localhost`), porque MP
  redirige a ese dominio. El túnel solo reenvía a tu `localhost:5173`.

> **Duración del túnel:** vive mientras corra el proceso `cloudflared`. Si lo
> cerrás, reiniciás la PC o se cae, la URL deja de existir y al relevantarlo te
> da **otra URL distinta** (hay que volver a actualizar `FRONTEND_URL` y reiniciar
> el backend). Los quick tunnels sin cuenta no garantizan uptime.
>
> Si no querés túnel, dejá `FRONTEND_URL=http://localhost:5173`: el flujo
> funciona igual, pero al terminar el pago se vuelve con el botón
> **"Volver al sitio"** del checkout en vez de redirigir solo.

### Probar el pago

- Iniciá sesión en el checkout con un **usuario de prueba comprador** (creado
  desde el panel de MP), **no** con tu cuenta real.
- Tarjetas de prueba (Argentina): p. ej. **Mastercard 5031 7557 3453 0604**,
  CVV `123`, vencimiento futuro. El nombre del titular define el resultado:
  `APRO` (aprobado), `OTHE` (rechazo general), `CONT` (pendiente).

## Endpoints

| Método | Ruta                          | Descripción                                            |
|--------|-------------------------------|--------------------------------------------------------|
| GET    | `/api/health`                 | Healthcheck.                                           |
| GET    | `/api/me`                     | Usuario hardcodeado de la sesión.                      |
| GET    | `/api/tipos-ticket`           | Tipos de pase disponibles (VIP / Regular).             |
| GET    | `/api/horarios`               | Días y horarios en que el parque está abierto.         |
| POST   | `/api/compras`                | Registra la compra (efectivo → confirma; tarjeta → `redirectUrl` a MP). |
| GET    | `/api/compras/:id/estado`     | Estado de la compra; sincroniza con MP y dispara el correo al confirmar. |
| POST   | `/api/compras/webhook`        | Webhook de notificaciones de MP (opcional).            |

## Ciclo TDD aplicado

Cada criterio de aceptación se construyó siguiendo Red → Green → Refactor:

| # | Criterio de aceptación | Test (Red) | Implementación (Green) | Refactor |
|---|------------------------|------------|------------------------|----------|
| 1 | Indicar fecha, cantidad, edades y tipo de pase | `compra válida con tarjeta…` | `comprar()` con validaciones de payload | Extracción de helpers `_validarCantidad`, `_validarEdades`, `_cargarTipos` |
| 2 | Fecha del día actual o futura | `falla si la fecha … anterior` + `permite … igual al día actual` | Inyección de `clock` y comparación a medianoche | Helper `parseFechaLocal` reutilizable |
| 3 | Confirmación por mail con comprobante | Spy de mailer + verificación de adjunto PDF | `_enviarConfirmacion()` (efectivo al comprar, tarjeta al aprobar) genera PDF y envía | Mailer y comprobante inyectables; `ConsoleMailer` por defecto |
| 4 | Redirigir a Mercado Pago si paga con tarjeta | `compra válida con tarjeta retorna init_point` | Llamada a `mp.createPreference` y persistencia de `mp_preferencia_id` | Cliente MP inyectable (`FakeMercadoPago` en dev) |
| 5 | Fecha dentro de días abiertos | `falla … parque cerrado (lunes)` | Consulta a `Horarios` por `dia_semana` | Tabla `DIAS_SEMANA` + `_validarFecha` (incluye feriados) |
| 6 | Selección de forma de pago obligatoria | `falla si no se selecciona forma de pago` + `método inválido` | Whitelist `METODOS_PAGO` | `_validarMetodoPago` |
| 7 | Máximo 10 entradas | `falla si la cantidad … mayor a 10` | Constante `MAX_ENTRADAS = 10` | `_validarCantidad` también cubre `tickets vacíos` |
| 8 | Informar cantidad y fecha al finalizar | `cantidad`, `fechaVisita` en `result` | Retorno enriquecido del service | DTO único usado por API y frontend |
| 9 | Solo usuarios registrados | `falla si el usuario no está registrado` | `SELECT … FROM Usuarios WHERE id = ?` → 401 si no existe | Usuario hardcodeado (id=1) resuelto en la capa de ruta |

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
6. **Correo desacoplado de la compra**: `_enviarConfirmacion()` no relanza errores;
   si el envío o la generación del PDF fallan, se loguea pero **la compra ya
   persistida no se rompe**.

## Pruebas

### Cómo ejecutar los tests

Los tests son del **backend** (Jest + Supertest). No necesitan red ni credenciales:
usan SQLite en memoria, un cliente de Mercado Pago fake y un mailer espía.

```bash
cd backend
npm install        # solo la primera vez
npm test           # corre toda la batería una vez (jest --runInBand)
npm run test:watch # modo watch: re-ejecuta al guardar cambios
```

Para correr un solo archivo o filtrar por nombre de test:

```bash
npx jest tests/compraService.test.js      # un archivo
npx jest -t "efectivo"                     # solo los tests cuyo nombre matchea
```

### Unit (`compraService.test.js`)

Cubren el núcleo de negocio sin Express:

- compra válida con tarjeta (init_point MP + total correcto, **sin** mail hasta aprobar)
- al aprobar el pago con tarjeta se envía la confirmación con **PDF adjunto** (una sola vez)
- compra con efectivo (sin redirect) envía confirmación con **PDF adjunto**
- falla sin método de pago / método inválido
- falla con día cerrado (lunes) / feriado (25 dic, 1 ene)
- falla con fecha pasada / permite fecha igual al día actual
- falla con más de 10 entradas / sin entradas / sin edad
- falla con usuario no registrado
- persistencia correcta de compra y tickets con QR

### Integración (`api.test.js`)

Mediante supertest:

- GET `/api/me` devuelve el usuario hardcodeado
- GET `/api/tipos-ticket` lista los tipos sembrados
- POST `/api/compras` con tarjeta devuelve `redirectUrl` (mail recién al confirmar)
- 400 con más de 10 entradas / día cerrado / sin forma de pago

### Resultado actual

```
Test Suites: 2 passed, 2 total
Tests:       21 passed, 21 total
```

## Mapeo Pruebas de usuario del enunciado

| Prueba de usuario | Cubierta por |
|-------------------|--------------|
| Comprar con fecha válida y tarjeta (mail al aprobar el pago) | `compra válida con tarjeta…` + `al aprobarse el pago…` + API |
| Comprar con efectivo (mail + comprobante al registrar) | `compra con efectivo … envía confirmación con comprobante PDF` |

## Mapeo Pruebas de usuario del enunciado

| Prueba de usuario | Cubierta por |
|-------------------|--------------|
| Comprar con fecha válida, tarjeta y mail | `compra válida con tarjeta…` + API equivalente |
| Comprar sin forma de pago (falla) | `falla si no se selecciona forma de pago` + API |
| Fecha con parque cerrado (falla) | `falla si la fecha … cerrado` + API |
| Más de 10 entradas (falla) | `falla si la cantidad … mayor a 10` + API |
