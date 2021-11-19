import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, GuildMember, Message, TextChannel, VoiceChannel } from 'discord.js';
import { AudioSourceYoutube } from '../classes/AudioSourceYoutube';
import { globalVars } from '../classes/GlobalVars';
import { GuildPlayer } from '../classes/GuildPlayer';
import YouTube, { Video } from 'youtube-sr';
import { IAudioSourceMetadata } from '../interfaces/IAudioSourceMetadata';
import { handleUndefined } from '../functions/handleUndefined';
import { wait } from '../functions/wait';

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

		let message: string;
		const guildId = interaction.guildId!;
		const textChannel = interaction.channel as TextChannel;
		const member = (interaction.member as GuildMember);

		// Check if guild's player exists
		let createNew = false;
		let guildPlayer = globalVars.guildPlayers.get(member.guild.id);

		// Set flag if player is initailized to avoid duplicates
		if(guildPlayer == undefined){
			globalVars.guildPlayers.set(member.guild.id, new String('placeholder'));	
			createNew = true;
		}

		message = `Processing...`;
		await interaction.reply(message);


		// Check for abnormalities
		const voiceChannel = (member.voice.channel as VoiceChannel);
		message = 'Join voice channel first.';
		if(handleUndefined(voiceChannel, message, textChannel)) return;

		const clientMember = interaction.guild?.members.cache.get(interaction.client.user!.id)!;
		const permissions = voiceChannel.permissionsFor(clientMember)!;
		message = '❌ Not sufficient permissions!';
		if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
			handleUndefined(undefined, message, textChannel);
			return;
		}
	
		// Search youtube
		let video: Video;
		const regex = /\?v=([-_0-9A-Za-z]{11})/i;
		let regexResult = searchPhrase.match(regex);
		if (regexResult) {
			const url = `https://www.youtube.com/watch${regexResult[0]}`;
			video = await YouTube.getVideo(url);
		}
		else{
			video = await YouTube.searchOne(searchPhrase);

		}		

		// Create Audio Source
		const placeholder = '-placeholder-';
		const metadata: IAudioSourceMetadata = {
			title: video.title ||  placeholder,
			path: video.url,
			description: video.description || placeholder,
			thumbnail: video.thumbnail?.url || placeholder,
		};

		// Check if resource was created successfully
		const audioSource = await AudioSourceYoutube.create(metadata);
		message = '❌ Error while creating resource!';
		if(handleUndefined(audioSource.resource, message, textChannel)) return;


		// Create player if doesn't exist
		if(createNew){
			message = `Initializing player...`;
			globalVars.guildPlayers.set(member.guild.id, new String('placeholder'));
			await interaction.editReply(message);
			console.log(`Guild ${guildId}: ${message}`);
			
			await GuildPlayer.createGuildPlayer(interaction, audioSource);	
		}
		else if (guildPlayer instanceof GuildPlayer) {
			// Delete reply
			const reply = await interaction.fetchReply() as Message;
			await reply.delete();
			
			guildPlayer.addToQueue(audioSource);
		}
		// Wait if player is being initialized
		else if(guildPlayer instanceof String){
			message = `waiting for player initialization...`;
			await interaction.editReply(message);
			console.log(`Guild ${guildId}: ${message}`);

			// Function to await player initialization
			const waitLoop = async ()=> {
				await wait(1000);
				// Check if player is now initialized
				const player = globalVars.guildPlayers.get(guildId);
				// repeat if not
				if(player instanceof String){
				await waitLoop();
				}
				// Add to queue if player is initialized
				else{
					const reply = await interaction.fetchReply() as Message;
					await reply.delete();
					player!.addToQueue(audioSource);
				}
			};
			await waitLoop();
		}
	},
};
