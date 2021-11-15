import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { globalVars } from '../classes/GlobalVars';

// --------------------------------------------------------------------
// Sends guild's sound list
// --------------------------------------------------------------------

/**
 * Discord's message limit is 2000 characters
 * @param interaction
 * @param message
 * @param newLine
 * @returns
 */
async function checkCharacterLimit(interaction: CommandInteraction, message: string, newLine: string) {
	// Split messages due to char limit
	if (message.length + newLine.length < 2000) {
		message += newLine;
	}
	else {
		message += '```';
		await interaction.channel!.send(message);
		message = `\`\`\`css\n${newLine}`;
	}
	return message;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list')
		.setDescription('Sounds list'),
	/**
	 * @param interaction
	 */
	async execute(interaction: CommandInteraction) {
		const guildId = interaction.guildId!;
		const soundList = globalVars.globalSoundList.get(guildId)!.soundList;

		await interaction.reply({ content: '🙉', ephemeral: true });
		console.log(`Guild ${interaction.guildId}: Sent sound list`);

		let message = '```css\n[SOUND LIST:]\n';
		let previousWord = soundList.get(1)!.split('_')[0];
		for (const entry of soundList) {
			let newLine = `${entry[0]}. ${entry[1]}\n`;
			const nextWord = entry[1].split('_')[0];
			if (previousWord != nextWord) {
				previousWord = nextWord;
				newLine = `\n${newLine}`;
			}
			message = await checkCharacterLimit(interaction, message, newLine);
		}

		message += '```';
		await interaction.channel!.send(message);
	},
};
