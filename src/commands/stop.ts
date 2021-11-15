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
		const guildId = interaction.guildId!;
		const audioPlayer = globalVars.globalQueue.get(guildId)!.player;
		const message = '⏹ Stopped player';
		globalVars.globalQueue.delete(guildId);
		audioPlayer.stop();

		await interaction.reply({ content: message, ephemeral: true });
		console.log(`Guild ${guildId}: ${message}`);
	},
};
