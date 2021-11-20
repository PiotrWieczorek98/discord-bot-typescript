import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, Message } from 'discord.js';
import { globalVars } from '../classes/GlobalVars';

// --------------------------------------------------------------------
// Flips a coin
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bring-player-down')
		.setDescription('Useful if message embed gets buried in text chat'),
	/**
	 * @param interaction
	 */
	async execute(interaction: CommandInteraction) {
        let message = 'Bringing player down...';
		const guildId = interaction.guildId!;

        await interaction.reply(message);
		console.log(`Guild ${guildId}: ${message}`);
		
        // Check player if doesn't exist
		let guildPlayer = globalVars.guildsPlayers.get(guildId);
		if(guildPlayer == undefined){
			message = `Player doesn't exist!`;
		}
		else {
            await guildPlayer.bringDownEmbed();
			// Delete reply
			const reply = await interaction.fetchReply() as Message;
			await reply.delete();
		}
	},
};
