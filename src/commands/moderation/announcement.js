const {
	leaderRoleID
} = require('../../config.json');
const {
  ChannelType,
  ActionRowBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription("Erstelle eine Ankündigung")
    .addChannelOption(o => o.setName('channel').setDescription("Der Kanal in der die Nachricht rein gesendet werden soll.").addChannelTypes(ChannelType.GuildText).setRequired(true)),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && !interaction.member.roles.cache.has(leaderRoleID)) {
      await interaction.reply({ content: "Du besitzt nicht die benötigten Berechtigungen dafür!", ephemeral: true });
      return;
    }
    
    const channel = interaction.options.getChannel('channel');

    const modal = new ModalBuilder()
      .setTitle("Ankündigung")
      .setCustomId('announce-modal');
    
    const channelInput = new TextInputBuilder()
      .setCustomId('channel')
      .setRequired(true)
      .setLabel("ID vom Kanal")
      .setPlaceholder("1234567890")
      .setValue(channel.id)
      .setStyle(TextInputStyle.Short);
    const channelActionRow = new ActionRowBuilder().addComponents(channelInput);

    const messageInput = new TextInputBuilder()
      .setCustomId('message')
      .setRequired(true)
      .setLabel("Nachricht")
      .setPlaceholder("...")
      .setStyle(TextInputStyle.Paragraph);
    const messageActionRow = new ActionRowBuilder().addComponents(messageInput);
    
    modal.addComponents(channelActionRow, messageActionRow);
    interaction.showModal(modal);
  }
}