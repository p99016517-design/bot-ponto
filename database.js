const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./pontos.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS registros (
      userId TEXT,
      inicio INTEGER,
      fim INTEGER,
      pausado INTEGER,
      tempoPausa INTEGER DEFAULT 0,
      total INTEGER,
      semana INTEGER
    )
  `);
});

module.exports = db;