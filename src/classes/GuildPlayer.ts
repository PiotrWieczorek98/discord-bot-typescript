import { CommandInteraction, GuildMember, Message, MessageEmbed, MessageReaction, TextChannel, VoiceChannel } from 'discord.js';
import { AudioPlayer, AudioPlayerStatus, AudioResource, createAudioPlayer, joinVoiceChannel, VoiceConnection } from '@discordjs/voice';
import { globalVars } from './GlobalVars';
import { AudioSource } from './AudioSource';
import AsciiBar from 'ascii-bar'

/**
 * Class responsible for audio player functions in voice channels
 */
export class GuildPlayer {
	guildId: string;
	messageHandle: Message | undefined;
	audioPlayer: AudioPlayer;
	connection: VoiceConnection;
	textChannel: TextChannel;
	voiceChannel: VoiceChannel;
	audioSources: Array<AudioSource>;

	private ready: boolean;
	private idler: {
		intervalFunction: NodeJS.Timer,
		countdown: number,
	} | undefined;

	private constructor(interaction: CommandInteraction){
		console.log('Initializing constructor...');
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
		console.log('Done!');
	}

	/**
	 * Initialize player and interactive embed message
	 * @param interaction
	 * @param source
	 */
	static async createGuildPlayer(interaction:CommandInteraction, source: AudioSource) {
		console.log('Creating guild Player...');		
		const newGuildPlayer = new GuildPlayer(interaction);
		globalVars.guildsPlayers.set(interaction.guildId, newGuildPlayer);

		// Subscribe voice connection to player
		newGuildPlayer.connection.subscribe(newGuildPlayer.audioPlayer);

		// Start audio playback
		await newGuildPlayer.addToQueue(source);

		// Display embed message - acts as player view
		const embed = newGuildPlayer.prepareEmbed();
		const textChannel = (interaction.channel as TextChannel);
		newGuildPlayer.messageHandle = await textChannel.send({embeds:[embed]});

		// Setup trackers
		newGuildPlayer.setupTrackers();
		newGuildPlayer.setupAudioPlayerEvents();

		console.log('Creating guild Player Done!');
		return newGuildPlayer;
	}

	/**
	 * plays audio and manages audio player object
	 * @param source 
	 * @returns 
	 */
	async playAudio(source: AudioSource){
		console.log('Starting audio playback...');
		const resource = source.resource!;
		// Will throw exception on very long videos...
		try{
			this.audioPlayer.play(resource);
			const message = `🔊 Playing: **${source.metadata.title}**`;
			console.log(message);
	
			this.ready = true;
			console.log('Starting audio playback Done!');
		}
		catch{
			this.shiftQueue();
			const message = `Error starting audio playback!`;
			const handle = await this.textChannel.send(message);
			setTimeout((messageHandle: Message) => { messageHandle.delete() }, 1000, handle);
			console.log(message);
		}


	}
	
	/**
	 * Get next audio in queue
	 */
	async shiftQueue() {
		console.log('Shifting queue...');
		// Stop if queue is empty
		this.audioSources.shift();
		if (this.audioSources.length == 0) {
			await this.setPlayerIdler();
		}
		// Play next audio source if not
		else{
			const newSource = this.audioSources[0];
			await this.playAudio(newSource);
			const embed = this.prepareEmbed();
			this.messageHandle?.edit({embeds: [embed]});
		}
		console.log('Shifting queue Done!');
	}

	/**
	 * Add audio source to guild's queue
	 * @param source 
	 */
	async addToQueue(source: AudioSource, 
		opts?: {rejoin: boolean, interaction: CommandInteraction}){

		console.log('Adding to queue...');
		this.audioSources.push(source);

		// If this is the first song
		if(this.audioSources.length == 1){
			this.playAudio(this.audioSources[0]);
			this.ready = true;
		}

		if(opts?.rejoin){
			// Rejoin to channel (user could switch vc while player is idling)
			this.voiceChannel = (opts.interaction.member as GuildMember).voice.channel as VoiceChannel;
			this.textChannel = opts.interaction.channel as TextChannel;
			this.connection = joinVoiceChannel({
				channelId: this.voiceChannel.id,
				guildId: this.voiceChannel.guild.id,
				adapterCreator: this.voiceChannel.guild.voiceAdapterCreator,
			});
		}

		if(this.messageHandle){
			const embed = this.prepareEmbed();
			this.messageHandle.edit({embeds: [embed]});
		};
		const message = `☑️ **${source.metadata.title}** has been added to the queue`;
		console.log(`Guild ${this.guildId}: ${message}`);

		// Remove idler
		if(this.idler){
			clearInterval(this.idler.intervalFunction);
		}
		console.log('Adding to queue Done!');
	}

	/**
	 * Makes player wait a minute idling
	 */
	async setPlayerIdler(){
		console.log('Setting Idler...');
		this.ready = false;

		// Clear queue
		this.audioSources = [];
		
		// Setup message embed
		const embed = this.prepareEmbed();
		await this.messageHandle!.edit({embeds: [embed]});

		// Stop playback
		this.audioSources = [];
		this.audioPlayer.stop();

		// Delete existing idler
		if(this.idler){
			clearInterval(this.idler.intervalFunction);
			this.idler = undefined;
		}
		// Setup idler
		this.idler = {
			countdown: 6000,
			intervalFunction: setInterval(function(guildPlayer: GuildPlayer) {
				// If the count down is finished, write some text
				if (guildPlayer.idler!.countdown < 1) {
					guildPlayer.removePlayer();
					  clearInterval(guildPlayer.idler!.intervalFunction);
				}
				else{
					guildPlayer.idler!.countdown = guildPlayer.idler!.countdown -1;
				}
			  }, 1000, this),
			}

			console.log('Setting Idler Done!');
		}

