import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, GuildMember, TextChannel, Util, VoiceChannel } from 'discord.js';
import {GuildQueue} from'../classes/GuildQueue.js';
import { AudioSourceYoutube } from '../classes/AudioSource.js';
import { globalVars } from '../classes/GlobalVars.js';
import youtubeSearch from "youtube-search";
import { GuildPlayer } from 'GuildPlayer.js';

// --------------------------------------------------------------------
// Plays sound from youtube in voice chat or adds to queue
// --------------------------------------------------------------------

/**
 * @todo add option to play in specified channel
 */
module.exports = {
	data: new SlashCommandBuilder()
		.setName('youtube')
		.setDescription('Play youtube video')
		.addStringOption(option => option
			.setName('phrase')
			.setDescription('Phrase to search or link')
			.setRequired(true)),
	/**
	 * @param interaction
	 */
	async execute(interaction: CommandInteraction) {
		// Search parameter
		let phrase = interaction.options.getString('phrase')!;
		const guildId = interaction.guildId!;
		let message: string;
		const member = (interaction.member as GuildMember);

		// Check for abnormalities
		const voiceChannel = (member.voice.channel as VoiceChannel);
		if (!voiceChannel) {
			message = 'Join voice channel first.';
			await interaction.reply({ content: message, ephemeral: true });
			console.log(`Guild ${guildId}: ${message}`);
			return;
		}
		const clientMember = interaction.guild?.members.cache.get(interaction.client.user!.id)!;
		const permissions = voiceChannel.permissionsFor(clientMember)!;
		if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
			message = '❌ Not sufficient permissions!';
			await interaction.reply({ content: message, ephemeral: true });
			console.log(`Guild ${guildId}: ${message}`);
			return;
		}
	
		// Search youtube
		let video: youtubeSearch.YouTubeSearchResults;
		const opts:youtubeSearch.YouTubeSearchOptions = {
			maxResults: 1,
			key: process.env['YOUTUBE_API_TOKEN']!,
			type: 'video',
		};

		const videos = await youtubeSearch('jsconf', opts,(err)=>{
			if(err) return console.error(err);
		});
		video = videos.results[0];
		if (!video) {
			message = '❌ No results!';
			await interaction.reply({ content: message, ephemeral: true });
			console.log(`Guild ${guildId}: ${message}`);
			return;
		}

		// Check if search phrase contains video id
		// Sometimes Youtube will give a wrong result if you search with video ID
		// so I had to alter given result url with passed ID
		const regex = /\?v=([-_0-9A-Za-z]{11})/i;
		const videoId = phrase.match(regex);
		if (videoId) {
			// Replace phrase to only contain video id, whole url gives bad results
			video.link = `https://www.youtube.com/watch?v=${videoId[1]}`;
		}

		// Create Audio Source
		const audio = new AudioSourceYoutube(video.id, video.title, 
		video.link, video.description, video.thumbnails.default!.url);

		// Check if guild's queue exists
		// Insert if queue exist, create queue if it doesn't
		let guildQueue = globalVars.globalQueue.get(member.guild.id);
		if (guildQueue) {
			guildQueue.audioSources.push(audio);
			message = `☑️ **${audio.title}** has been added to the queue`;
			await interaction.reply(message);
			console.log(`Guild ${guildId}: ${message}`);
		}
		// Create queue if doesn't exist
		else{
			try {
				guildQueue = new GuildQueue((interaction.channel as TextChannel), voiceChannel);
				globalVars.globalQueue.set(guildId, guildQueue);
				guildQueue.audioSources.push(audio);
				// Call player function
				GuildPlayer.startPlayer(interaction, guildQueue);
			}
			catch (error) {
				message = `I could not join the voice channel: ${error}`;
				console.error(`Guild ${guildId}: ${message}`);
				globalVars.globalQueue.delete(guildId);
				await interaction.reply(message);
			}
		}
	},
};
