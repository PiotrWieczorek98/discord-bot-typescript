import { Guild } from 'discord.js';
import path from 'path';
import { Azure } from '../classes/Azure';
import { globalVars } from '../classes/GlobalVars';
import { GuildDataManager } from '../classes/GuildDataManager';

// --------------------------------------------------------------------
// When bot joins new guild
// --------------------------------------------------------------------

module.exports = {
	name: 'guildCreate',
	once: false,
	/**
	 * When bot joins new guild
	 * @param guild
	 */
	execute(guild:Guild) {
		(async () => {
			globalVars.autoUploadChannel.set(guild.id, 'null');
			let dir = path.resolve(__dirname, '..', globalVars.paths.DATA);
			const filePath = `${dir}/${globalVars.vars.FILE_SOUNDS_CHANNEL}`;
			await GuildDataManager.writeMapToFile(globalVars.autoUploadChannel, filePath);
			await Azure.uploadBlob(globalVars.vars.CONTAINER_DATA, filePath);
			console.log(`Guild: ${guild.id} added!`);
		})();
	},
};