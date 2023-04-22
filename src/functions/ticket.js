const {
	leaderRoleID
} = require('./../config.json');
const ticketSchema = require('./../schemas/ticket.js');
const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits
} = require('discord.js');

module.exports = {
  create: async interaction => {
    if (!interaction.isStringSelectMenu() || interaction.customId !== 'ticket-select')
      return;
    
    const modal = new ModalBuilder()
      .setTitle("Wir brauchen einige Informationen")
      .setCustomId('ticket-modal');
    
    const username = new TextInputBuilder()
      .setCustomId('username')
      .setRequired(true)
      .setLabel("Name(IC)")
      .setPlaceholder("Nick Supa")
      .setStyle(TextInputStyle.Short);
    const usernameActionRow = new ActionRowBuilder().addComponents(username);
    
    const id = new TextInputBuilder()
      .setCustomId('id')
      .setRequired(true)
      .setLabel("#ID")
      .setPlaceholder("297")
      .setStyle(TextInputStyle.Short);
    const idActionRow = new ActionRowBuilder().addComponents(id);

    const reason = new TextInputBuilder()
      .setCustomId('reason')
      .setRequired(true)
      .setLabel("Kurze Beschreibung für dein Anliegen")
      .setPlaceholder("...")
      .setStyle(TextInputStyle.Short);
    const reasonActionRow = new ActionRowBuilder().addComponents(reason);
    
    modal.addComponents(usernameActionRow, idActionRow, reasonActionRow);
    interaction.showModal(modal);
  },
  close: async interaction => {
    if (!interaction.isModalSubmit() || interaction.customId !== 'ticket-modal')
      return;
    
    const ticket = await ticketSchema.findOne({ Guild: interaction.guild.id });
    if (!ticket)
      return;
    
    const emailInput = interaction.fields.getTextInputValue('username');
    const idInput = interaction.fields.getTextInputValue('id');
    const reasonInput = interaction.fields.getTextInputValue('reason');

    const posChannel = interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`);
    if (posChannel)
      return await interaction.reply({ content: `Du hast bereits das Ticket - ${posChannel}`, ephemeral: true });
    
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle(`${interaction.user.username}'s Ticket`)
      .setDescription("Willkommen bei deinem Ticket! Bitte habe ein wenig Geduld, es wird dir schnellstmöglich jemand weiterhelfen.")
      .addFields({ name: `Name`, value: emailInput })
      .addFields({ name: `ID`, value: idInput })
      .addFields({ name: `Anliegen`, value: reasonInput })
      .setFooter({ text: `${interaction.guild.name} tickets` });
    
    const button = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('ticket')
          .setLabel("Ticket schließen")
          .setStyle(ButtonStyle.Danger)
      );

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.id}`,
      type: ChannelType.GuildText,
      parent: ticket.Category,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: leaderRoleID,
          allow: [PermissionFlagsBits.ViewChannel]
        }
      ]
    });

    let msg = await channel.send({ embeds: [embed], components: [button] });
    await interaction.reply({ content: `Dein Ticket wurde erstellt - ${channel}`, ephemeral: true });

    const collector = msg.createMessageComponentCollector();
    collector.on('collect', async () => {
      ;channel.delete();

      const dmEmbed = new EmbedBuilder()
        .setColor('Red')
        .setTitle("Dein Ticket wurde geschlossen")
        .setDescription("Vielen Dank das du dich bei uns gemeldet hast. Eröffne gerne ein neues Ticket, wenn du weitere Anliegen hast.")
        .setFooter({ text: `${interaction.guild.name} tickets`})
        .setTimestamp();
      await interaction.member.send({ embeds: [dmEmbed] });
    });
  }
};