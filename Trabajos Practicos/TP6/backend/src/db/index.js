const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

function createDb(filename = ':memory:') {
  const db = new Database(filename);
  db.pragma('foreign_keys = ON');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  return db;
}

function seedReferenceData(db) {
  const horarios = db.prepare('SELECT COUNT(*) AS c FROM Horarios').get().c;
  if (horarios === 0) {
    const insertHorario = db.prepare(
      'INSERT INTO Horarios (dia_semana, hora_apertura, hora_cierre) VALUES (?, ?, ?)'
    );
    [
      ['martes', '09:00', '18:00'],
      ['miercoles', '09:00', '18:00'],
      ['jueves', '09:00', '18:00'],
      ['viernes', '09:00', '18:00'],
      ['sabado', '09:00', '20:00'],
      ['domingo', '09:00', '20:00'],
    ].forEach((h) => insertHorario.run(...h));
  }

  const tipos = db.prepare('SELECT COUNT(*) AS c FROM TiposTicket').get().c;
  if (tipos === 0) {
    const insertTipo = db.prepare(
      'INSERT INTO TiposTicket (nombre, pase, precio, descripcion) VALUES (?, ?, ?, ?)'
    );
    insertTipo.run('VIP', 'VIP', 3200, 'Acceso prioritario');
    insertTipo.run('Regular', 'regular', 1800, 'Entrada estándar');
  }
}

module.exports = { createDb, seedReferenceData };
