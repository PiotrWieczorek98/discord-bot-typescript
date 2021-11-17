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
		const guildQueue = globalVars.globalQueue.get(guildId);

		if(guildQueue == undefined){
			message = 'Queue is already empty!';
		}
		else{
			const audioPlayer = guildQueue.player;
			message = '⏹ Stopped player';
			globalVars.globalQueue.delete(guildId);
			audioPlayer.stop();
		}
		await interaction.reply(message);
		console.log(`Guild ${guildId}: ${message}`);
	},
};
