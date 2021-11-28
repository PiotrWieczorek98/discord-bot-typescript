import { SlashCommandBuilder } from '@discordjs/builders';
import { createAudioPlayer, createAudioResource, EndBehaviorType, entersState, joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import { CommandInteraction, GuildMember, VoiceChannel } from 'discord.js';

import { OpusEncoder } from '@discordjs/opus';
//import { opus } from 'prism-media';
import internal, { Transform } from 'stream';

// --------------------------------------------------------------------
// WORK IN PROGRESS
// --------------------------------------------------------------------

async function start(interation: CommandInteraction){
    let member = interation.member as GuildMember;
    const voiceChannel = member.voice.channel as VoiceChannel;
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        selfDeaf: false,
        selfMute: false,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
    try{
        await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
		if (connection) {	    
            const receiver = connection.receiver;

			const encoder = new OpusEncoder(16000, 1)
			
			const commandAudioStream = receiver.subscribe(member.id, {
				end: {
				  behavior: EndBehaviorType.AfterSilence,
				  duration: 100,
				},
			})
			.pipe(new OpusDecodingStream({}, encoder))

			const audioPlayer = createAudioPlayer();
			connection.subscribe(audioPlayer);
			const resource = createAudioResource(commandAudioStream);
			audioPlayer.play(resource);
        }

	} catch (error) {
		console.warn(error);
	}
}

class OpusDecodingStream extends Transform {
    encoder

    constructor(options: internal.TransformOptions, encoder: OpusEncoder) {
        super(options);
        this.encoder = encoder;
    }

    _transform(data: Buffer, encoding: BufferEncoding, callback: Function) {
        this.push(this.encoder.decode(data));
        callback();
    }
}

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
		interaction.reply({content: 'work in progress', ephemeral: true});
		start(interaction);

	},
};
