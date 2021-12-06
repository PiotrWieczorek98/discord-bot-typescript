import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, GuildMember, Message, TextChannel, VoiceChannel } from 'discord.js';
import { AudioSourceYoutube } from '../classes/AudioSourceYoutube';
import { globalVars } from '../classes/GlobalVars';
import { GuildPlayer } from '../classes/GuildPlayer';
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
		try{
			await interaction.reply(message);
		}
		catch(error){
			message = `Retrying...`;
		}

		const guildId = interaction.guildId!;
		const textChannel = interaction.channel as TextChannel;
		const member = (interaction.member as GuildMember);

		// Check for abnormalities
		const voiceChannel = (member.voice.channel as VoiceChannel);
		
		// Handle undefined
		if(voiceChannel == undefined){
			message = 'Join voice channel first.';
			const handle = await interaction.editReply(message);
			// Delete after 2 seconds
			setTimeout((messageHandle: Message) => { messageHandle.delete() }, 1000, handle);		
			return;
		} 

		const clientMember = interaction.guild?.members.cache.get(interaction.client.user!.id)!;
		const permissions = voiceChannel.permissionsFor(clientMember)!;

		// Handle no permissions
		if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
			message = '❌ Not sufficient permissions!';
			const handle = await interaction.editReply(message);
			// Delete after 2 seconds
			setTimeout((messageHandle: Message) => { messageHandle.delete() }, 1000, handle);		
			return;
		}

        let audioSource: AudioSource | undefined;
        if(!isNaN(parseInt(searchPhrase)) ){
            audioSource = await AudioSourceLocal.createSource(interaction, searchPhrase);
        }
        else{
            audioSource = await AudioSourceYoutube.createSource( interaction, searchPhrase);
        }

        if(audioSource == undefined){
			// Delete reply
			const reply = await interaction.fetchReply() as Message;
			await reply.delete();	
			return;
		} 

        console.log(`Guild ${guildId}: ${JSON.stringify(audioSource.metadata,null, 2)}`);
        

		// Create player if doesn't exist
		try{
			let guildPlayer = globalVars.guildsPlayers.get(member.guild.id);
			if(guildPlayer == undefined){
				message = 'Initializing player...';
				const handle = await interaction.editReply(message);
				// Delete reply after 2 seconds
				setTimeout((messageHandle: Message) => { messageHandle.delete() }, 1000, handle);	
				console.log(`Guild ${guildId}: ${message}`);
				
				await GuildPlayer.createGuildPlayer(interaction, audioSource);	
			}
			else {
				message = 'Sending to queue...';
				const handle = await interaction.editReply(message);
				// Delete after 2 seconds
				setTimeout((messageHandle: Message) => { messageHandle.delete() }, 1000, handle);
				
				guildPlayer.addToQueue(audioSource, {rejoin: true, interaction: interaction});
			}
		}
		catch(error){
			message = `Something went wrong - try again`;
			console.error((error as Error).message);
			const handle = await textChannel.send(message);
			setTimeout((messageHandle: Message) => { messageHandle.delete() }, 1000, handle);
		}
	},
};