	/**
	 * Stops and deletes audio player
	 */
	removePlayer(){
		console.log('Removing player...');
		this.ready = false;
		// Must be done first to prevent recreation of embed
		globalVars.guildsPlayers.delete(this.guildId);

	if(this.messageHandle){
		this.connection.rejoin({ selfDeaf: false,
			 selfMute: true, 
			 channelId: this.voiceChannel.id });
		this.messageHandle.delete();
		this.messageHandle = undefined;
	}
		this.audioPlayer.removeAllListeners();
		this.audioPlayer.stop();
		console.log('Removing player Done!');
	}

	/**
	 * How player should react to different states
	 */
	 setupAudioPlayerEvents(){
		console.log('Setting up events...');
		// After finish play next audio from queue
		this.audioPlayer.on(AudioPlayerStatus.Idle, async () => {
			if(this.ready){
				if(this.messageHandle){
					await this.shiftQueue();
				}
				else{
					await this.setPlayerIdler();
				}
			}
		});

		// Handle error
		this.audioPlayer.on('error', async (error) => {
			console.log(this.audioPlayer.state);
			console.error(`Error: ${error.message} with resource}`);
			if(this.messageHandle){
				await this.shiftQueue();
			}
			else{
				await this.setPlayerIdler();
			}
		});
		console.log('Setting up events Done!');
	}

	/**
	 * Message and reaction collectors
	 */
	async setupTrackers(){
		console.log('Setting up trackers...');
		if(!this.messageHandle){
			console.log('Message not found!');
			return;
		} 

		// Give reactions
		await this.messageHandle.react('⏩');
		await this.messageHandle.react('⏹️');
		await this.messageHandle.react('⏬');
		await this.messageHandle.react('❌');
		const filterReaction = (reaction: MessageReaction) => {
			return ['⏩', '⏹️', '⏬','❌'].includes(reaction.emoji.name!);
		};

		// React to emoji reaction
		const reactionCollector = this.messageHandle.createReactionCollector(
			{filter: filterReaction, time:600000});

		reactionCollector.on('collect', async (reaction, user) => {
			// Ignore self reaction
			if(user.id == globalVars.client.user!.id) return;
			

			// Remove reaction by user
			const userReactions = this.messageHandle!.reactions.cache.filter(reaction => 
				reaction.users.cache.has(user.id));
			try {
				for (const reaction of userReactions.values()) {
					await reaction.users.remove(user.id);
				}
			} catch (error) {
				console.error('Failed to remove reactions.');
			}

			if(reaction.emoji.name == '⏩'){
				if(this.audioSources.length != 0){
					await this.shiftQueue();
				}
			}
			else if(reaction.emoji.name == '⏹️'){
				if(this.audioSources.length != 0){
					await this.setPlayerIdler();
				}
			}
			else if(reaction.emoji.name == '⏬'){
				await this.bringDownEmbed();
			}
			else if(reaction.emoji.name == '❌'){
				this.removePlayer();
			}
		});	

	console.log('Setting up trackers Done!');
	}

	/**
	 * Prepare message embed content
	 */
	prepareEmbed(){
		console.log('Preparing embed...');
		let message: string;

		// Edit display
		let messageEmbed: MessageEmbed;
		const currentlyPlayed = this.audioSources[0];

		if(currentlyPlayed == undefined){
			messageEmbed = new MessageEmbed()
			.setColor('#ffff00')
			.setAuthor('🔈 Nothing is playing right now!')
			.setTitle('Waiting for entries...')
			.setThumbnail('https://c.tenor.com/ycKJas-YT0UAAAAM/im-waiting-aki-and-paw-paw.gif')
			.addField('Progress:', 'test')
			.setTimestamp()
			.setFooter('Use reactions for interaction!',
			'https://cdn.discordapp.com/avatars/200303039863717889/93355d2695316c6dc580bdd7a5ce8a04.webp');
		}
		else{
			message = '';
			const queueList = this.audioSources.slice(1,);
			if(queueList.length == 0){
				message = 'Queue is empty!';
			}
			else{
				// Prepare queue list
				let i = 0;
				for (const source of queueList) {
					i += 1;
					message += `${i}. ${source.metadata.title}\n`;
					// Show only 10 entries to keep it looking nice
					if (i == 10){
						message += '\n...';
						break;
					}
				}
			}

			messageEmbed = new MessageEmbed()
			.setColor('#00ff00')
			.setAuthor('🔊 Now playing:')
			.setTitle(currentlyPlayed.metadata.title)
			.setThumbnail(currentlyPlayed.metadata.thumbnail)
			.addField('Progress:', 'test')
			.addField('**Queue:**', message, false)
			.setTimestamp()
			.setFooter('Use reactions for interaction!',
			'https://cdn.discordapp.com/avatars/200303039863717889/93355d2695316c6dc580bdd7a5ce8a04.webp');
		}


		console.log('Preparing embed Done!');
		return messageEmbed;
	}

	/**
	 * Called from event 'messageDelete' when user deletes embed player
	 * @param guildPlayer 
	 */
	 async recreateEmbed(){
		// Display embed message - acts as player view
		const embed = this.prepareEmbed();
		this.messageHandle = await (this.textChannel as TextChannel).send({embeds:[embed]});

		// Setup trackers
		await this.setupTrackers();
	}

	/**
	 * Delete old player embed and send a new one
	 * Useful if player embed gets buried in text chat
	 */
	async bringDownEmbed(){
		console.log('Bringind down embed...');

		// I don't need to send new embed because deleting message is caught by event listener
		this.ready = false;
		await this.messageHandle!.delete();
		this.ready = true;
	}
}

