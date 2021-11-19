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
		const guildId = interaction.guildId!;
		const member = (interaction.member as GuildMember);
		const guildPlayer = globalVars.guildsPlayers.get(member.guild.id);
		let message = '';
		if (guildPlayer == undefined  || guildPlayer instanceof String) {
			message = 'There is nothing playing.';
			await interaction.reply(message);
			console.log(`Guild ${guildId}: ${message}`);
		}
		else {
			const guildQueue = guildPlayer.audioSources.slice(1,);
			message = '**Queue:**\n';
			let i = 0;
			for (const source of guildPlayer.audioSources) {
				i += 1;
				message += `${i}. ${source.metadata.title}\n`;
			}
			message += `\n**Now playing:** ${guildPlayer.audioSources[0].metadata.title}`;
			await interaction.reply(message);
			console.log(`Guild ${guildId}: ${message}`);
		}
	},
};
