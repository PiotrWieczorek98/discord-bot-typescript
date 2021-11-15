import { Guild } from 'discord.js';
import path from 'path';
import { Azure } from '../classes/Azure';
import { globalVars } from '../classes/GlobalVars';
import {GuildDataManager} from '../classes/GuildDataManager';

// --------------------------------------------------------------------
// When bot leaves guild
// --------------------------------------------------------------------

module.exports = {
	name: 'guildDelete',
	once: false,
	/**
	 * When bot leaves guild
	 * @param guild
	 */
	execute(guild: Guild) {
		(async () => {
		// Prepare data and upload
			globalVars.soundsChannel.delete(guild.id);
			let dir = path.resolve(__dirname, '..', globalVars.paths.DATA);
			const filePath = `${dir}/${globalVars.vars.FILE_SOUNDS_CHANNEL}`;
			await GuildDataManager.writeMapToFile(globalVars.soundsChannel, filePath);
			await Azure.uploadBlob(globalVars.vars.CONTAINER_DATA, filePath);
			await Azure.deleteContainer(guild.id);
			console.log(`Guild: ${guild.id} added!`);
		})();
	},
};