import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import {Azure} from '../classes/Azure.js';
import { globalVars } from '../classes/GlobalVars.js';

// --------------------------------------------------------------------
// Delete sound from sound list and Azure
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('delete')
		.setDescription('Delete sound from the list')
		.addIntegerOption(option => option
			.setName('number')
			.setDescription('Number from the list')
			.setRequired(true)),
	/**
	 * @param interaction
	 */
	async execute(interaction: CommandInteraction) {
		const number = interaction.options.getInteger('number')!;
		let message: string;
		const guildId = interaction.guildId!;

		// Get Guild's sound list
		const guildSoundList = globalVars.globalSoundList.get(guildId)!;
		if (!guildSoundList) {
			message = '❌ Error while getting guild\'s sound list!';
			await interaction.reply({ content: message, ephemeral: true });
			console.log(`Guild ${guildId}: ${message}`);
		}

		// Get the sound
		const soundName = guildSoundList.soundList.get(number);
		if (!soundName) {
			message = '❌ Sike! That\'s a wrooong number! 🔥';
			await interaction.reply({ content: message, ephemeral: true });
			console.log(`Guild ${guildId}: ${message}`);
			return;
		}

		// Delete from Azure and update
		await Azure.deleteBlob(guildId, soundName);
		guildSoundList.downloadSounds();

		message = `✅ Deleted ${soundName}`;
		await interaction.reply(message);
		console.log(`Guild ${guildId}: ${message}`);
	},
};
