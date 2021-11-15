import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, GuildMember, TextChannel, Util, VoiceChannel } from 'discord.js';
import search from 'youtube-search';
import {GuildPlayer} from '../classes/GuildPlayer.js';
import {GuildQueue} from'../classes/GuildQueue.js';
import { AudioSourceYoutube } from '../classes/AudioSource.js';
import { globalVars } from '../classes/GlobalVars.js';

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

		// Check if phrase contains video id
		const regex = /\?v=([-_0-9A-Za-z]{11})/i;
		const videoId = phrase.match(regex);
		if (videoId) {
			// Replace phrase to only contain video id, whole url gives bad results
			phrase = videoId[1];
		}

		// Search youtube
		let video = null;
		const opts = {
			maxResults: 1,
			key: process.env.YOUTUBE_API_TOKEN,
			type: 'video',
		};

		const videos = await search(phrase.replace(/<(.+)>/g, '$1'), opts);
		video = videos.results[0];

		if (!video) {
			message = '❌ No results!';
			await interaction.reply({ content: message, ephemeral: true });
			console.log(`Guild ${guildId}: ${message}`);
			return;
		}

		// Add to queue
		const audio = new AudioSourceYoutube(video.id, Util.escapeMarkdown(video.title), video.link);
		let guildQueue = globalVars.globalQueue.get(member.guild.id);
		if (guildQueue) {
			guildQueue.audioSources.push(audio);
			message = `☑️ **${audio.title}** has been added to the queue`;
			await interaction.reply(message);
			console.log(`Guild ${guildId}: ${message}`);
			return;
		}

		// Join VC
		try {
			// Create queue if doesn't exist
			guildQueue = new GuildQueue((interaction.channel as TextChannel), voiceChannel);
			globalVars.globalQueue.set(guildId, guildQueue);
			guildQueue.audioSources.push(audio);
			// Call player function
			GuildPlayer.playAudio(interaction, guildQueue);
		}
		catch (error) {
			message = `I could not join the voice channel: ${error}`;
			console.error(`Guild ${guildId}: ${message}`);
			globalVars.globalQueue.delete(guildId);
			await interaction.reply(message);
			return;
		}
	},
};
