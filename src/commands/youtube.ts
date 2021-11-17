import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, GuildMember, Message, MessageReaction, Snowflake, TextChannel, User, Util, VoiceChannel } from 'discord.js';
import {GuildQueue} from'../classes/GuildQueue';
import { AudioSourceYoutube } from '../classes/AudioSource';
import { globalVars } from '../classes/GlobalVars';
import { GuildPlayer } from '../classes/GuildPlayer';
import youtubeSearch from 'yt-search';

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
		let searchPhrase = interaction.options.getString('phrase')!;
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
		let video: youtubeSearch.VideoMetadataResult;
		// Check if search phrase contains video id for direct search
		const regex = /\?v=([-_0-9A-Za-z]{11})/i;
		let regexResult = searchPhrase.match(regex);
		if (regexResult) {
			// Replace phrase to only contain video id, whole url gives bad results
			video = await youtubeSearch( { videoId: regexResult[1] } );
		}
		else{
			const vidId = (await youtubeSearch( searchPhrase )).videos[0].videoId;
			video = await youtubeSearch( { videoId: vidId } );

		}		

		// Create Audio Source
		const audio = new AudioSourceYoutube(video.title, 
		video.url, video.description, video.thumbnail);

		// Check if guild's queue exists
		// Insert if queue exist, create queue if it doesn't
		let guildQueue = globalVars.globalQueue.get(member.guild.id);
		if (guildQueue) {
			guildQueue.audioSources.push(audio);
			message = `☑️ **${audio.title}** has been added to the queue`;
			await interaction.reply(message);
			console.log(`Guild ${guildId}: ${message}`);

			// Get messaage object to await reactions
			const messageObject = await interaction.fetchReply() as Message;
			messageObject.react('⏯️');
			messageObject.react('⏹️');
			const filter = (reaction: MessageReaction) => {
				return reaction.emoji.name === '⏹️';
			};
			messageObject.awaitReactions({filter, time:600})
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
