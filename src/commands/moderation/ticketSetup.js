const {
	leaderRoleID
} = require('./../../config.json');
const {
  EmbedBuilder,
  ChannelType,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  SlashCommandBuilder
} = require('discord.js');
const ticketSchema = require('../../schemas/ticket');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-set')
    .setDescription("Richtet das System für Tickets ein")
    .addChannelOption(o => o.setName('channel').setDescription("Der Kanal in der die Nachricht rein gesendet werden soll.").addChannelTypes(ChannelType.GuildText).setRequired(true))
    .addChannelOption(o => o.setName('category').setDescription("Die Kategorie in der die Tickets eröffnet werden soll.").addChannelTypes(ChannelType.GuildCategory).setRequired(true)),
  async execute(interaction) {
    if (interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && !interaction.member.roles.cache.has(leaderRoleID)) {
      await interaction.reply({ content: "Du besitzt nicht die benötigten Berechtigungen dafür!", ephemeral: true });
      return;
    }
    
    const channel = interaction.options.getChannel('channel');
    const category = interaction.options.getChannel('category');

    const ticket = await ticketSchema.findOne({ Guild: interaction.guild.id });
    if (ticket) {
      await interaction.reply({ content: "Dieses System wurde bereits eingerichtet. Nutze `/ticket-disable` um das letzte System zu deaktivieren.", ephemeral: true });
      return;
    }

    ticketSchema.create({
      Guild: interaction.guild.id,
      Category: category.id
    });

    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle("Ticket System")
      .setDescription("Wenn du ein Problem oder eine Frage hast, eröffne ein Ticket um Hilfe zu erhalten.")
      .setFooter({ text: `${interaction.guild.name} tickets` });
    
    const menu = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('ticket-select')
          .setMaxValues(1)
          .setPlaceholder("Wähle eine Kategorie ...")
          .addOptions(
            {
              label: "💬 Allgemeine Frage",
              value: "Ich habe eine Frage"
            },
            {
              label: "🚫 Problem melden",
              value: "Ich habe ein Problem"
            },
            {
              label: "❇️ Etwas anderes",
              value: "Etwas anderes"
            }
          )
      );
    
    await channel.send({ embeds: [embed], components: [menu] });
    await interaction.reply({ content: `Das System wurde erfolgreich in ${channel} eingerichtet!`, ephemeral: true });
  }
}