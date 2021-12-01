import { AudioResource } from "@discordjs/voice";
import { CommandInteraction } from "discord.js";

export interface IAudioSourceMetadata{
    title: string;
    description: string;
	thumbnail: string;
    path: string;
    duration?: number;
}

export abstract class AudioSource{
    metadata: IAudioSourceMetadata;
    resource: AudioResource<unknown> | undefined;

    protected constructor(meta: IAudioSourceMetadata){
        this.metadata = meta;
    }

    static createSource(interaction: CommandInteraction, search: string){}
}