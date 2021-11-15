import { AudioSourceYoutube, AudioSourceLocal } from './AudioSource';
import { CommandInteraction, Interaction, MessageComponentInteraction } from 'discord.js';
import { GuildQueue } from './GuildQueue';
import { AudioPlayer, AudioPlayerStatus, AudioResource } from '@discordjs/voice';
import { globalVars } from './GlobalVars';

/**
 * Class responsible for audio player functions in voice channels
 */
export class GuildPlayer {
	/**
	 * Get next audio in queue
	 * @param interaction
	 * @param guildQueue
	 * @param discordPlayer
	 */
	static async playNextResource(interaction: Interaction, guildQueue: GuildQueue, discordPlayer: AudioPlayer) {
		if (guildQueue.audioSources.length > 1) {
			guildQueue.audioSources.shift();
			const newSource = guildQueue.audioSources[0];
			let resource: AudioResource;
			let message: string;
			try {
				resource = await newSource.getResource();
			}
			catch (er) {
				console.error(er);
				message = 'Error caused by play-dl library! Try again.';
				guildQueue.textChannel.send(message);
				return;
			}
			discordPlayer.play(resource);

			message = `🔊 Playing: **${newSource.title}**`;
			guildQueue.textChannel.send(message);
			console.log(message);
		}
		else {
			// Delete the queue
			globalVars.globalQueue.delete(interaction.guild!.id);
			discordPlayer.stop();
		}
	}

	/**
     * Play audio from youtube video
     * @param interaction
     * @param guildQueue
     */
	static async playAudio(interaction: CommandInteraction, guildQueue: GuildQueue) {
		const source = guildQueue.audioSources[0];
		let resource: AudioResource;
		let message: string;

		if (!source) {
			guildQueue.player.stop();
			globalVars.globalQueue.delete(interaction.guild!.id);
			return;
		}

		try {
			resource = await source.getResource();
		}
		catch (er) {
			console.error(er);
			message = 'Error caused by play-dl library! Try again.';
			guildQueue.textChannel.send(message);
			return;
		}
		const audioPlayer = guildQueue.player;
		guildQueue.connection.subscribe(audioPlayer);
		audioPlayer.play(resource);
		// guildQueue.connection.rejoin({ selfDeaf: false });

		message = `🔊 Playing: **${source.title}**`;
		await interaction.reply(message);
		console.log(message);

		audioPlayer.on('error', error => {
			console.error(error);
		});

		// After finish play next audio from queue
		audioPlayer.on(AudioPlayerStatus.Idle, async () => {
			if (guildQueue) {
				await this.playNextResource(interaction, guildQueue, audioPlayer);
			}
		});

		// Handle error
		audioPlayer.on('error', error => {
			console.error(`Error: ${error.message} with resource ${error.resource.metadata}`);
			this.playNextResource(interaction, guildQueue, audioPlayer);
		});
	}
}