import { SlashCommandBuilder } from '@discordjs/builders';
import {GuildPlayer} from '../classes/GuildPlayer.js';
import { CommandInteraction, GuildMember, Message, TextChannel, VoiceChannel } from 'discord.js';
import { globalVars } from '../classes/GlobalVars.js';
import path from 'path';
import { IAudioSourceMetadata } from '../interfaces/IAudioSourceMetadata';
import { AudioSourceLocal } from '../classes/AudioSourceLocal';
import { handleUndefined } from '../functions/handleUndefined';
import { wait } from '../functions/wait.js';

// --------------------------------------------------------------------
// Plays sound from sound list in voice chat or adds to queue
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sound')
		.setDescription('Play sound from the list')
		.addIntegerOption(option => option
			.setName('number')
			.setDescription('Number from the list')
			.setRequired(true)),
	/**
	 * @param interaction
	 */
	async execute(interaction: CommandInteraction) {
		const number = interaction.options.getInteger('number')!;

		const guildId = interaction.guildId!;
		const textChannel = interaction.channel as TextChannel;
		const member = (interaction.member as GuildMember);
		let message: string;


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

		// Get Guild's sound list
		const guildSoundList = globalVars.guildsLocalAudioFiles.get(guildId);
		message = '❌ Error while getting guild\'s sound list!';
		if(handleUndefined(guildSoundList, message, textChannel)) return;


		// Get the sound
		const soundName = guildSoundList!.soundList.get(number);
		message = '❌ Sike! That\'s a wrooong number! 🔥';
		if(handleUndefined(soundName, message, textChannel)) return;


		// Create new audio source
		let dir = path.resolve(__dirname, '..', globalVars.paths.SOUNDS);
		let fullPath = `${dir}/${member.guild.id}/${soundName}`;
		fullPath = path.normalize(fullPath);
		const meta: IAudioSourceMetadata = {
			title: soundName!,
			path: fullPath,
			description: '...',
			thumbnail: 'https://i1.sndcdn.com/artworks-000566136428-kdrjs4-t240x240.jpg',
		}
		
		// Check if resource was created successfully
		const audioSource = await AudioSourceLocal.create(meta);
		message = '❌ Error while creating resource!';
		if(handleUndefined(audioSource.resource, message, textChannel)) return;

		// Check players
		let guildPlayer = globalVars.guildsPlayers.get(member.guild.id);
		// Create player if doesn't exist
		if(guildPlayer == undefined){
			message = `Initializing player...`;
			await interaction.editReply(message);
			console.log(`Guild ${guildId}: ${message}`);
			
			await GuildPlayer.createGuildPlayer(interaction, audioSource);	
		}
		else {
			// Delete reply
			const reply = await interaction.fetchReply() as Message;
			await reply.delete();
			
			guildPlayer.addToQueue(audioSource);
		}
	},
};
