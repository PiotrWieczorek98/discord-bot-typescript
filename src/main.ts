import { Client, Intents } from 'discord.js';
import * as fs from 'fs';
import path from 'path';
import { globalVars } from './classes/GlobalVars';
import dotenv from 'dotenv';
import { endpoints } from 'Endpoints';

// -------------------------------------------------------------
// Initialization
// -------------------------------------------------------------
dotenv.config();
endpoints.setListener(globalVars.gambleConfig.port);

// Create a new client instance
const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES,
		Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS]
});

// Load commands
let dir = path.resolve(__dirname, globalVars.paths.COMMANDS);
const commandFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const filePath = path.resolve(dir, file);
	const command = require(filePath);
	globalVars.commands.set(command.data.name, command);
}

// -------------------------------------------------------------
// Listeners
// -------------------------------------------------------------

// Command listeners
client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	const command = globalVars.commands.get(interaction.commandName);
	if (!command) return;
	try {
		console.log(`Guild ${interaction.guild!.id}: ${interaction.commandName}`);
		await command.execute(interaction);
	}
	catch (error) {
		await interaction.reply({ content: '😬 There was an error while executing this command!', ephemeral: true });
		console.log(`Guild ${interaction.guild!.id}: ${error}`);
	}
});

// Event listeners
dir = path.resolve(__dirname, globalVars.paths.EVENTS);
const eventFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.resolve(dir, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// -------------------------------------------------------------
// Login to Discord with client's token
// -------------------------------------------------------------
client.login(process.env['TOKEN']!);