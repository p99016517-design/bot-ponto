const db = require('./database');

function iniciarScheduler() {
  setInterval(() => {
    const agora = new Date();
    if (agora.getDay() === 0 && agora.getHours() === 0 && agora.getMinutes() === 0) {
      db.run("DELETE FROM registros");
      console.log("🔄 Reset semanal realizado.");
    }
  }, 60000);
}

module.exports = iniciarScheduler;