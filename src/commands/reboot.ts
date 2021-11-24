import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import request from 'request';

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
		const token = process.env['HEROKU_API_TOKEN']!;
		const app = process.env['HEROKU_APP']!;
		request.delete(
			{
				url: 'https://api.heroku.com/apps/' + app + '/dynos/',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/vnd.heroku+json; version=3',
					'Authorization': 'Bearer ' + token
				}
			},
			function(error) {
				console.log(`Guild ${guildId}: ${error}`);
			});
	},
};