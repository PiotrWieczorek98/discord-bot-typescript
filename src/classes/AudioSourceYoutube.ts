import { createAudioResource } from '@discordjs/voice';
import * as playDl from 'play-dl';
import { AudioSource, IAudioSourceMetadata } from './AudioSource';
import { CommandInteraction } from 'discord.js';
import { Youtube, YouTubeSearchResults } from './Youtube';

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

	/**
	 * Search videos through Youtube API
	 * @param search 
	 * @returns 
	 */
	static async searchYoutube(search:string) {
		let videos: YouTubeSearchResults[] | undefined;
		const regex = /\?v=([-_0-9A-Za-z]{11})/i;
		let regexResult = search.match(regex);
		if (regexResult) {
			console.log(`Video ID: ${regexResult[1]}`);
			const reply = await Youtube.searchById(regexResult[1]);
			videos = reply?.results;
		}
		else{
			const reply = await Youtube.searchByPhrase(search);
			videos = reply?.results;
		}		

		if(videos == undefined){
			return undefined;
		}
	
		// Create Audio Source from first result
		const video = videos[0];
		const placeholder = '-placeholder-';
		const metadata: IAudioSourceMetadata = {
			title: video.title ||  placeholder,
			path: video.link,
			description: video.description || placeholder,
			thumbnail: 'https://i.imgur.com/PzzeprQ.gif',
		};
	
		return metadata;
	}
}
