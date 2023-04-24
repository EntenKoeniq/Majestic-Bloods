module.exports = {
  create: async interaction => {
    if (!interaction.isModalSubmit() || interaction.customId !== "announce-modal")
      return;
    
    const channelInput = interaction.fields.getTextInputValue("channel");
    const messageInput = interaction.fields.getTextInputValue("message");
    
    const channel = interaction.guild.channels.cache.find(c => c.id == channelInput);
    if (!channel) {
      await interaction.reply({ content: "Dieser Kanal existiert nicht!", ephemeral: true });
      return;
    }

    await channel.send(messageInput);
    await interaction.reply({ content: "Deine Nachricht wurde gesendet!", ephemeral: true });
  }
};