import { SlashCommandBuilder } from '@discordjs/builders';
import {GuildPlayer} from '../classes/GuildPlayer.js';
import { AudioSourceLocal } from '../classes/AudioSource.js';
import {GuildQueue} from '../classes/GuildQueue.js';
import { CommandInteraction, GuildMember, TextChannel, VoiceChannel } from 'discord.js';
import { globalVars } from '../classes/GlobalVars.js';
import path from 'path';

// --------------------------------------------------------------------
// Plays sound from sound list in voice chat or adds to queue
// --------------------------------------------------------------------

module.exports = {
	data: new SlashCommandBuilder()
		.setName('sound')
		.setDescription('Play sound from the list')
		.addIntegerOption(option => option
			.setName('number')
			.setDescription('Number from the list')
			.setRequired(true)),
	/**
	 * @param interaction
	 */
	async execute(interaction: CommandInteraction) {
		const number = interaction.options.getInteger('number')!;
		const guildId = interaction.guildId!;
		let message: string;
		const member = (interaction.member as GuildMember);

		// Check for abnormalities
		const voiceChannel = (member.voice.channel as VoiceChannel);
		if (!voiceChannel) {
			message = 'Join voice channel first.';
			await interaction.reply({ content: message, ephemeral: true });
			console.log(`Guild ${guildId}: ${message}`);
			return;
		}
		const clientMember = interaction.guild?.members.cache.get(interaction.client.user!.id)!;
		const permissions = voiceChannel.permissionsFor(clientMember)!;
		if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
			message = '❌ Not sufficient permissions!';
			await interaction.reply({ content: message, ephemeral: true });
			console.log(`Guild ${guildId}: ${message}`);
			return;
		}

		// Get Guild's sound list
		const soundList = globalVars.globalSoundList.get(guildId)!.soundList;
		if (!soundList) {
			message = '❌ Error while getting guild\'s sound list!';
			await interaction.reply({ content: message, ephemeral: true });
			console.log(`Guild ${guildId}: ${message}`);
		}

		// Get the sound
		const soundName = soundList.get(number);
		let guildQueue = globalVars.globalQueue.get(member.guild.id);

		if (!soundName) {
			message = '❌ Sike! That\'s a wrooong number! 🔥';
			await interaction.reply({ content: message, ephemeral: true });
			console.log(`Guild ${guildId}: ${message}`);
			return;
		}

		// Add to queue
		let dir = path.resolve(__dirname, '..', globalVars.paths.SOUNDS);
		const fullPath = `${dir}/${member.guild.id}/${soundName}`;
		const audio = new AudioSourceLocal(fullPath, soundName);
		if (guildQueue) {
			guildQueue.audioSources.push(audio);
			message = `☑️ **${soundName}** has been added to the queue`;
			await interaction.reply(message);
			console.log(`Guild ${guildId}: ${message}`);
			return;
		}

		// Join VC
		try {
			// Create queue if doesn't exist
			guildQueue = new GuildQueue((interaction.channel as TextChannel), voiceChannel);
			globalVars.globalQueue.set(guildId, guildQueue);
			guildQueue.audioSources.push(audio);
			GuildPlayer.playAudio(interaction, guildQueue);
		}
		catch (error) {
			globalVars.globalQueue.delete(guildId);
			message = `❌I could not join the voice channel: ${error}`;
			await interaction.reply({ content: message, ephemeral: true });
			console.error(`Guild ${guildId}: ${message}`);
			return;
		}

	},
};
