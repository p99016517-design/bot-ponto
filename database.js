const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco:", err);
  } else {
    console.log("✅ Banco de dados conectado.");

    db.run(`
      CREATE TABLE IF NOT EXISTS pontos (
        userId TEXT,
        inicio INTEGER,
        total INTEGER
      )
    `);
  }
});

module.exports = db;