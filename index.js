require('dotenv').config();
const { 
  Client, 
  GatewayIntentBits, 
  Events,
  EmbedBuilder
} = require('discord.js');

const db = require('./database');
const criarPainel = require('./painel');
const relatorio = require('./commands/relatorio');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===============================
// 🚀 BOT ONLINE
// ===============================
client.once(Events.ClientReady, async () => {
  console.log(`🔥 Bot online como ${client.user.tag}`);

  try {
    const canal = await client.channels.fetch(process.env.PAINEL_CHANNEL_ID);
    if (!canal) return console.log("Canal do painel não encontrado.");

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("🕒 Sistema Oficial de Bate Ponto")
      .setDescription(`
🟢 Iniciar  
⏸ Pausar  
▶ Retomar  
🔴 Finalizar
      `)
      .setTimestamp();

    await canal.send({
      embeds: [embed],
      components: [criarPainel()]
    });

    console.log("✅ Painel enviado!");
  } catch (err) {
    console.error("Erro ao enviar painel:", err);
  }
});


// ===============================
// 🎛 INTERAÇÕES
// ===============================
client.on(Events.InteractionCreate, async interaction => {

  if (!interaction.isButton()) return;

  const userId = interaction.user.id;

  // ===============================
  // 🟢 INICIAR
  // ===============================
  if (interaction.customId === 'iniciar') {

    await interaction.deferReply({ ephemeral: true });

    const agora = Date.now();

    db.run(
      "INSERT INTO pontos (userId, inicio, total) VALUES (?, ?, ?)",
      [userId, agora, 0],
      async (err) => {
        if (err) {
          console.error(err);
          return interaction.editReply({ content: "❌ Erro ao iniciar ponto." });
        }

        await interaction.editReply({ content: "🟢 Ponto iniciado com sucesso!" });
      }
    );
  }

  // ===============================
  // ⏸ PAUSAR
  // ===============================
  if (interaction.customId === 'pausar') {

    await interaction.deferReply({ ephemeral: true });

    db.get(
      "SELECT rowid, inicio FROM pontos WHERE userId = ? ORDER BY rowid DESC LIMIT 1",
      [userId],
      async (err, row) => {

        if (err || !row) {
          return interaction.editReply({ content: "❌ Nenhum ponto ativo para pausar." });
        }

        const agora = Date.now();
        const tempoAtual = agora - row.inicio;

        db.run(
          "UPDATE pontos SET total = ?, inicio = NULL WHERE rowid = ?",
          [tempoAtual, row.rowid]
        );

        await interaction.editReply({ content: "⏸ Ponto pausado." });
      }
    );
  }

  // ===============================
  // ▶ RETOMAR
  // ===============================
  if (interaction.customId === 'retomar') {

    await interaction.deferReply({ ephemeral: true });

    db.get(
      "SELECT rowid, total FROM pontos WHERE userId = ? ORDER BY rowid DESC LIMIT 1",
      [userId],
      async (err, row) => {

        if (err || !row || row.inicio !== null) {
          return interaction.editReply({ content: "❌ Nenhum ponto pausado." });
        }

        db.run(
          "UPDATE pontos SET inicio = ? WHERE rowid = ?",
          [Date.now(), row.rowid]
        );

        await interaction.editReply({ content: "▶ Ponto retomado." });
      }
    );
  }

  // ===============================
  // 🔴 FINALIZAR
  // ===============================
  if (interaction.customId === 'finalizar') {

    await interaction.deferReply({ ephemeral: true });

    db.get(
      "SELECT rowid, inicio, total FROM pontos WHERE userId = ? ORDER BY rowid DESC LIMIT 1",
      [userId],
      async (err, row) => {

        if (err || !row) {
          return interaction.editReply({ content: "❌ Nenhum ponto iniciado." });
        }

        let tempoTotal = row.total || 0;

        if (row.inicio) {
          tempoTotal += Date.now() - row.inicio;
        }

        db.run(
          "UPDATE pontos SET total = ? WHERE rowid = ?",
          [tempoTotal, row.rowid]
        );

        const horas = Math.floor(tempoTotal / 3600000);
        const minutos = Math.floor((tempoTotal % 3600000) / 60000);

        await interaction.editReply({
          content: `🔴 Ponto finalizado. Total trabalhado: ${horas}h ${minutos}m`
        });
      }
    );
  }

});

client.login(process.env.TOKEN);