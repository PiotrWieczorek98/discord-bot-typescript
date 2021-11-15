import { CommandInteraction, Interaction, MessageEmbed } from 'discord.js';
import { GuildQueue } from './GuildQueue';
import { AudioPlayer, AudioPlayerStatus, AudioResource } from '@discordjs/voice';
import { globalVars } from './GlobalVars';
import { response } from 'express';
import { IAudioSource } from 'IAudioSource';

/**
 * Class responsible for audio player functions in voice channels
 */
export class GuildPlayer {
	
	static async playAudio(audioPlayer: AudioPlayer, source: IAudioSource, interaction: CommandInteraction, guildQueue: GuildQueue){
		const result = await source.getResource();
		let message: string;
		if (result.message == 'error') {
			message = '❌Error caused by youtube API! (Probably age-restricted)... Try again.';
			interaction.reply(message);
			this.playNextResource(interaction, guildQueue, audioPlayer);
			return;
		}

		audioPlayer.play(result.resource);
		// guildQueue.connection.rejoin({ selfDeaf: false });

		const messageEmbed = new MessageEmbed()
		.setColor('#FF0000')
		.setTitle(`🔊 ${source.title}`)
		.setDescription(source.description)
		.setThumbnail(source.thumbnail)
		.setTimestamp()
		.setFooter('','https://i.imgur.com/L8gH1y8.png');

		message = `🔊 Playing: **${source.title}**`;
		try{
			await interaction.reply({embeds: [messageEmbed]});
		}
		catch(error){
			await guildQueue.textChannel.send({embeds: [messageEmbed]});
		}
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
			this.playAudio(audioPlayer, newSource, interaction, guildQueue);
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
	static async startPlayer(interaction: CommandInteraction, guildQueue: GuildQueue) {
		const source = guildQueue.audioSources[0];
		const audioPlayer = guildQueue.player;

		if (!source) {
			guildQueue.player.stop();
			globalVars.globalQueue.delete(interaction.guild!.id);
			return;
		}
		guildQueue.connection.subscribe(audioPlayer);
		this.playAudio(audioPlayer,source,interaction, guildQueue);
	}
}