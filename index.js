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
    if (!canal) return console.log("❌ Canal do painel não encontrado.");

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("🕒 Sistema Oficial de Bate Ponto")
      .setDescription(`
📌 **Como funciona:**
🟢 Iniciar → Começa a contar  
🔴 Finalizar → Encerra o expediente  

🎯 Meta semanal: 25h  
⚠️ Mínimo obrigatório: 20h  
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

  // ===== SLASH COMMAND =====
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

    await interaction.deferReply({ ephemeral: true });

    db.get(
      "SELECT * FROM pontos WHERE userId = ? AND fim IS NULL",
      [userId],
      (err, row) => {

        if (err) {
          console.error(err);
          return interaction.editReply("Erro no banco de dados.");
        }

        if (row) {
          return interaction.editReply("❌ Você já tem um ponto aberto.");
        }

        const agora = Date.now();

        db.run(
          "INSERT INTO pontos (userId, inicio) VALUES (?, ?)",
          [userId, agora],
          (err) => {

            if (err) {
              console.error(err);
              return interaction.editReply("Erro ao iniciar ponto.");
            }

            const embed = new EmbedBuilder()
              .setColor("#57F287")
              .setTitle("🟢 Ponto Iniciado")
              .setDescription(`🕒 Início: <t:${Math.floor(agora/1000)}:T>`)
              .setTimestamp();

            interaction.editReply({ embeds: [embed] });
          }
        );
      }
    );
  }


  // ===============================
  // 🔴 FINALIZAR
  // ===============================
  if (interaction.customId === 'finalizar') {

    await interaction.deferReply({ ephemeral: true });

    db.get(
      "SELECT * FROM pontos WHERE userId = ? AND fim IS NULL",
      [userId],
      async (err, row) => {

        if (err) {
          console.error(err);
          return interaction.editReply("Erro interno no banco.");
        }

        if (!row) {
          return interaction.editReply("❌ Você não tem ponto aberto.");
        }

        const agora = Date.now();
        const tempo = agora - row.inicio;

        db.run(
          "UPDATE pontos SET fim = ?, total = ? WHERE id = ?",
          [agora, tempo, row.id],
          async (err) => {

            if (err) {
              console.error(err);
              return interaction.editReply("Erro ao finalizar ponto.");
            }

            const horas = Math.floor(tempo / 3600000);
            const minutos = Math.floor((tempo % 3600000) / 60000);

            const embedUser = new EmbedBuilder()
              .setColor("#ED4245")
              .setTitle("🔴 Ponto Finalizado")
              .setDescription(`⏱ Você trabalhou **${horas}h ${minutos}m**.`)
              .setTimestamp();

            await interaction.editReply({ embeds: [embedUser] });

            // ===== LOG =====
            try {
              const canalLog = await client.channels.fetch(process.env.LOG_CHANNEL_ID);
              if (!canalLog) return;

              const embedLog = new EmbedBuilder()
                .setColor("#2B2D31")
                .setThumbnail(interaction.user.displayAvatarURL({ size: 512 }))
                .setTitle("📋 Registro Diário de Ponto")
                .setDescription(`
👤 **${interaction.user.username}**

🟢 Iniciou: <t:${Math.floor(row.inicio/1000)}:T>  
🔴 Finalizou: <t:${Math.floor(agora/1000)}:T>  

⏱ Total: ${horas}h ${minutos}m
                `)
                .setFooter({ text: "Sistema automático de controle" })
                .setTimestamp();

              await canalLog.send({ embeds: [embedLog] });

            } catch (errorLog) {
              console.error("Erro ao enviar log:", errorLog);
            }

          }
        );
      }
    );
  }

});

client.login(process.env.TOKEN);