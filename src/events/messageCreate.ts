import { Message } from 'discord.js';
import path from 'path';
import { Azure } from '../classes/Azure';
import { globalVars } from '../classes/GlobalVars';
import {GuildDataManager} from '../classes/GuildDataManager';

// --------------------------------------------------------------------
// When message is sent
// --------------------------------------------------------------------

module.exports = {
	name: 'messageCreate',
	once: false,
	/**
     * When message is sent
     * @param message
     */
	async execute(message: Message) {
		const guildId = message.guildId!;
		// Check for sound upload
		for (const attachment of message.attachments) {
			if (attachment[1].contentType == 'audio/mpeg') {
				const soundsChannel = globalVars.soundsChannel.get(guildId);
				if (soundsChannel == null || soundsChannel == message.channelId) {
					// Download file to upload it to Azure
					let dir = path.resolve(__dirname, globalVars.paths.SOUNDS);
					const filePath = `${dir}/${message.guildId}/${attachment[1].name}`;
					await GuildDataManager.downloadFromUrl(attachment[1].url, filePath);
					const response = await Azure.uploadBlob(guildId, filePath);						
					message.react(response);

					// Update sound list
					const guildSoundList = globalVars.globalSoundList.get(guildId)!;
					guildSoundList.downloadSounds();
				}
			}
		}
	},
};