import { AudioResource, createAudioResource } from '@discordjs/voice';
import { IAudioSourceMetadata } from '../interfaces/IAudioSourceMetadata';
import * as playDl from 'play-dl';
import { IAudioSource, SourceType } from '../interfaces/IAudioSource';

/**
 * Class used to distinguish audio source
 */
export class AudioSourceYoutube implements IAudioSource {
	sourceType: SourceType;
	resource: AudioResource<unknown> | undefined;
	metadata: IAudioSourceMetadata;

	private constructor(meta: IAudioSourceMetadata) {
		this.metadata = meta

		this.sourceType = SourceType.Youtube;
	}

	static async create(meta: IAudioSourceMetadata){
		const newInstance = new AudioSourceYoutube(meta);
		let ytStream: playDl.YouTubeStream;
		try{
			ytStream = await playDl.stream(newInstance.metadata.path) as playDl.YouTubeStream;
			newInstance.resource = createAudioResource(ytStream.stream, { 
				inputType : ytStream.type, 
				inlineVolume: true 
			});
			newInstance.resource.volume!.setVolume(0.1);
		}
		catch(error){
			console.error((error as Error).message);
			newInstance.resource = undefined;
		}
		return newInstance;
	}
}
