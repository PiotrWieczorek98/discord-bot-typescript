import {GuildSoundList} from '../classes/GuildSoundList.js';
import * as fs from 'fs';
import {Azure} from '../classes/Azure';
import {GuildDataManager} from '../classes/GuildDataManager';
import { betsLeagueOfLegends } from '../classes/BetsLeagueOfLegends.js';
import { Client } from 'discord.js';
import { globalVars } from '../classes/GlobalVars.js';
import path from 'path';

// --------------------------------------------------------------------
// Run once bot is ready
// --------------------------------------------------------------------
module.exports = {
	name: 'ready',
	once: true,
	/**
     * Run once bot is ready
     * @param client
     */
	execute(client: Client) {
		client.user!.setActivity('Loading...');
		globalVars.attachClient(client);
		(async () => {
			// ---------------------------------------------------------
			// Download Sounds from Azure
			// ---------------------------------------------------------
			console.log('\nGetting guilds\' sounds from container...');
			// Check directories
			let dir = path.resolve(__dirname,'..', globalVars.paths.SOUNDS);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir);
			}
			// Check containers for every guild
			const containers = await Azure.listContainers();
			for (const entry of client.guilds.cache) {
				const guild = entry[1];
				console.log(`\nGuild's ${guild.id} sounds:`);

				// Create one if didn't find
				if (!containers!.includes(guild.id)) {
					(async () => {
						await Azure.createContainer(guild.id);
					})();
				}

				// Download all sounds
				const path = `${dir}/${guild.id}`;
				if (!fs.existsSync(path)) {
					fs.mkdirSync(path);
				}

				const guildSoundList = new GuildSoundList(guild.id, path);
				await guildSoundList.downloadSounds();

				globalVars.globalSoundList.set(guild.id, guildSoundList);
			}

			// ------------------------------------------------------------
			// Download guilds' data
			// -------------------------------------------------------------
			console.log('\nGetting guilds\' data from container...');
			// Check directory
			dir = path.resolve(__dirname, '..', globalVars.paths.DATA);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir);
			}

			// Check container
			if (!containers!.includes(globalVars.vars.CONTAINER_DATA)) {
				console.log('\nCreating containers...');
				await Azure.createContainer(globalVars.vars.CONTAINER_DATA);
			}

			// Download files
			console.log('\nDownloading files...');
			const filesMap = await Azure.downloadAllBlobs(globalVars.vars.CONTAINER_DATA, dir, true);
			const files = [... filesMap.values()];

			// Load sound channels data
			let fileName = globalVars.vars.FILE_SOUNDS_CHANNEL;
			let filePath = `${dir}/${fileName}`;
			let guilds: Map<string, string>;
			if (files.includes(fileName)) {
				guilds = await GuildDataManager.readMapFromFile(filePath);
				guilds.forEach((value, key) => {
					globalVars.soundsChannel.set(key, value);
				});
			}
			else {
				// Prepare data and upload
				guilds = new Map();
				client.guilds.cache.forEach((guild) => {
					guilds.set(guild.id, 'null');
					globalVars.soundsChannel.set(guild.id, 'null');
				});
				await GuildDataManager.writeMapToFile(guilds, filePath);
				await Azure.uploadBlob(globalVars.vars.CONTAINER_DATA, filePath);
			}

			// DELETE THIS IF YOU FORKED THIS REPO
			// Load League betting data

			fileName = globalVars.vars.FILE_GAMBLERS;
			filePath = `${dir}/${fileName}`;
			let gamblers: Map<string, number>;
			if (files.includes(fileName)) {
				gamblers = await GuildDataManager.readMapFromFile(filePath);
				gamblers.forEach((value, key) => {
					betsLeagueOfLegends.gamblers.set(key, value);
				});
			}
			else {
				// Prepare empty data and upload
				gamblers = new Map();
				await GuildDataManager.writeMapToFile(gamblers, filePath);
				await Azure.uploadBlob(globalVars.vars.CONTAINER_DATA, filePath);
			}

			console.log('Guilds\' data loaded\n');

			// ------------------------------------------------------------
			console.log(`
            ⡿⠋⠄⣀⣀⣤⣴⣶⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⣌⠻⣿⣿
            ⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⠹⣿
            ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⠹
            ⣿⣿⡟⢹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡛⢿⣿⣿⣿⣮⠛⣿⣿⣿⣿⣿⣿⡆
            ⡟⢻⡇⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣣⠄⡀⢬⣭⣻⣷⡌⢿⣿⣿⣿⣿⣿
            ⠃⣸⡀⠈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⠈⣆⢹⣿⣿⣿⡈⢿⣿⣿⣿⣿
            ⠄⢻⡇⠄⢛⣛⣻⣿⣿⣿⣿⣿⣿⣿⣿⡆⠹⣿⣆⠸⣆⠙⠛⠛⠃⠘⣿⣿⣿⣿
            ⠄⠸⣡⠄⡈⣿⣿⣿⣿⣿⣿⣿⣿⠿⠟⠁⣠⣉⣤⣴⣿⣿⠿⠿⠿⡇⢸⣿⣿⣿
            ⠄⡄⢿⣆⠰⡘⢿⣿⠿⢛⣉⣥⣴⣶⣿⣿⣿⣿⣻⠟⣉⣤⣶⣶⣾⣿⡄⣿⡿⢸
            ⠄⢰⠸⣿⠄⢳⣠⣤⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⣼⣿⣿⣿⣿⣿⣿⡇⢻⡇⢸
            ⢷⡈⢣⣡⣶⠿⠟⠛⠓⣚⣻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣇⢸⠇⠘
            ⡀⣌⠄⠻⣧⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿⡿⠟⠛⠛⠛⢿⣿⣿⣿⣿⣿⡟⠘⠄⠄
            ⣷⡘⣷⡀⠘⣿⣿⣿⣿⣿⣿⣿⣿⡋⢀⣠⣤⣶⣶⣾⡆⣿⣿⣿⠟⠁⠄⠄⠄⠄
            ⣿⣷⡘⣿⡀⢻⣿⣿⣿⣿⣿⣿⣿⣧⠸⣿⣿⣿⣿⣿⣷⡿⠟⠉⠄⠄⠄⠄⡄⢀
            ⣿⣿⣷⡈⢷⡀⠙⠛⠻⠿⠿⠿⠿⠿⠷⠾⠿⠟⣛⣋⣥⣶⣄⠄⢀⣄⠹⣦⢹⣿
                        BOT IS READY!`);
			client.user!.setActivity('Dick Size Contest', { type: 'COMPETING' });

		})();
	},
};