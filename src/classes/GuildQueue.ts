import { AudioPlayer, createAudioPlayer, DiscordGatewayAdapterCreator, joinVoiceChannel, VoiceConnection } from '@discordjs/voice';
import { TextChannel, VoiceChannel } from 'discord.js';
import { IAudioSource } from '../interfaces/IAudioSource';

/**
 * Class represents queue for audio player in voice chats.
 * Each guild has a seperate queue.
 */
export class GuildQueue {

	textChannel: TextChannel;
	voiceChannel:VoiceChannel;
	connection: VoiceConnection;
	player: AudioPlayer;
	audioSources: Array<IAudioSource>;

	/**
	 * Constructs GuildQueue object
	 * @param textChannel
	 * @param voiceChannel
	 */
	constructor(textChannel: TextChannel, voiceChannel:VoiceChannel) {
		this.textChannel = textChannel,
		this.voiceChannel = voiceChannel,
		this.connection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: voiceChannel.guild.id,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator,
		}),
		this.player = createAudioPlayer(),
		this.audioSources = [];
	}
}