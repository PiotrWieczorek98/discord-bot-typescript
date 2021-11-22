import { Client, Intents, Message } from 'discord.js';
import * as fs from 'fs';
import path from 'path';
import { globalVars } from './classes/GlobalVars';
import dotenv from 'dotenv';
import { WebService } from './classes/Endpoints';

// -------------------------------------------------------------
// Initialization
// -------------------------------------------------------------
dotenv.config();
const endpoints = WebService.getInstance;
endpoints.display();

// Create a new client instance
const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES,
		Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS]
});

// Load commands
let dir: string;
dir = `${__dirname}/${globalVars.paths.COMMANDS}`;
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
	// Check if command exist
	if (!interaction.isCommand()){
		console.log(`${interaction.guildId}: interaction not a command`);
		return;
	}
	const command = globalVars.commands.get(interaction.commandName);
	if (!command){
		console.log(`${interaction.guildId}: ${interaction.commandName} not in commands' list`);
		return;
	} 


	// Check if command is on cooldown
	if( globalVars.guildsCommandsCooldown.has(interaction.guildId)){
		const message = 'Commands are on cooldown! Wait a second and try again!';
		interaction.reply({content:message, ephemeral: true});
		return;
	}
	// Execute and add cooldown
	try {
		globalVars.guildsCommandsCooldown.add(interaction.guildId);
		setTimeout(() => {
			// Removes the user from the set after a minute
			globalVars.guildsCommandsCooldown.delete(interaction.guildId);
		  }, 2000);
		console.log(`Guild ${interaction.guild!.id}: ${interaction.commandName}`);
		await command.execute(interaction);
	}
	catch (error) {
		const message = '😬 There was an error while executing this command!';
		try{
			await interaction.reply({ content: message, ephemeral: true });
		}
		catch{
			console.error((error as Error).message);
			const handle = await interaction.channel!.send(message);
			setTimeout((messageHandle: Message) => { messageHandle.delete() }, 2000, handle);
		}
		console.log(`Guild ${interaction.guild!.id}: ${error}`);
	}
});

// Event listeners
dir = `${__dirname}/${globalVars.paths.EVENTS}`;
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