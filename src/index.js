const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const {
	Client,
	Collection,
	Events,
	GatewayIntentBits
} = require('discord.js');
const {
	mongodb,
	token
} = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNUNG] Der Befehl in ${filePath} hat keinen Eintrag für 'data' oder 'execute'.`);
		}
	}
}

client.once(Events.ClientReady, async interaction => {
	await mongoose.connect(mongodb).catch(_ => { throw new Error("Es konnte keine Verbidung zur Datenbank hergestellt werden!"); });
	
	require('./registerCommands.js');

	console.log(`Ready! Logged in as ${interaction.user.tag}`);

	const activities = [
		"Gibt einer Person gerade einen Bloodout >:I",
		"Scheppert gegen andere Gangs >:)",
		"Verteidigt ein Gebiet vor Schmutz >:(",
		"Hängt im Unicorn ab ;)",
		"Räumt das Lager auf ..."
	];

  setInterval(() => {
    const status = activities[Math.floor(Math.random() * activities.length)];
    client.user.setPresence({
      activities: [{ name: status }]
    });
  }, 5000);
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand())
		return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`Der Befehl ${interaction.commandName} existiert nicht.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: "Ein Fehler ist aufgetreten!", ephemeral: true });
		} else {
			await interaction.reply({ content: "Ein Fehler ist aufgetreten!", ephemeral: true });
		}
	}
});

const ticket = require('./functions/ticket.js');
client.on(Events.InteractionCreate, ticket.create);
client.on(Events.InteractionCreate, ticket.close);

client.login(token);