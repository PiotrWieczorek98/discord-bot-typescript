import { SlashCommandBuilder } from "@discordjs/builders";
import { createAudioPlayer, createAudioResource, joinVoiceChannel, StreamType } from "@discordjs/voice";
import { CommandInteraction, GuildMember, VoiceChannel } from "discord.js";
import * as playDl from 'play-dl';

/**
 * Funciton to wait given amount of time to wait in ms
 * @param ms 
 * @returns 
 */
function wait(ms: number){
    return new Promise(res => setTimeout(res, ms));
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('test-player')
		.setDescription('Code for testing audioPlayer issue'),

	async execute(interaction: CommandInteraction) {

        interaction.reply('testing...');
        // Join voice channel
        const voiceChannel = (interaction.member as GuildMember).voice.channel as VoiceChannel;
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        // Resources from youtube
        const url = 'https://www.youtube.com/watch?v=tUlthCngK9U';
        const ytStream = await playDl.stream(url) as playDl.YouTubeStream;
        const ytStream2 = await playDl.stream(url) as playDl.YouTubeStream;
        const ytResource1 = createAudioResource(ytStream.stream, { 
            inputType : ytStream.type, 
            inlineVolume: true 
        });
        const ytResource2 = createAudioResource(ytStream2.stream, { 
            inputType : ytStream.type,
        });
        // Resources from local file
        const path = 'E:/Pobrane/test.mp3';
        const localResource1 = createAudioResource(path);
        const localResource2 = createAudioResource(path, {inlineVolume: true});
        const localResource3 = createAudioResource(path);

        // Testing player
        const player = createAudioPlayer();
        connection.subscribe(player);

        player.play(localResource1); // local source with inlineVolume=false working
        await wait(3000);
        player.play(localResource2); // local source with inlineVolume=true NOT working
        await wait(3000);
        player.play(ytResource1); // youtube source with inlineVolume=true working
        await wait(3000);
        player.play(ytResource2); // youtube source with inlineVolume=false working
        await wait(3000);
        player.play(localResource3); // again local source with inlineVolume=false working
        await wait(3000);
    }
}