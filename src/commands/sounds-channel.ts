import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import path from 'path';
import {Azure} from '../classes/Azure';
import { globalVars } from '../classes/GlobalVars';
import { GuildDataManager } from '../classes/GuildDataManager';

// --------------------------------------------------------------------
// Sets channel used for auto-upload
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sounds-channel')
		.setDescription('Specify which channel should be tracked for uploaded sound files. Default is any channel')
		.addStringOption(option => option
			.setName('channel-id')
			.setDescription('Id of the channel where sent sounds will be auto uploaded to storage')
			.setRequired(true)),
	/**
	 * @param interaction
	 */
	async execute(interaction: CommandInteraction) {
		const option = interaction.options.getString('channel-id')!;
		const guildId = interaction.guildId!;
		let message = null;

		// Regex for channel id
		const regex = /[0-9]{18}/i;
		const results = option.match(regex);
		if (!results || !interaction.guild!.channels.cache.has(results[0])) {
			message = '❌ Channel id is incorrect!';
			interaction.reply({ content: message, ephemeral: true });
			console.log(message);
			return;
		}
		const channelId = results[0];
		let dir = path.resolve(__dirname, globalVars.paths.DATA);
		const filePath = dir + globalVars.vars.FILE_SOUNDS_CHANNEL;
		globalVars.soundsChannel.set(guildId, channelId);
		const resolve = await GuildDataManager.writeMapToFile(globalVars.soundsChannel, filePath);
		if (!resolve) {
			message = '❌ Error writing data!';
			interaction.reply({ content: message, ephemeral: true });
			console.log(`Guild ${guildId}: ${message}`);
		}
		await Azure.uploadBlob(globalVars.vars.CONTAINER_DATA, filePath, true);

		message = '✅ Channel set!';
		interaction.reply({ content: message, ephemeral: true });
		console.log(`Guild ${guildId}: ${message}`);
	},
};
