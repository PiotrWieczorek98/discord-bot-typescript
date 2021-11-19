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
		const guildPlayer= globalVars.guildsPlayers.get(guildId);

		if(guildPlayer == undefined || guildPlayer instanceof String){
			message = 'Queue is already empty!';
		}
		else{
			message = '⏩ Skipped video!';
			guildPlayer.shiftQueue();
		}
		await interaction.reply({content: message, ephemeral: true});
		console.log(`Guild ${guildId}: ${message}`);
	},
};
