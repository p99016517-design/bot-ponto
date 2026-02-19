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
    const canal = await client.channels.fetch('1471917439750246483');

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("🕒 Sistema Oficial de Bate Ponto")
      .setDescription(`
📌 **Como funciona:**
🟢 Iniciar → Começa a contar  
🔴 Finalizar → Encerra o expediente  

🎯 **Meta semanal:** 25 horas  
⚠️ **Mínimo obrigatório:** 20 horas  
📅 Semana válida: Domingo → Sábado
      `)
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ text: "Sistema automático • Controle interno" })
      .setTimestamp();

    await canal.send({
      embeds: [embed],
      components: [criarPainel()]
    });

    console.log("✅ Painel enviado!");
  } catch (err) {
    console.error("❌ Erro ao enviar painel:", err);
  }
});


// ===============================
// 🎛 INTERAÇÕES
// ===============================
client.on(Events.InteractionCreate, async interaction => {

  // Slash Command
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'relatorio') {
      return relatorio.execute(interaction);
    }
  }

  if (!interaction.isButton()) return;

  const userId = interaction.user.id;

  // ===============================
  // 🟢 INICIAR
  // ===============================
  if (interaction.customId === 'iniciar') {

    const agora = Date.now();

    db.run(
      "INSERT INTO pontos (userId, inicio, total) VALUES (?, ?, ?)",
      [userId, agora, 0]
    );

    const embed = new EmbedBuilder()
      .setColor("#57F287")
      .setTitle("🟢 Ponto Iniciado")
      .setDescription(`
🕒 Início: <t:${Math.floor(agora/1000)}:T>
      `)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }


  // ===============================
  // 🔴 FINALIZAR
  // ===============================
  if (interaction.customId === 'finalizar') {

    db.get(
      "SELECT rowid, inicio FROM pontos WHERE userId = ? ORDER BY rowid DESC LIMIT 1",
      [userId],
      async (err, row) => {

        if (!row) {
          return interaction.reply({
            content: "❌ Você não iniciou nenhum ponto.",
            ephemeral: true
          });
        }

        const fim = Date.now();
        const inicio = row.inicio;
        const tempo = fim - inicio;

        db.run(
          "UPDATE pontos SET total = ? WHERE rowid = ?",
          [tempo, row.rowid]
        );

        // Converter tempo
        const horas = Math.floor(tempo / 3600000);
        const minutos = Math.floor((tempo % 3600000) / 60000);

        // Resposta privada
        const embedUser = new EmbedBuilder()
          .setColor("#ED4245")
          .setTitle("🔴 Ponto Finalizado")
          .setDescription(`
⏱ Você trabalhou **${horas}h ${minutos}m** hoje.
          `)
          .setTimestamp();

        await interaction.reply({ embeds: [embedUser], ephemeral: true });

        // LOG BONITO
        const canalLog = await client.channels.fetch(process.env.LOG_CHANNEL_ID);

        const embedLog = new EmbedBuilder()
          .setColor("#2B2D31")
          .setThumbnail(interaction.user.displayAvatarURL({ size: 512 }))
          .setTitle("📋 Registro Diário de Ponto")
          .setDescription(`
👤 **${interaction.user.username}**

🟢 Iniciou: <t:${Math.floor(inicio/1000)}:T>  
🔴 Finalizou: <t:${Math.floor(fim/1000)}:T>  

⏱ **Total trabalhado hoje: ${horas}h ${minutos}m**
          `)
          .setFooter({ text: "Sistema automático de controle" })
          .setTimestamp();

        await canalLog.send({ embeds: [embedLog] });

      }
    );
  }

});

client.login(process.env.TOKEN);