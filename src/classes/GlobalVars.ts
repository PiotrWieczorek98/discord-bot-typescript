import { Client, Collection } from 'discord.js';
import { GuildPlayer } from '../classes/GuildPlayer';
import { GuildLocalAudioFiles } from './GuildLocalAudioFiles';

export interface IGambleConfig{
    initialCredits: number,
    port: string,
    timeLimit: number,
    fileGamblersPath: string,
    fileHistoryPath: string,
}

export interface IPaths{
    COMMANDS: string,
    SOUNDS: string,
    DATA: string,
    EVENTS: string,
}

export interface IVars{
    CONTAINER_DATA: string,
    FILE_SOUNDS_CHANNEL: string,
    FILE_GAMBLERS: string,
    FILE_BETS: string,
}

/**
 * Singleton to keep all global variables in one place
 */
class GlobalVars {
	// Singleton instance
	private static _instance:GlobalVars;
	// Discord client - should be attached asap after creation
	client!: Client;
	// Contains queues for every guild - string to signalize initialization
	//  maps <guildId, GuildPlayer>
	guildsPlayers: Map<string, GuildPlayer>;
	// Contains local audio files for every guild
	//  maps <guildId, GuildLocalAudioFiles>
	guildsLocalAudioFiles: Map<string, GuildLocalAudioFiles>;
	// Text channels where automatic file upload to clound(Azure) happens
	// maps <guildId, channelId>
	autoUploadChannel: Map<string, string>;
	// Bot's commands
	commands: Collection<string, any>;
	// Contains commands on cooldown
	// Set<guildId>
	guildsCommandsCooldown: Set<string>;
	
	paths: IPaths;
	vars: IVars;
	gambleConfig: IGambleConfig;

	private constructor(){
		this.guildsPlayers = new Map();
		this.guildsLocalAudioFiles = new Map();
		this.autoUploadChannel = new Map();
		this.guildsCommandsCooldown = new Set();
		this.commands = new Collection();


		this.vars = {
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
			port: '3000',
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