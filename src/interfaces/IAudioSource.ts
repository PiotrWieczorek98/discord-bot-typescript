import { AudioResource } from "@discordjs/voice";

export interface IAudioSource{
    title: string;
    description: string;
	thumbnail: string;

    getResource():  Promise<{
        resource: AudioResource<unknown>;
        message: string;
    }>,
}