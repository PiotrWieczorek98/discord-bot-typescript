import { AudioResource } from "@discordjs/voice";
import { IAudioSourceMetadata } from "./IAudioSourceMetadata";

export enum SourceType {
    Youtube,
    Local,
}

export interface IAudioSource{
    sourceType: SourceType;
    metadata: IAudioSourceMetadata;
    resource: AudioResource<unknown> | undefined;
}