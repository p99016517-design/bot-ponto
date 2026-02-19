const { EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
  name: 'reprovados',
  description: 'Lista quem está abaixo de 20h',
  async execute(interaction) {

    db.all("SELECT userId, SUM(total) as total FROM registros GROUP BY userId", [], (err, rows) => {

      let lista = "";

      rows.forEach(r => {
        const horas = Math.floor((r.total || 0) / 3600000);
        if (horas < 20) {
          lista += `<@${r.userId}> - ${horas}h\n`;
        }
      });

      const embed = new EmbedBuilder()
        .setColor("#ED4245")
        .setTitle("❌ Abaixo de 20h")
        .setDescription(lista || "Ninguém abaixo do mínimo.");

      interaction.reply({ embeds: [embed] });
    });
  }
};