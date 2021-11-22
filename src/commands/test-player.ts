import { SlashCommandBuilder } from "@discordjs/builders";
import { createAudioPlayer, createAudioResource, joinVoiceChannel, StreamType } from "@discordjs/voice";
import { CommandInteraction, GuildMember, TextChannel, VoiceChannel } from "discord.js";

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

        await interaction.reply('testing...');
		const textChannel = interaction.channel as TextChannel;
        
        const mes = await textChannel.send('xd');
        console.log(mes);
        const mes2 = textChannel.messages.fetch(mes.id);
        console.log(mes2);
        //const mes3 = textChannel.messages.fetch('912468587598459999');
       // console.log(mes3);
        
    }
};