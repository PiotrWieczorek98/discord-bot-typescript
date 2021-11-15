import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

// --------------------------------------------------------------------
// Rolls a die
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roll')
		.setDescription('Roll a die')
		.addIntegerOption(option => option
			.setName('number')
			.setDescription('Maximum number')),
	/**
	 * @param interaction
	 */
	async execute(interaction: CommandInteraction) {
		let max = interaction.options.getInteger('number')!;
		const guildId = interaction.guildId!;
		if (!max) max = 101;
		else max += 1;
		const min = 0;
		let randNum = Math.random() * (max - min) + min;
		randNum = Math.floor(randNum);
		const message = `🎲 Rolled: **${randNum}**`;
		await interaction.reply(message);
		console.log(`Guild ${guildId}: ${message}`);
	},
};
