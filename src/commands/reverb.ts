import { SlashCommandBuilder } from '@discordjs/builders';
import { joinVoiceChannel, EndBehaviorType } from '@discordjs/voice';
import { CommandInteraction, GuildMember } from 'discord.js';

import * as fs from 'fs';
import {opus} from 'prism-media';
import { pipeline } from 'stream';

// --------------------------------------------------------------------
// WORK IN PROGRESS
// --------------------------------------------------------------------

/**
 * @todo record and add effects to voice
 */
module.exports = {
	data: new SlashCommandBuilder()
		.setName('reverb')
		.setDescription('reverb test'),
	/**
	 * @param interaction
	 */
	async execute(interaction: CommandInteraction) {
		// const ffmpeg = require('ffmpeg');
		const member = (interaction.member as GuildMember);
		const channel = member.voice.channel!;

		const connection = joinVoiceChannel({
			channelId: channel.id,
			guildId: channel.guild.id,
			adapterCreator: channel.guild.voiceAdapterCreator,
		});

		const opusStream = connection.receiver.subscribe(member.id, {
			end: {
				behavior: EndBehaviorType.AfterSilence,
				duration: 100,
			},
		});
	},
};
