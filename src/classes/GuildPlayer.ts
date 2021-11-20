import { CommandInteraction, GuildMember, Message, MessageEmbed, MessageReaction, TextChannel, VoiceChannel } from 'discord.js';
import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, joinVoiceChannel, VoiceConnection } from '@discordjs/voice';
import { globalVars } from './GlobalVars';
import { AudioSource } from './AudioSource';
import { wait } from '../functions/wait';

/**
 * Class responsible for audio player functions in voice channels
 */
export class GuildPlayer {
	guildId: string;
	messageHandle!: Message;
	audioPlayer: AudioPlayer;
	connection: VoiceConnection;
	textChannel: TextChannel;
	voiceChannel: VoiceChannel;
	audioSources: Array<AudioSource>;

	private ready: boolean;
	private progressBarTimer!: NodeJS.Timer; 

	private idler!: NodeJS.Timer;
	private idleTimer!: number; 

	private constructor(interaction: CommandInteraction){
		this.ready = false;
		this.guildId = interaction.guildId;
		this.audioSources = [];
		this.voiceChannel = (interaction.member as GuildMember).voice.channel as VoiceChannel;
		this.textChannel = interaction.channel as TextChannel;
		this.connection = joinVoiceChannel({
			channelId: this.voiceChannel.id,
			guildId: this.voiceChannel.guild.id,
			adapterCreator: this.voiceChannel.guild.voiceAdapterCreator,
		});
		this.audioPlayer = createAudioPlayer();
	}

	/**
	 * Initialize player and interactive embed message
	 * @param interaction
	 * @param source
	 */
	static async createGuildPlayer(interaction:CommandInteraction, source: AudioSource) {
		const newGuildPlayer = new GuildPlayer(interaction);
		globalVars.guildsPlayers.set(interaction.guildId, newGuildPlayer);

		// Subscribe voice connection to player
		newGuildPlayer.connection.subscribe(newGuildPlayer.audioPlayer);// Start playback

		// Display embed message - acts as player view
		const embed = newGuildPlayer.prepareEmbed();
		newGuildPlayer.messageHandle = await (interaction.channel as TextChannel).send({embeds:[embed]});

		// Start player
		newGuildPlayer.addToQueue(source);
		// Setup trackers
		await newGuildPlayer.setupTrackers();
		newGuildPlayer.setupAudioPlayerEvents();

		// Delete reply
		const reply = await interaction.fetchReply() as Message;
		try{
			await reply.delete();
		}
		catch{
			console.log(`${interaction.guildId}: reply already deleted.`);
		}

		return newGuildPlayer;
	}

	/**
	 * plays audio and manages audio player object
	 * @param source 
	 * @returns 
	 */
	async playAudio(source: AudioSource){
		const resource = source.resource!;
		this.audioPlayer.play(resource);

		const message = `🔊 Playing: **${source.metadata.title}**`;
		console.log(message);

		this.ready = true;
	}
	
	/**
	 * Get next audio in queue
	 */
	async shiftQueue() {
		// Stop if queue is empty
		this.audioSources.shift();
		if (this.audioSources.length == 0) {
			this.setPlayerIdler();
		}
		// Play next audio source if not
		else{
			const newSource = this.audioSources[0];
			await this.playAudio(newSource);
			const embed = this.prepareEmbed();
			this.messageHandle.edit({embeds: [embed]});
		}
	}

	/**
	 * Add audio source to guild's queue
	 * @param source 
	 */
	async addToQueue(source: AudioSource){
		this.audioSources.push(source);
		if(this.audioSources.length == 1){
			this.playAudio(this.audioSources[0]);
			this.ready = true;
		}
		const embed = this.prepareEmbed();
		this.messageHandle.edit({embeds: [embed]});

		const message = `☑️ **${source.metadata.title}** has been added to the queue`;
		console.log(`Guild ${this.guildId}: ${message}`);

		// Remove idler
		clearInterval(this.idler);
	}

	/**
	 * Makes player wait a minute idling
	 */
	setPlayerIdler(){
		this.audioSources = [];
		this.audioPlayer.stop();
		this.idleTimer = 10;
		this.idler = setInterval(function(guildPlayer: GuildPlayer) {
			// If the count down is finished, write some text
			if (guildPlayer.idleTimer < 1) {
				guildPlayer.removePlayer();
			  	clearInterval(guildPlayer.idler);
			}
			else{
				guildPlayer.idleTimer = guildPlayer.idleTimer -1;
			}
		  }, 1000, this);
	}

	/**
	 * Stops and deletes audio player
	 */
	removePlayer(){
		this.ready = false;
	if(!this.messageHandle.deleted){
		this.connection.rejoin({ selfDeaf: false,
			 selfMute: true, 
			 channelId: this.voiceChannel.id });
		this.messageHandle.deleted = true;
		this.messageHandle.delete();
	}
		this.audioPlayer.removeAllListeners();
		this.audioPlayer.stop();
		globalVars.guildsPlayers.delete(this.guildId);
	}

