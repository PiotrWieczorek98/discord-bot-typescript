import { AudioResource, createAudioResource, StreamType } from '@discordjs/voice';
import { IAudioSourceMetadata } from '../interfaces/IAudioSourceMetadata';
import { IAudioSource, SourceType } from '../interfaces/IAudioSource';

/**
 * Class used to distinguish audio source
 */
export class AudioSourceLocal implements IAudioSource {
	sourceType: SourceType;
	resource: AudioResource<unknown> | undefined;
	metadata: IAudioSourceMetadata;

	private constructor(meta: IAudioSourceMetadata) {
		this.metadata = meta
		this.sourceType = SourceType.Local;
	}

	static async create(meta: IAudioSourceMetadata){
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
}
