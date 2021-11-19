import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import * as fs from 'fs';
import dotenv, { DotenvConfigOptions } from 'dotenv'
// -------------------------------------------------------------
// This script is used separately to deploy commands in dev guild
// -------------------------------------------------------------

const opts: DotenvConfigOptions={
	path: `${__dirname}\\..\\..\\.env`
};
dotenv.config(opts);
const commandsJSON = [];
const commandFiles = fs.readdirSync(__dirname + '\\..\\commands\\').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`../commands/${file}`);
	commandsJSON.push(command.data.toJSON());
}

const token = process.env['TOKEN']!;
const clientId = process.env['CLIENT_ID']!;
const guildId = process.env['GUILD_ID']!
const rest = new REST({ version: '9' }).setToken(token);

(async () => {
	try {
		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commandsJSON },
		);

		console.log('Successfully registered application commands.');
	}
	catch (error) {
		console.error(error);
	}
})();