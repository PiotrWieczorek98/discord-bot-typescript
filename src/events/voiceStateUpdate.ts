import { VoiceState } from 'discord.js';

// --------------------------------------------------------------------
// When voice chat state changes i.e. someone left or joined
// --------------------------------------------------------------------

module.exports = {
	name: 'voiceStateUpdate',
	once: false,
	/**
	 * Hardcoded for some fun on my server
	 * @param oldState
     * @param newState
	 */
	execute(oldState: VoiceState, newState: VoiceState) {
		(async () => {
			// const wspolnota = '203114439468253184';
			// const guild = oldState.guild;
			// const date = new Date();
			// if (guild.id != wspolnota || (date.getHours() > 5)) {
			// 	return;
			// }

			// const client = newState.client;
			// const client = guild.client;
			// client.autoUploadSoundChannel.set(guild.id, null);

			// const filePath = `${client.paths.DATA}/${client.vars.FILE_AUTO_UPLOAD}`;
			// await DataManager.writeMapToFile(client.autoUploadSoundChannel, filePath);
			// await Azure.uploadBlob(client.vars.CONTAINER_DATA, filePath);
			// console.log(`Guild: ${guild.id} added!`);
		})();
	},
};