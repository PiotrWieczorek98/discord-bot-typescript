import { Client, Collection } from 'discord.js';
import path from 'path/posix';
import { IGambleConfig } from '../interfaces/IGambleConfig';
import { IPaths } from '../interfaces/IPaths';
import { IVars } from '../interfaces/IVars';
import { GuildQueue } from './GuildQueue';
import { GuildSoundList } from './GuildSoundList';

/**
 * Singleton to keep all global variables in one place
 */
class GlobalVars {
	// Singleton instance
	private static _instance:GlobalVars;
	// Discord client - should be attached asap after creation
	client!: Client;
	// Contains queues for every guild
	globalQueue: Map<string, GuildQueue>;
	// Contains local audio files for every guild
	globalSoundList: Map<string, GuildSoundList>;
	// Text channels where automatic file upload to clound(Azure) happens
	autoUploadChannel: Map<string, string>;
	// Bot's commands
	commands: Collection<string, any>;
	
	paths: IPaths;
	vars: IVars;
	gambleConfig: IGambleConfig;

	private constructor(){
		this.globalQueue = new Map();
		this.globalSoundList = new Map();
		this.autoUploadChannel = new Map();
		this.commands = new Collection();


		this.vars = {
			HEROKU_APP: 'discord-js-boi-bot',
			HEROKU_DINO: 'web',
			CONTAINER_DATA: 'data',
			FILE_SOUNDS_CHANNEL: 'sounds-channel.json',
			FILE_GAMBLERS: 'gamblers.json',
			FILE_BETS: 'bets.csv',
		};

		this.paths = {
			COMMANDS: 'commands',
			SOUNDS: 'sounds',
			DATA: 'data',
			EVENTS: 'events',
		};

		this.gambleConfig = {
			initialCredits: 100,
			port: 3000,
			timeLimit: 60000,
			fileGamblersPath: `${this.paths.DATA}/${this.vars.FILE_GAMBLERS}`,
			fileHistoryPath: `${this.paths.DATA}/${this.vars.FILE_BETS}`,
		};
	};

	public attachClient(client: Client){
		this.client = client;
	}

	public static get Instance(){
		return this._instance || (this._instance = new this());
	};
}

const globalVars = GlobalVars.Instance;
export {globalVars};