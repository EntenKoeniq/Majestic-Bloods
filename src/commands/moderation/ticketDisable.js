const {
	leaderRoleID
} = require("./../../config.json");
const {
  SlashCommandBuilder,
  PermissionsBitField
} = require("discord.js");
const ticketSchema = require("./../../schemas/ticket.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-disable")
    .setDescription("Entfernt das Ticketsystem von diesem Discord"),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && !interaction.member.roles.cache.has(leaderRoleID)) {
      await interaction.reply({ content: "Du besitzt nicht die benötigten Berechtigungen dafür!", ephemeral: true });
      return;
    }

    const ticket = await ticketSchema.findOneAndRemove({ Guild: interaction.guild.id }, { returnDocument: "before" });
    if (!ticket) {
      await interaction.reply({ content: "Es existiert kein Ticketsystem für diesen Discord!", ephemeral: true });
      return;
    }
    
    try {
      const channel = await interaction.guild.channels.fetch(ticket.Channel);
      await channel.messages.delete(ticket.Embed);
    } catch {
      await interaction.reply({ content: "Das Ticketsystem wurde von diesem Discord entfernt. Die Nachricht konnte nicht gelöscht werden.", ephemeral: true });
      return;
    }

    await interaction.reply({ content: "Das Ticketsystem wurde vollständig von diesem Discord entfernt!", ephemeral: true });
  }
}