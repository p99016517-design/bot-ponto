require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder().setName('relatorio').setDescription('Relatório semanal'),
  new SlashCommandBuilder()
    .setName('horas')
    .setDescription('Ver horas de um usuário')
    .addUserOption(option =>
      option.setName('usuario').setDescription('Usuário').setRequired(true)
    ),
  new SlashCommandBuilder().setName('reprovados').setDescription('Lista abaixo de 20h')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

rest.put(
  Routes.applicationCommands(process.env.CLIENT_ID),
  { body: commands }
).then(() => console.log("✅ Comandos atualizados."));