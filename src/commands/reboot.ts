import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { globalVars } from '../classes/GlobalVars';
const {Heroku} = require('heroku-client');

// --------------------------------------------------------------------
// Restarts Heroku dyno
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reboot')
		.setDescription('Restart the bot'),
	/**
	 * @param interaction
	 */
	async execute(interaction: CommandInteraction) {
		const guildId = interaction.guildId!;
		const message = 'Rebooting...';
		await interaction.reply(message);
		console.log(`Guild ${guildId}: ${message}`);
		const heroku = new Heroku({ token: process.env.HEROKU_API_TOKEN });
		heroku.delete(`/apps/${globalVars.vars.HEROKU_APP}/dynos/${globalVars.vars.HEROKU_DINO}`);
	},
};
