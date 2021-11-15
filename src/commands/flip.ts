import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

// --------------------------------------------------------------------
// Flips a coin
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('flip')
		.setDescription('Flip a coin'),
	/**
	 * @param interaction
	 */
	async execute(interaction: CommandInteraction) {
		const guildId = interaction.guildId!;
		const randNum = Math.random();
		let result: string;
		if (randNum < 0.5) {
			result = ':coin: Heads!';
		}
		else {
			result = ':coin: Tails!';
		}
		await interaction.reply(result);
		console.log(`Guild ${guildId}: ${result}`);
	},
};
