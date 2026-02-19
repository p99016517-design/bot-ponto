const { EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
  name: 'horas',
  description: 'Ver horas de um usuário',
  options: [
    {
      name: 'usuario',
      type: 6,
      description: 'Usuário',
      required: true
    }
  ],
  async execute(interaction) {
    const user = interaction.options.getUser('usuario');

    db.get("SELECT SUM(total) as total FROM registros WHERE userId = ?", [user.id], (err, row) => {
      const totalMs = row?.total || 0;
      const horas = Math.floor(totalMs / 3600000);
      const minutos = Math.floor((totalMs % 3600000) / 60000);

      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle(`📊 Horas de ${user.username}`)
        .setDescription(`⏱ ${horas}h ${minutos}m acumuladas esta semana.`)
        .setThumbnail(user.displayAvatarURL());

      interaction.reply({ embeds: [embed] });
    });
  }
};