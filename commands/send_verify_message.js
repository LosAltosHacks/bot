const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} = require('discord.js');
const { generateEmbed } = require('../tools');

const verifyEmbed = generateEmbed(
  'Verify Email',
  'In order to gain access to the rest of the server, we need to verify that you are an attendee of Los Altos Hacks. Click the button below to verify your email.',
);

const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId('verify')
    .setLabel('Verify my email')
    .setStyle('Success'),
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription(
      'Send an message embed with a email verification modal for attendees.',
    ),
  async execute(client, interaction) {
    await interaction.deferReply();
    await interaction.deleteReply();
    await interaction.channel.send({
      embeds: [verifyEmbed],
      components: [row],
      ephemeral: false,
    });
  },
};
