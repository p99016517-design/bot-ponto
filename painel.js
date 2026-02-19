const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function criarPainel() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('iniciar')
        .setLabel('🟢 Iniciar')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('pausar')
        .setLabel('🟡 Pausar')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('finalizar')
        .setLabel('🔴 Finalizar')
        .setStyle(ButtonStyle.Danger)
    );
}

module.exports = criarPainel;