import { AudioResource } from "@discordjs/voice";

export interface IAudioSource{
    title: string;
    getResource(): Promise<AudioResource>;
}