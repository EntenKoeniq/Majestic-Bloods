const {
	REST,
	Routes
} = require('discord.js');
const {
	clientId,
	guildId,
	token
} = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNUNG] Der Befehl in ${filePath} hat keinen Eintrag für 'data' oder 'execute'.`);
		}
	}
}

const rest = new REST().setToken(token);

(async () => {
	try {
		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`Es wurden erfolgreich ${data.length} Befehle (/) aktualisiert.`);
	} catch (error) {
		console.error(error);
	}
})();