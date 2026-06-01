# 🎟️ TP6 – TDD: Comprar entradas (EcoHarmony Park)

Implementación de la User Story **"Comprar entradas"** del bioparque EcoHarmony Park
aplicando el ciclo **Red → Green → Refactor**.

- 🟢 **Backend:** Node.js + Express + SQLite (`better-sqlite3`) + Jest
- 🔵 **Frontend:** Vite + React + TypeScript + HeroUI + TailwindCSS + React Router
- 💳 **Pagos:** Mercado Pago Checkout Pro (entorno de PRUEBA)
- 📧 **Correo:** Nodemailer (Gmail / SMTP) con comprobante en PDF (`pdfkit` + `qrcode`)

> **Sesión:** para esta entrega la app trabaja con un **usuario hardcodeado**
> (id=1, `visitante@ecoharmony.com`), siempre "logueado". No hay login/registro
> ni JWT: el frontend lo obtiene con `GET /api/me` y el backend lo usa en cada compra.

## 📑 Índice

1. [🎨 Paleta de colores](#-paleta-de-colores)
2. [📁 Estructura](#-estructura)
3. [🚀 Cómo levantar todo](#-cómo-levantar-todo)
4. [📧 Correo de confirmación + comprobante PDF](#-correo-de-confirmación--comprobante-pdf)
5. [💳 Integración con Mercado Pago](#-integración-con-mercado-pago-entorno-de-prueba)
6. [🔌 Endpoints](#-endpoints)
7. [💾 Esquema de Base de Datos](#-esquema-de-base-de-datos)
8. [🔁 Ciclo TDD aplicado](#-ciclo-tdd-aplicado)
9. [🧪 Pruebas](#-pruebas)
10. [📝 Estilo de Código](#-estilo-de-código)

## 🎨 Paleta de colores

La identidad visual usa una paleta natural verde con un cálido cremoso y un rojo
ladrillo para alertas. Vive en `frontend/src/styles/globals.css` como variables
CSS y, además, sobrescribe
la escala `emerald-*` de Tailwind para que las utilidades existentes adopten la
paleta automáticamente.

| Color           | Hex         | Uso                                                        |
|-----------------|-----------|------------------------------------------------------------|
| Hunter Green    | `#386641`     | Verde más oscuro: extremo de gradientes, bordes, sombras   |
| Sage Green      | `#6a994e` | Acento principal (botones, foco, indicadores)              |
| Yellow Green    | `#a7c957` | Acento vivo: brillo de gradientes de marca                 |
| Champagne Mist  | `#f2e8cf`  | Fondo cálido de la página / escenario                      |
| Blushed Brick   | `#bc4749`  | Alertas y pagos rechazados                                 |

> Verdes auxiliares derivados: `--p4 #8cb85f` (verde claro) y `--a6 #7a9e3f`
> (oliva) completan la rampa de los gradientes verde → amarillo-verde.

## 📁 Estructura

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
│   │   └── compraService.test.js       # Tests unitarios de dominio (TDD)
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

## 🚀 Cómo levantar todo

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

## 📧 Correo de confirmación + comprobante PDF

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

## 💳 Integración con Mercado Pago (entorno de PRUEBA)

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

## 🔌 Endpoints

| Método | Ruta                          | Descripción                                            |
|--------|-------------------------------|--------------------------------------------------------|
| GET    | `/api/health`                 | Healthcheck.                                           |
| GET    | `/api/me`                     | Usuario hardcodeado de la sesión.                      |
| GET    | `/api/tipos-ticket`           | Tipos de pase disponibles (VIP / Regular).             |
| GET    | `/api/horarios`               | Días y horarios en que el parque está abierto.         |
| POST   | `/api/compras`                | Registra la compra (efectivo → confirma; tarjeta → `redirectUrl` a MP). |
| GET    | `/api/compras/:id/estado`     | Estado de la compra; sincroniza con MP y dispara el correo al confirmar. |
| POST   | `/api/compras/webhook`        | Webhook de notificaciones de MP (opcional).            |

## 💾 Esquema de Base de Datos

El backend usa **SQLite** a través de `better-sqlite3` (síncrono). El DDL vive en
`backend/src/db/schema.sql` y se aplica automáticamente al crear la base
(`createDb()` en `backend/src/db/index.js`). En **tests** la base es en memoria
(`:memory:`); en **desarrollo** persiste en `backend/data.sqlite`. Las claves
foráneas se activan explícitamente con `PRAGMA foreign_keys = ON`.

### Tabla: Usuarios

Para esta entrega hay un único **usuario hardcodeado** (`id = 1`,
`visitante@ecoharmony.com`) sembrado al arrancar; no hay registro ni login real.

```sql
CREATE TABLE IF NOT EXISTS Usuarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  contrasena    TEXT    NOT NULL,
  nombre        TEXT    NOT NULL,
  creado_en     TEXT    DEFAULT (datetime('now'))
);
```

### Tabla: Horarios

Catálogo de días/horas en que el parque está abierto. El seed carga **martes a
domingo de 08:30 a 19:00**; el **lunes** no se siembra (parque cerrado).

```sql
CREATE TABLE IF NOT EXISTS Horarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  dia_semana    TEXT    NOT NULL CHECK(dia_semana IN ('lunes','martes','miercoles','jueves','viernes','sabado','domingo')),
  hora_apertura TEXT    NOT NULL,
  hora_cierre   TEXT    NOT NULL,
  activo        INTEGER NOT NULL DEFAULT 1
);
```

### Tabla: TiposTicket

Tipos de pase disponibles. El seed carga dos: **VIP** ($20.000, acceso
prioritario) y **Regular** ($10.000, entrada estándar).

```sql
CREATE TABLE IF NOT EXISTS TiposTicket (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre      TEXT    NOT NULL,
  pase        TEXT    NOT NULL CHECK(pase IN ('VIP', 'regular')),
  precio      REAL    NOT NULL,
  descripcion TEXT
);
```

### Tabla: Compras

Cabecera de cada compra. `estado` arranca en `pendiente` y pasa a
`confirmado`/`cancelado` (efectivo confirma al registrar; tarjeta al aprobar MP).
`mp_preferencia_id` guarda la preferencia de Mercado Pago cuando el pago es con
tarjeta.

```sql
CREATE TABLE IF NOT EXISTS Compras (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id        INTEGER NOT NULL REFERENCES Usuarios(id),
  fecha_visita      TEXT    NOT NULL,
  estado            TEXT    NOT NULL DEFAULT 'pendiente'
                    CHECK(estado IN ('pendiente','confirmado','cancelado')),
  metodo_pago       TEXT    NOT NULL CHECK(metodo_pago IN ('efectivo','tarjeta')),
  monto_total       REAL    NOT NULL,
  mp_preferencia_id TEXT,
  creado_en         TEXT    DEFAULT (datetime('now'))
);
```

### Tabla: Tickets

Una fila por entrada/visitante dentro de una compra. `codigo_qr` es un UUID único
que luego se embebe como QR en el comprobante PDF. La inserción de `Compras` y sus
`Tickets` ocurre dentro de una **transacción** (no quedan compras huérfanas).

```sql
CREATE TABLE IF NOT EXISTS Tickets (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  compra_id        INTEGER NOT NULL REFERENCES Compras(id),
  tipo_ticket_id   INTEGER NOT NULL REFERENCES TiposTicket(id),
  edad_visitante   INTEGER NOT NULL,
  codigo_qr        TEXT    UNIQUE
);
```

## 🔁 Ciclo TDD aplicado

Cada criterio de aceptación se construyó siguiendo Red → Green → Refactor:

| # | Criterio de aceptación | Test (Red) | Implementación (Green) | Refactor |
|---|------------------------|------------|------------------------|----------|
| 1 | Indicar fecha, cantidad, edades y tipo de pase | Caso 1 (compra válida con tarjeta) | `comprar()` con validaciones de payload | Extracción de helpers `_validarCantidad`, `_validarEdades`, `_cargarTipos` |
| 2 | Fecha del día actual o futura | *Sin caso dedicado en la suite actual* (validación en el service) | Inyección de `clock` y comparación a medianoche | Helper `parseFechaLocal` reutilizable |
| 3 | Confirmación por mail con comprobante | Casos 1 y 5 (spy de mailer + adjunto PDF) | `_enviarConfirmacion()` (efectivo al comprar, tarjeta al aprobar) genera PDF y envía | Mailer y comprobante inyectables; `ConsoleMailer` por defecto |
| 4 | Redirigir a Mercado Pago si paga con tarjeta | Caso 1 (`redirectUrl` a MP) | Llamada a `mp.createPreference` y persistencia de `mp_preferencia_id` | Cliente MP inyectable (`FakeMercadoPago` en dev) |
| 5 | Fecha dentro de días abiertos | Caso 3 (parque cerrado, lunes) | Consulta a `Horarios` por `dia_semana` | Tabla `DIAS_SEMANA` + `_validarFecha` (incluye feriados) |
| 6 | Selección de forma de pago obligatoria | Caso 2 (sin forma de pago) | Whitelist `METODOS_PAGO` | `_validarMetodoPago` |
| 7 | Máximo 10 entradas | Caso 4 (cantidad mayor a 10) | Constante `MAX_ENTRADAS = 10` | `_validarCantidad` |
| 8 | Informar cantidad y fecha al finalizar | Casos 1 y 5 (`cantidad`, `fechaVisita` en `result`) | Retorno enriquecido del service | DTO único usado por API y frontend |
| 9 | Solo usuarios registrados | *Sin caso dedicado en la suite actual* (validación en el service) | `SELECT … FROM Usuarios WHERE id = ?` → 401 si no existe | Usuario hardcodeado (id=1) resuelto en la capa de ruta |

### Decisiones de diseño guiadas por los tests

1. **Inyección de dependencias** (`db`, `mailer`, `mp`, `clock`) en `CompraService`.
   Los tests usan dobles en memoria y un reloj determinístico — sin ese diseño,
   testear "fecha del día actual" obligaría a manipular el reloj del sistema.
2. **Errores tipados (`CompraError`)** con `status` HTTP. El router los traduce
   sin sentencias `if` específicas por mensaje: las reglas de negocio viven en
   el service y se exponen uniformemente como respuestas 400/401.
3. **SQLite en memoria** para tests (`:memory:`) → cada test arranca limpio,
   schema real y consultas reales (no se mockea la DB).
4. **Transacción** sobre `Compras` + `Tickets`: la compra y sus tickets se
   insertan en una sola transacción, así si falla la inserción de un ticket no
   quedan compras huérfanas.
5. **Validación en orden**: forma de pago → cantidad → edades → fecha → usuario.
   El orden importa porque los mensajes de error son los esperados por los tests
   de usuario del enunciado.
6. **Correo desacoplado de la compra**: `_enviarConfirmacion()` no relanza errores;
   si el envío o la generación del PDF fallan, se loguea pero **la compra ya
   persistida no se rompe**.

## 🧪 Pruebas

### Cómo ejecutar los tests

Los tests son del **backend** (Jest). No necesitan red ni credenciales:
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

### Casos de prueba (`compraService.test.js`)

Cubren el núcleo de negocio (`CompraService`) sin Express, con dobles en memoria:

- **Caso 1 — compra válida con tarjeta:** informa cantidad, fecha y monto total,
  devuelve `redirectUrl` a Mercado Pago y **no** envía mail; al aprobar Mercado
  Pago (`consultarEstado`) la compra queda `confirmado` y recién ahí envía la
  confirmación con **PDF adjunto** (una sola vez). *(PASA)*
- **Caso 2 — sin forma de pago:** falla si `metodoPago` está vacío. *(FALLA)*
- **Caso 3 — parque cerrado:** falla si la fecha cae en un día cerrado (lunes). *(FALLA)*
- **Caso 4 — más de 10 entradas:** falla si la cantidad supera `MAX_ENTRADAS`. *(FALLA)*
- **Caso 5 — compra válida con efectivo:** no redirige a Mercado Pago (no crea
  preferencia), informa cantidad y fecha, y envía la confirmación con **PDF
  adjunto** al instante. *(PASA)*

> La verificación funcional de los **endpoints HTTP** se hace de forma manual con
> la colección de **Bruno** (ver _Probar la API con Bruno_ más abajo), no con tests
> automatizados de API.

### Probar la API con Bruno

En `backend/bruno-collection/` hay una colección de [Bruno](https://www.usebruno.com/)
para ejercitar los endpoints a mano contra el backend levantado (`npm run dev`).
Está organizada en carpetas:

- **servidor** — `Health`, `Me`
- **catalogo** — `Get Tipos Ticket`, `Get Horarios`
- **compras** — `Crear compra`, `Get estado compra by ID`, `Webhook MercadoPago`

Incluye el environment `test` (`environments/test.yml`) con la `baseUrl` apuntando
al backend local. Abrí la carpeta `bruno-collection` desde la app de Bruno,
seleccioná el environment `test` y ejecutá los requests.

## 📝 Estilo de Código

Convenciones que sigue el proyecto, separadas por capa:

### General (back y front)

- **`camelCase`** para variables y funciones; **`PascalCase`** para clases
  (`CompraService`, `CompraError`) y componentes React.
- **`UPPER_SNAKE_CASE`** para constantes de módulo (`MAX_ENTRADAS`,
  `METODOS_PAGO`, `DIAS_SEMANA`, `FERIADOS`).
- Preferir **`const`** sobre `let`; evitar `var`.
- **Arrow functions** para callbacks/handlers; funciones declaradas para utilidades
  reutilizables.
- Tablas de la base en **`PascalCase`** (`Usuarios`, `Compras`, `Tickets`) y
  columnas en **`snake_case`** (`fecha_visita`, `mp_preferencia_id`).
- Comentarios breves en español que explican el *porqué* de una regla de negocio
  (días cerrados, feriados, idempotencia del mail), no el *qué*.