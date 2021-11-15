import { CommandInteraction, GuildMember } from "discord.js";
import { SlashCommandBuilder } from '@discordjs/builders';
import { betsLeagueOfLegends } from "../classes/BetsLeagueOfLegends";

// --------------------------------------------------------------------
// Bet some cash
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bet')
		.setDescription('Bet on someone')
		.addIntegerOption(option => option
			.setName('value')
			.setDescription('Value of your bet')
			.setRequired(true))
		.addStringOption(option => option
			.setName('summoner')
			.setDescription('Summoner name of the target')
			.setRequired(true))
		.addNumberOption(option => option
			.setName('minute')
			.setDescription('Minute of the game in which the target will die')
			.setRequired(true)),
	/**
	 * @param interaction
	 */
	async execute(interaction: CommandInteraction) {
		const member = (interaction.member as GuildMember);
		const bet = interaction.options.getInteger('value')!;
		const summoner = interaction.options.getString('summoner')!;
		const minute = interaction.options.getNumber('minute')!;
		const message = betsLeagueOfLegends.addBetToJackpot(member, bet, summoner, minute);
		await interaction.reply(message);
		console.log(`Guild ${interaction.guild!.id}: ${message}`);
	},
};
