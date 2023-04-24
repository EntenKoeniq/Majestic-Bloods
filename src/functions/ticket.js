const {
	leaderRoleID
} = require("./../config.json");
const ticketSchema = require("./../schemas/ticket.js");
const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  PermissionsBitField
} = require("discord.js");

module.exports = {
  create: async interaction => {
    if (!interaction.isStringSelectMenu() || interaction.customId !== "ticket-select")
      return;
    
    const modal = new ModalBuilder()
      .setTitle("Informationen")
      .setCustomId("ticket-modal");
    
    const username = new TextInputBuilder()
      .setCustomId("username")
      .setRequired(true)
      .setLabel("Name(IC)")
      .setPlaceholder("Nick Supa")
      .setStyle(TextInputStyle.Short);
    const usernameActionRow = new ActionRowBuilder().addComponents(username);
    
    const id = new TextInputBuilder()
      .setCustomId("id")
      .setRequired(true)
      .setLabel("#ID")
      .setPlaceholder("297")
      .setStyle(TextInputStyle.Short);
    const idActionRow = new ActionRowBuilder().addComponents(id);

    const reason = new TextInputBuilder()
      .setCustomId("reason")
      .setRequired(true)
      .setLabel("Beschreibe dein Anliegen")
      .setPlaceholder("...")
      .setStyle(TextInputStyle.Paragraph);
    const reasonActionRow = new ActionRowBuilder().addComponents(reason);

    const option = new TextInputBuilder()
      .setCustomId("option")
      .setRequired(true)
      .setValue(interaction.values[0])
      .setLabel("Kurze Anmerkung worum es geht")
      .setPlaceholder("Kurze Anmerkung worum es geht")
      .setStyle(TextInputStyle.Short);
    const optionActionRow = new ActionRowBuilder().addComponents(option);
    
    modal.addComponents(usernameActionRow, idActionRow, reasonActionRow, optionActionRow);
    interaction.showModal(modal);
  },
  close: async interaction => {
    if (!interaction.isModalSubmit() || interaction.customId !== "ticket-modal")
      return;
    
    const ticket = await ticketSchema.findOne({ Guild: interaction.guild.id });
    if (!ticket)
      return;
    
    const emailInput = interaction.fields.getTextInputValue("username");
    const idInput = interaction.fields.getTextInputValue("id");
    const reasonInput = interaction.fields.getTextInputValue("reason");
    const optionInput = interaction.fields.getTextInputValue("option");

    const posChannel = interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`);
    if (posChannel) {
      await interaction.reply({ content: `Du hast bereits das Ticket - ${posChannel}`, ephemeral: true });
      return;
    }
    
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setAuthor({
        name: `${interaction.user.username}#${interaction.user.discriminator} <${interaction.user.id}>`,
        iconURL: interaction.user.avatar ? `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.webp` : "https://cdn.discordapp.com/embed/avatars/0.png"
      })
      .setTitle("Hallo!")
      .setDescription("Willkommen bei deinem Ticket! Bitte habe ein wenig Geduld, es wird dir schnellstmöglich jemand weiterhelfen.")
      .addFields({ name: "Name", value: emailInput })
      .addFields({ name: "ID", value: idInput })
      .addFields({ name: "Anliegen", value: reasonInput })
      .addFields({ name: "Anmerkung", value: optionInput })
      .setFooter({ text: interaction.guild.name });
    
    const closeButton = new ButtonBuilder()
      .setCustomId("close")
      .setLabel("Ticket schließen")
      .setStyle(ButtonStyle.Danger);
    const lockButton = new ButtonBuilder()
      .setCustomId("lock")
      .setLabel("Ticket sperren")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.Administrator));
    
    const buttonRow = new ActionRowBuilder()
      .addComponents(closeButton, lockButton);

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

    let msg = await channel.send({ embeds: [embed], components: [buttonRow] });
    await interaction.reply({ content: `Dein Ticket wurde erstellt - ${channel}`, ephemeral: true });

    const collector = msg.createMessageComponentCollector();
    collector.on("collect", async b => {
      switch (b.customId) {
        case "close":
          channel.delete();

          const dmEmbed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("Dein Ticket wurde geschlossen")
            .setDescription("Vielen Dank das du dich bei uns gemeldet hast. Eröffne gerne ein neues Ticket, wenn du weitere Anliegen hast.")
            .setFooter({ text: interaction.guild.name })
            .setTimestamp();
          await interaction.member.send({ embeds: [dmEmbed] });
          break;
        case "lock":
          if (!b.member.permissions.has(PermissionsBitField.Flags.Administrator) && !b.member.roles.cache.has(leaderRoleID)) {
            await channel.send(`<@${b.user.id}> Das Ticket kann nur von der Leaderschaft gesperrt werden!`);
            return;
          }

          channel.permissionOverwrites.set([
            {
              id: b.guild.roles.everyone.id,
              deny: [PermissionFlagsBits.SendMessages]
            },
            {
              id: b.user.id,
              deny: [PermissionFlagsBits.SendMessages]
            },
            {
              id: leaderRoleID,
              deny: [PermissionFlagsBits.SendMessages]
            }
          ]);

          lockButton.setCustomId("unlock");
          lockButton.setLabel("Ticket entsperren");
          await b.update({ embeds: [embed], components: [buttonRow] });

          await channel.send(`<@${interaction.user.id}> Das Ticket wurde gesperrt!`);
          break;
        case "unlock":
          if (!b.member.permissions.has(PermissionsBitField.Flags.Administrator) && !b.member.roles.cache.has(leaderRoleID)) {
            await channel.send(`<@${b.user.id}> Das Ticket kann nur von der Leaderschaft entsperrt werden!`);
            return;
          }

          channel.permissionOverwrites.set([
            {
              id: b.guild.roles.everyone.id,
              allow: [PermissionFlagsBits.SendMessages]
            },
            {
              id: b.user.id,
              allow: [PermissionFlagsBits.SendMessages]
            },
            {
              id: leaderRoleID,
              allow: [PermissionFlagsBits.SendMessages]
            }
          ]);

          lockButton.setCustomId("lock");
          lockButton.setLabel("Ticket sperren");
          await b.update({ embeds: [embed], components: [buttonRow] });

          await channel.send(`<@${interaction.user.id}> Das Ticket wurde entsperrt!`);
          break;
      }
    });
  }
};