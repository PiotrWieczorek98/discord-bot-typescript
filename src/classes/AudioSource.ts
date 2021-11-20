import { AudioResource } from "@discordjs/voice";
import { CommandInteraction } from "discord.js";
import { IAudioSourceMetadata } from "../interfaces/IAudioSourceMetadata";

export abstract class AudioSource{
    metadata: IAudioSourceMetadata;
    resource: AudioResource<unknown> | undefined;

    protected constructor(meta: IAudioSourceMetadata){
        this.metadata = meta;
    }

    static createSource(interaction: CommandInteraction, search: string){}
}