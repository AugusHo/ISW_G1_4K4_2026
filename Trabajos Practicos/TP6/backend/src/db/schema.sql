CREATE TABLE IF NOT EXISTS Usuarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  contrasena    TEXT    NOT NULL,
  nombre        TEXT    NOT NULL,
  creado_en     TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Horarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  dia_semana    TEXT    NOT NULL CHECK(dia_semana IN ('lunes','martes','miercoles','jueves','viernes','sabado','domingo')),
  hora_apertura TEXT    NOT NULL,
  hora_cierre   TEXT    NOT NULL,
  activo        INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS TiposTicket (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre      TEXT    NOT NULL,
  pase        TEXT    NOT NULL CHECK(pase IN ('VIP', 'regular')),
  precio      REAL    NOT NULL,
  descripcion TEXT
);

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

CREATE TABLE IF NOT EXISTS Tickets (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  compra_id        INTEGER NOT NULL REFERENCES Compras(id),
  tipo_ticket_id   INTEGER NOT NULL REFERENCES TiposTicket(id),
  edad_visitante   INTEGER NOT NULL,
  codigo_qr        TEXT    UNIQUE
);
