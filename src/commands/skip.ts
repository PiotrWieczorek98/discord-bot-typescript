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
		const guildId = interaction.guildId!;
		const message = '⏭ Skipping song';
		const player = globalVars.globalQueue.get(guildId)!.player;
		player.stop();
		await interaction.reply({ content: message, ephemeral: true });
		console.log(`Guild ${guildId}: ${message}`);
	},
};
