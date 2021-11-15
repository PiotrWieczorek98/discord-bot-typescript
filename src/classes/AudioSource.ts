import { AudioResource, createAudioResource, StreamType } from '@discordjs/voice';
import * as playDl from 'play-dl';
import { IAudioSource } from '../interfaces/IAudioSource';

/**
 * Class used to distinguish audio source
 */
export class AudioSourceLocal implements IAudioSource {
	path: string;
	title: string;
	
	constructor(path: string, title: string) {
		this.path = path,
		this.title = title;
	}

	async getResource(){
		let message: string;
		let resource: AudioResource;
		try{
			resource = createAudioResource(this.path, { inputType: StreamType.Arbitrary });
			message = 'success';
		}
		catch(error){
			console.error((error as Error).message);
			resource = createAudioResource(this.path, { inputType: StreamType.Arbitrary });
			message = 'error';
		}
		return {resource, message};
	}
}

/**
 * Class used to distinguish audio source
 */
export class AudioSourceYoutube implements IAudioSource {
	id: string;
	title: string;
	url: string;

	constructor(id: string, title: string, url: string) {
		this.id = id,
		this.title = title,
		this.url = url;
	}

	async getResource(){
		let resource: AudioResource;
		let ytStream: playDl.YouTubeStream;
		let message: string;
		try{
			ytStream = await playDl.stream(this.url) as playDl.YouTubeStream;
			message = 'success';
		}
		catch(error){
			ytStream = await playDl.stream('https://www.youtube.com/watch?v=JqXg20sm_i4') as playDl.YouTubeStream;
			console.error((error as Error).message);
			message = 'error';
		}
		
		resource = createAudioResource(ytStream.stream, { inputType : ytStream.type });

		return {resource, message};
	}
}
