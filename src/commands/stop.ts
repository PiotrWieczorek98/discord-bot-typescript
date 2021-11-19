import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { globalVars } from '../classes/GlobalVars';

// --------------------------------------------------------------------
// Stops player and deletes queue
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('It\'s time to stop!'),
	/**
	 * @param interaction
	 */
	async execute(interaction: CommandInteraction) {
		let message: string;
		const guildId = interaction.guildId!;
		const guildPlayer = globalVars.guildPlayers.get(guildId);

		if(guildPlayer == undefined || guildPlayer instanceof String){
			message = 'Queue is already empty!';
		}
		else{
			message = '⏹ Stopped player';
			guildPlayer.stopPlayer();
		}
		await interaction.reply(message);
		console.log(`Guild ${guildId}: ${message}`);
	},
};
