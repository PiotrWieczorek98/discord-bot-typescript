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
	private static _instance:GlobalVars;
	client!: Client;
    
	globalQueue: Map<string, GuildQueue>;
	globalSoundList: Map<string, GuildSoundList>;
	soundsChannel: Map<string, string>;
	commands: Collection<string, any>;
	
	paths: IPaths;
	vars: IVars;
	gambleConfig: IGambleConfig;

	private constructor(){
		this.globalQueue = new Map();
		this.globalSoundList = new Map();
		this.soundsChannel = new Map();
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
			COMMANDS: 'commands/',
			SOUNDS: 'sounds/',
			DATA: 'data/',
			EVENTS: 'events/',
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