	/**
	 * How player should react to different states
	 */
	 setupAudioPlayerEvents(){
		// After finish play next audio from queue
		this.audioPlayer.on(AudioPlayerStatus.Idle, async () => {
			if(this.ready){
				if(!this.messageHandle.deleted){
					await this.shiftQueue();
				}
				else{
					this.setPlayerIdler();
				}
			}
		});

		// Handle error
		this.audioPlayer.on('error', async (error) => {
			console.log(this.audioPlayer.state);
			console.error(`Error: ${error.message} with resource ${error.resource.metadata}`);
			if(!this.messageHandle.deleted){
				await this.shiftQueue();
			}
			else{
				this.setPlayerIdler();
			}
		});
	}

	/**
	 * Message and reaction collectors
	 */
	async setupTrackers(){
		// Await reactions
		await this.messageHandle.react('⏩');
		await this.messageHandle.react('⏹️');
		const filterReaction = (reaction: MessageReaction) => {
			return ['⏩', '⏹️'].includes(reaction.emoji.name!);
		};

		// React to emoji reaction
		const reactionCollector = this.messageHandle.createReactionCollector({filter: filterReaction, time:600000});
		reactionCollector.on('collect', async (reaction, user) => {
			// Ignore self reaction
			if(user.id == globalVars.client.user!.id) return;
			

			// Remove reaction by user
			const userReactions = this.messageHandle.reactions.cache.filter(reaction => 
				reaction.users.cache.has(user.id));
			try {
				for (const reaction of userReactions.values()) {
					await reaction.users.remove(user.id);
				}
			} catch (error) {
				console.error('Failed to remove reactions.');
			}

			if(reaction.emoji.name == '⏩'){
				await this.shiftQueue();
			}
			else if(reaction.emoji.name == '⏹️'){
				this.setPlayerIdler();
			}
		});

		// Code below not working as intended
		// Keep track of sent messages to make player embed always on bottom
	// 	const messageCollector = this.textChannel.createMessageCollector({ time: 100000 });

	// 	messageCollector.on('collect', async(m) => {
	// 		await wait(3000);
	// 		this.textChannel.messages.fetch({ limit: 1 }).then(async messages => {
	// 			const lastMessage = messages.first();
	// 			if(this.messageHandle.id != lastMessage!.id){
	// 				const embed = this.messageHandle.embeds[0];
	// 				if(!this.messageHandle.deleted){
	// 					this.ready = false;
	// 					this.messageHandle.deleted = true;
	// 					this.messageHandle.delete();
	// 				}
	// 				this.messageHandle = await this.textChannel.send({embeds:[embed]});
	// 				this.setupTrackers();	
	// 				this.ready = false;
				
	// 			}
	// 		});
	// 	});
	}

	/**
	 * Prepare message embed content
	 */
	prepareEmbed(){
		let message= '';
		let i = 0;
		const queueList = this.audioSources.slice(1,);
		if(queueList.length == 0){
			message = 'Queue is empty!';
		}
		else{
			for (const source of queueList) {
				i += 1;
				message += `${i}. ${source.metadata.title}\n`;
			}
		}

		// Edit display
		const currentlyPlayed = this.audioSources[0];
		const messageEmbed = new MessageEmbed()
		.setColor('#FF0000')
		.setAuthor('🔊 Now playing:')
		.setTitle(currentlyPlayed.metadata.title)
		.setThumbnail(currentlyPlayed.metadata.thumbnail)
		.addField('Progress:', 'test')
		.addField('**Queue:**', message, false)
		.setTimestamp()
		.setFooter('Use reactions for interaction!',
		'https://cdn.discordapp.com/avatars/200303039863717889/93355d2695316c6dc580bdd7a5ce8a04.webp');

		return messageEmbed;
	}

	async updateProgressBar(){
		await wait(1000);
		if(!this.messageHandle?.deleted){
			const embed = this.messageHandle.embeds[0];
			const fields = embed.fields;
			const progressBarField = fields[0];
			progressBarField.value = 'worked';
			 embed.setFields()
		}
		else{
			clearInterval(this.progressBarTimer);
		}
	}

	/**
	 * Useful if player embed gets buried in text chat
	 */
	async bringDownEmbed(){
		const embed = this.messageHandle.embeds[0];
		if(!this.messageHandle.deleted){
			this.ready = false;
			this.messageHandle.deleted = true;
			this.messageHandle.delete();
		}
		this.messageHandle = await this.textChannel.send({embeds:[embed]});
		this.setupTrackers();
		this.ready = false;
	}
}