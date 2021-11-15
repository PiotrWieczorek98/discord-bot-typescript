import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, GuildMember, Interaction } from 'discord.js';
import { betsLeagueOfLegends } from '../classes/BetsLeagueOfLegends';
import { globalVars } from '../classes/GlobalVars';

// --------------------------------------------------------------------
// Register for betting
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bet-register')
		.setDescription('Register for League of legends bets'),
	/**
	 * @param  interaction
	 */
	async execute(interaction: CommandInteraction) {

		let message: string;
		const member = (interaction.member as GuildMember);
		// Check if already registered
		const gamblerCredits = betsLeagueOfLegends.getGamblerCredits(member.id);
		if (gamblerCredits == undefined) {
			await betsLeagueOfLegends.addGambler(member);
			message = `Successfuly registered **${member.displayName}** for League of Legends betting. You've got: **${globalVars.gambleConfig.initialCredits}** credits.`;

		}
		else {
			message = `**${member.displayName}** is already registered! You've got: **${gamblerCredits}** credits.`;
		}

		await interaction.reply(message);
		console.log(`Guild ${interaction.guild!.id}: ${message}`);
	},
};
