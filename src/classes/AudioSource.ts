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
		const resource = createAudioResource(this.path, { inputType: StreamType.Arbitrary });
		return resource;
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
		const stream = await playDl.stream(this.url);
		resource = createAudioResource(stream.stream, { inputType : stream.type });

		return resource;
	}
}
