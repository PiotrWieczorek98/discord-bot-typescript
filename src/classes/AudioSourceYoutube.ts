import { createAudioResource } from '@discordjs/voice';
import { IAudioSourceMetadata } from '../interfaces/IAudioSourceMetadata';
import * as playDl from 'play-dl';
import { AudioSource } from './AudioSource';
import { CommandInteraction } from 'discord.js';
import YouTube, { Video } from 'youtube-sr';

/**
 * Class used to distinguish audio source
 */
export class AudioSourceYoutube extends AudioSource {

	static async createSource(interaction: CommandInteraction, search: string){

		const meta = await this.searchYoutube(search);
		if(meta == undefined){
			return undefined;
		}

		const newInstance = new AudioSourceYoutube(meta);
		let ytStream: playDl.YouTubeStream;
		try{
			ytStream = await playDl.stream(newInstance.metadata.path) as playDl.YouTubeStream;
			newInstance.resource = createAudioResource(ytStream.stream, { 
				inputType : ytStream.type, 
				inlineVolume: true 
			});
			newInstance.resource.volume!.setVolume(0.2);
		}
		catch(error){
			console.error((error as Error).message);
			newInstance.resource = undefined;
		}
		return newInstance;
	}

	static async searchYoutube(search:string) {
	
		// Search youtube
		let video: Video;
		const regex = /\?v=([-_0-9A-Za-z]{11})/i;
		let regexResult = search.match(regex);
		if (regexResult) {
			const url = `https://www.youtube.com/watch${regexResult[0]}`;
			video = await YouTube.getVideo(url);
		}
		else{
			video = await YouTube.searchOne(search);
	
		}		
	
		// Create Audio Source
		const placeholder = '-placeholder-';
		const metadata: IAudioSourceMetadata = {
			title: video.title ||  placeholder,
			path: video.url,
			description: video.description || placeholder,
			thumbnail: 'https://i.imgur.com/PzzeprQ.gif' || placeholder,
		};
	
		return metadata;
	}
}
