import { CommandInteraction, Interaction } from 'discord.js';
import { GuildQueue } from './GuildQueue';
import { AudioPlayer, AudioPlayerStatus, AudioResource } from '@discordjs/voice';
import { globalVars } from './GlobalVars';
import { response } from 'express';

/**
 * Class responsible for audio player functions in voice channels
 */
export class GuildPlayer {
	/**
	 * Get next audio in queue
	 * @param interaction
	 * @param guildQueue
	 * @param audioPlayer
	 */
	static async playNextResource(interaction: CommandInteraction, guildQueue: GuildQueue, audioPlayer: AudioPlayer) {
		let message: string;
		if (guildQueue.audioSources.length > 1) {
			guildQueue.audioSources.shift();
			const newSource = guildQueue.audioSources[0];

			const result = await newSource.getResource();
			const resource = result.resource;

			if (result.message == 'error') {
				message = 'Error caused by youtube API! (Probably age-restricted)... Try again.';
				interaction.reply(message);
				this.playNextResource(interaction, guildQueue, audioPlayer);
				return;
			}
			audioPlayer.play(resource);

			message = `🔊 Playing: **${newSource.title}**`;
			guildQueue.textChannel.send(message);
			console.log(message);
		}
		else {
			// Delete the queue
			globalVars.globalQueue.delete(interaction.guild!.id);
			audioPlayer.stop();
		}
	}

	/**
     * Play audio from youtube video
     * @param interaction
     * @param guildQueue
     */
	static async playAudio(interaction: CommandInteraction, guildQueue: GuildQueue) {
		let message: string;
		const source = guildQueue.audioSources[0];
		const audioPlayer = guildQueue.player;

		if (!source) {
			guildQueue.player.stop();
			globalVars.globalQueue.delete(interaction.guild!.id);
			return;
		}

		const result = await source.getResource();
		const resource = result.resource;

		if (result.message == 'error') {
			message = '❌Error caused by youtube API! (Probably age-restricted)... Try again.';
			interaction.reply(message);
			this.playNextResource(interaction, guildQueue, audioPlayer);
			return;
		}
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