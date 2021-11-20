import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, GuildMember, Message, TextChannel, VoiceChannel } from 'discord.js';
import { AudioSourceYoutube } from '../classes/AudioSourceYoutube';
import { globalVars } from '../classes/GlobalVars';
import { GuildPlayer } from '../classes/GuildPlayer';
import { handleUndefined } from '../functions/handleUndefined';
import { AudioSourceLocal } from '../classes/AudioSourceLocal';
import { AudioSource } from '../classes/AudioSource';

// --------------------------------------------------------------------
// Plays sound from youtube in voice chat or adds to queue
// --------------------------------------------------------------------

/**
 * @todo add option to play in specified channel
 */
module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Play audio source')
		.addStringOption(option => option
			.setName('phrase')
			.setDescription(' local audio id / phrase to search / link')
			.setRequired(true)),
	/**
	 * @param interaction
	 */
	async execute(interaction: CommandInteraction) {
		// Search parameter
		let searchPhrase = interaction.options.getString('phrase')!;

		let message: string;
		message = `Processing...`;
		await interaction.reply(message);

		const guildId = interaction.guildId!;
		const textChannel = interaction.channel as TextChannel;
		const member = (interaction.member as GuildMember);

		// Check for abnormalities
		const voiceChannel = (member.voice.channel as VoiceChannel);
		message = 'Join voice channel first.';
		if(handleUndefined(voiceChannel, message, textChannel)) return;

		const clientMember = interaction.guild?.members.cache.get(interaction.client.user!.id)!;
		const permissions = voiceChannel.permissionsFor(clientMember)!;
		message = '❌ Not sufficient permissions!';
		if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
			handleUndefined(undefined, message, textChannel);
			return;
		}

        let audioSource: AudioSource | undefined;
        if(!isNaN(parseInt(searchPhrase)) ){
            audioSource = await AudioSourceLocal.createSource(interaction, searchPhrase);
        }
        else{
            audioSource = await AudioSourceYoutube.createSource( interaction, searchPhrase);
        }

        if(audioSource == undefined) return;

        console.log(`Guild ${guildId}: ${JSON.stringify(audioSource.metadata,null, 2)}`);
        

		// Create player if doesn't exist
		try{
			let guildPlayer = globalVars.guildsPlayers.get(member.guild.id);
			if(guildPlayer == undefined){
				message = `Initializing player...`;
				await interaction.editReply(message);
				console.log(`Guild ${guildId}: ${message}`);
				
				await GuildPlayer.createGuildPlayer(interaction, audioSource);	
			}
			else {
				// Delete reply
				const reply = await interaction.fetchReply() as Message;
				await reply.delete();
				
				guildPlayer.addToQueue(audioSource);
			}
		}
		catch(error){
			message = `Something went wrong - try again`;
			console.error((error as Error).message);
			const handle = await textChannel.send(message);
			setTimeout((messageHandle: Message) => { messageHandle.delete() }, 2000, handle);
		}
	},
};
