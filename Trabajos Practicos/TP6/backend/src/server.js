require('dotenv').config();
const path = require('path');
const { createDb, seedReferenceData } = require('./db');
const { createApp } = require('./app');

const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '..', 'data.sqlite');
const db = createDb(dbPath);
seedReferenceData(db);

const app = createApp({ db, secret: process.env.JWT_SECRET || 'dev-secret' });
const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`EcoHarmony backend escuchando en http://localhost:${port}`));
