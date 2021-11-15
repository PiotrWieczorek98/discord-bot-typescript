import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

// --------------------------------------------------------------------
// Sends guild info
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Server info'),
	/**
	 * @param interaction
	 */
	async execute(interaction: CommandInteraction) {
		const guild = interaction.guild!;
		const message = `**Server name:** ${guild.name}\n
		**Total members:** ${guild.memberCount}\n
		**Created At:** ${guild.createdAt}\n 
		**Verification Level:** ${guild.verificationLevel}`;
		await interaction.reply(message);
		console.log(`Guild ${guild.id}: ${message}`);
	},
};
