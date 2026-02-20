const { EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
  name: 'relatorio',
  description: 'Mostra relatório semanal',
  async execute(interaction) {

    await interaction.deferReply(); // 👈 ESSENCIAL

    db.all(
      "SELECT userId, SUM(total) as total FROM pontos GROUP BY userId",
      [],
      async (err, rows) => {

        if (err) {
          return interaction.editReply({ content: "Erro ao gerar relatório." });
        }

        if (!rows || rows.length === 0) {
          return interaction.editReply({ content: "Nenhum registro encontrado." });
        }

        rows.sort((a, b) => (b.total || 0) - (a.total || 0));

        const meta = 25;
        const minimo = 20;

        let top3 = "";
        let aprovados = "";
        let atencao = "";
        let reprovados = "";

        function barraProgresso(horas) {
          const totalBlocos = 10;
          const progresso = Math.min(horas / meta, 1);
          const blocosPreenchidos = Math.round(progresso * totalBlocos);
          const blocosVazios = totalBlocos - blocosPreenchidos;

          return "▰".repeat(blocosPreenchidos) + "▱".repeat(blocosVazios);
        }

        rows.forEach((r, index) => {

          const totalMs = r.total || 0;
          const horas = Math.floor(totalMs / 3600000);
          const minutos = Math.floor((totalMs % 3600000) / 60000);

          const linha = `<@${r.userId}>
⏱ ${horas}h ${minutos}m
📈 ${barraProgresso(horas)}
`;

          if (index === 0) top3 += `🥇 ${linha}\n`;
          else if (index === 1) top3 += `🥈 ${linha}\n`;
          else if (index === 2) top3 += `🥉 ${linha}\n`;

          if (horas >= meta) {
            aprovados += `✅ ${linha}\n`;
          } else if (horas >= minimo) {
            atencao += `⚠️ ${linha}\n`;
          } else {
            reprovados += `❌ ${linha}\n`;
          }
        });

        const embed = new EmbedBuilder()
          .setColor("#5865F2")
          .setTitle("📊 Relatório Semanal de Ponto")
          .setThumbnail(interaction.guild.iconURL({ size: 512 }))
          .addFields(
            { name: "🏆 Top 3 da Semana", value: top3 || "Ninguém ainda.", inline: false },
            { name: "✅ Aprovados (25h+)", value: aprovados || "Nenhum.", inline: false },
            { name: "⚠️ Atenção (20h–24h)", value: atencao || "Nenhum.", inline: false },
            { name: "❌ Abaixo do Mínimo (<20h)", value: reprovados || "Nenhum.", inline: false }
          )
          .setFooter({
            text: "Meta: 25h • Mínimo: 20h • Semana: Domingo → Sábado"
          })
          .setTimestamp();

        interaction.editReply({ embeds: [embed] }); // 👈 editReply porque usamos defer
      }
    );
  }
};