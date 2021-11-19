import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import * as fs from 'fs';
import dotenv from 'dotenv'

// -------------------------------------------------------------
// This script is used separately to deploy commands globally
// -------------------------------------------------------------
dotenv.config();
const commandsJSON = [];
const commandFiles = fs.readdirSync(__dirname + '/../commands/').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`../commands/${file}`);
	commandsJSON.push(command.data.toJSON());
}


const token = process.env['TOKEN']!;
const clientId = process.env['CLIENT_ID']!;
const rest = new REST({ version: '9' }).setToken(token);

(async () => {
	try {
		await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commandsJSON },
		);

		console.log('Successfully registered application commands.');
	}
	catch (error) {
		console.error(error);
	}
})();