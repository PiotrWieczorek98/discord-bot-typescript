import { AudioResource, createAudioResource, StreamType } from '@discordjs/voice';
import { CommandInteraction, GuildMember, Message, TextChannel } from 'discord.js';
import { globalVars } from './GlobalVars';
import { IAudioSourceMetadata } from '../interfaces/IAudioSourceMetadata';
import { AudioSource } from './AudioSource';

/**
 * Class used to distinguish audio source
 */
export class AudioSourceLocal extends AudioSource {
	static async createSource(interaction: CommandInteraction, search: string){
		const meta = await this.searchLocalFiles(interaction, search);
		if(meta == undefined){
			return undefined;
		}

		const newInstance = new AudioSourceLocal(meta);
		try{
			newInstance.resource = createAudioResource(meta.path, {
				inputType: StreamType.Arbitrary,
				// Cant use inline volume as it bugs the audio player
				inlineVolume: false 
			});
			//newInstance.resource.volume!.setVolume(1);
		}
		catch(error){
			console.error((error as Error).message);
			newInstance.resource = undefined;
		}
		return newInstance;
	}

	static async searchLocalFiles(interaction: CommandInteraction, search: string) {
		let message: string;
		const guildId = interaction.guildId!;
		const textChannel = interaction.channel as TextChannel;
		const member = (interaction.member as GuildMember);
		
		// Get the sound
		const guildLocalAudioFiles = globalVars.guildsLocalAudioFiles.get(guildId);
		const soundName = guildLocalAudioFiles?.soundList.get(parseInt(search));

		// Handle undefined
		if(soundName == undefined){
			message = '❌ Sike! That\'s a wrooong number! 🔥';
			const handle = await textChannel.send(message);
			// Delete message after 2 seconds
			setTimeout((messageHandle: Message) => { messageHandle.delete() }, 2000, handle);
			return undefined;
		}
	
		// Create new audio source
		let fullPath = `${__dirname}/../${globalVars.paths.SOUNDS}/${member.guild.id}/${soundName}`;
		const metadata: IAudioSourceMetadata = {
			title: soundName || 'undefined',
			path: fullPath,
			description: '...',
			thumbnail: 'https://i.imgur.com/5h0eb09.gif',
		}
	
		return metadata;
	}
}
