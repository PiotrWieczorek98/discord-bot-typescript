import {Azure} from './Azure.js';

/**
 * Class represents guild's sound list stored in Azure.
 * Used to play sounds in voice chat.
 */
export class GuildSoundList {
	guildId:string;
	soundList:Map<number, string>;
	path: string;
	/**
     * Constructs GuildSoundList object
     * @param guildId
     * @param path path where sounds will be downloaded
     */
	constructor(guildId: string, path: string) {
		this.guildId = guildId,
		this.soundList = new Map(),
		this.path = path;
	}

	async downloadSounds() {
		this.soundList = await Azure.downloadAllBlobs(this.guildId, this.path);
	}
}