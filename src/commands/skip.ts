import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { globalVars } from '../classes/GlobalVars';

// --------------------------------------------------------------------
// Skips currently played audio
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skip whatever is playing'),
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
			message = '⏩ Skipped video!';
			audioPlayer.stop();
		}
		await interaction.reply(message);
		console.log(`Guild ${guildId}: ${message}`);
	},
};
