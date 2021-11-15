import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import * as fs from 'fs';

// -------------------------------------------------------------
// This script is used separately to deploy commands globally
// -------------------------------------------------------------

const commandsJSON = [];
const commandFiles = fs.readdirSync(__dirname + '/../commands/').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`../commands/${file}`);
	commandsJSON.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(process.env['TOKEN']!);

(async () => {
	try {
		await rest.put(
			Routes.applicationCommands(process.env['CLIENT_ID']!),
			{ body: commandsJSON },
		);

		console.log('Successfully registered application commands.');
	}
	catch (error) {
		console.error(error);
	}
})();