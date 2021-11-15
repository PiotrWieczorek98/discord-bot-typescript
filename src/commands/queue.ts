import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, GuildMember } from 'discord.js';
import { globalVars } from '../classes/GlobalVars';

// --------------------------------------------------------------------
// Sends guild's queue
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('List of songs in queue.'),
	/**
	 * @param interaction
	 */
	async execute(interaction: CommandInteraction) {
		const member = (interaction.member as GuildMember);
		const guildQueue = globalVars.globalQueue.get(member.guild.id);
		const guildId = interaction.guildId!;
		let message = '';
		if (!guildQueue) {
			message = 'There is nothing playing.';
			await interaction.reply(message);
			console.log(`Guild ${guildId}: ${message}`);
		}
		else {
			message = '**Queue:**\n';
			let i = 0;
			for (const source of guildQueue.audioSources) {
				i += 1;
				message += `${i}. ${source.title}\n`;
			}
			message += `\n**Now playing:** ${guildQueue.audioSources[0].title}`;
			await interaction.reply(message);
			console.log(`Guild ${guildId}: ${message}`);
		}
	},
};
