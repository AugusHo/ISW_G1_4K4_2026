const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Usuario hardcodeado que estará "siempre logueado" en la app.
const HARDCODED_USER = {
  id: 1,
  email: 'visitante@ecoharmony.com',
  nombre: 'Visitante EcoHarmony',
  contrasena: 'hardcoded',
};

function createDb(filename = ':memory:') {
  const db = new Database(filename);
  db.pragma('foreign_keys = ON');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  return db;
}

function seedHardcodedUser(db) {
  const existing = db.prepare('SELECT id FROM Usuarios WHERE id = ?').get(HARDCODED_USER.id);
  if (!existing) {
    db.prepare(
      'INSERT INTO Usuarios (id, email, contrasena, nombre) VALUES (?, ?, ?, ?)'
    ).run(HARDCODED_USER.id, HARDCODED_USER.email, HARDCODED_USER.contrasena, HARDCODED_USER.nombre);
  }
}

function seedReferenceData(db) {
  const horarios = db.prepare('SELECT COUNT(*) AS c FROM Horarios').get().c;
  if (horarios === 0) {
    const insertHorario = db.prepare(
      'INSERT INTO Horarios (dia_semana, hora_apertura, hora_cierre) VALUES (?, ?, ?)'
    );
    // El parque abre de martes a domingo de 08:30 a 19:00.
    // Los lunes permanece cerrado (no se siembra ninguna fila para 'lunes').
    [
      ['martes', '08:30', '19:00'],
      ['miercoles', '08:30', '19:00'],
      ['jueves', '08:30', '19:00'],
      ['viernes', '08:30', '19:00'],
      ['sabado', '08:30', '19:00'],
      ['domingo', '08:30', '19:00'],
    ].forEach((h) => insertHorario.run(...h));
  }

  const tipos = db.prepare('SELECT COUNT(*) AS c FROM TiposTicket').get().c;
  if (tipos === 0) {
    const insertTipo = db.prepare(
      'INSERT INTO TiposTicket (nombre, pase, precio, descripcion) VALUES (?, ?, ?, ?)'
    );
    insertTipo.run('VIP', 'VIP', 20000, 'Acceso prioritario');
    insertTipo.run('Regular', 'regular', 10000, 'Entrada estándar');
  }

  seedHardcodedUser(db);
}

module.exports = { createDb, seedReferenceData, seedHardcodedUser, HARDCODED_USER };
