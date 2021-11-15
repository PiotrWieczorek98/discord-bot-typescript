import {Azure} from './Azure';
import {GuildDataManager} from './GuildDataManager';
import { GuildMember, MessageEmbed, TextChannel } from 'discord.js';
import { BettingSession } from './BettingSession';
import { globalVars } from './GlobalVars';
import { BettingSessionBetEntry } from './BettingSessionBetEntry';
import * as express from 'express';
import path from 'path';

// ------------------------------------------------------------------------------------
// DELETE this
// ------------------------------------------------------------------------------------

/**
 * Singleton used to process betting system
 * this struct allows betting on player's death
 */
class BetsLeagueOfLegends {
	private static _instance: BetsLeagueOfLegends;
	gamblers: Map<string, number>;
	bettingSessions: BettingSession[];

	/**
	 * Singleton constructor
	 * @param
	 */
	private constructor() {
		this.gamblers = new Map();
		this.bettingSessions = [];
	};

	/**
	 * Add a member to gamblers list
	 * @param gambler
	 */
	 async addGambler(gambler: GuildMember) {
		this.gamblers.set(gambler.id, globalVars.gambleConfig.initialCredits);
		const dir = path.resolve(__dirname, globalVars.gambleConfig.fileGamblersPath);
		await GuildDataManager.writeMapToFile(this.gamblers, dir);
		await Azure.uploadBlob(globalVars.vars.CONTAINER_DATA, dir, true);
	};

	/**
	 * Get gambler current credit amount
	 * @param gamblerId
	 */
	getGamblerCredits(gamblerId: string) {
		let result = this.gamblers.get(gamblerId);
		if(result == undefined)
		{
			result = -1;
		}
		return result;
	};

	/**
	 * Update betting data
	 */
	async uploadGamblersToAzure() {
		const dir = path.resolve(__dirname, globalVars.gambleConfig.fileGamblersPath);
		await GuildDataManager.writeMapToFile(this.gamblers, dir);
		await Azure.uploadBlob(globalVars.vars.CONTAINER_DATA, dir, true);
		console.log('Betters list updated.');
	};

	/**
	 * Add bet to jackpot
	 * @param gambler
	 * @param betValue
	 * @param targetSummoner
	 * @param minute
	 */
	addBetToJackpot(gambler: GuildMember, betValue: number, targetSummoner: string, minute: number) {
		let message = 'Betting not found!';
		let summonerName = null;

		for (const bettingSession of this.bettingSessions) {
			if (bettingSession.summonerName.toLowerCase() == targetSummoner.toLowerCase() && bettingSession.isActive) {
				const gamblerCredits = this.getGamblerCredits(gambler.id);
				summonerName = bettingSession.summonerName;

				// Check if gambler is registered
				if (gamblerCredits == undefined) {
					message = 'Not yet registered!';
					return message;
				}
				// Check if gambler has enough credits
				if (gamblerCredits < betValue) {
					message = 'Not enough credits!';
					return message;
				}

				// check if gambler already put a bet
				for (const bet of bettingSession.bets) {
					if (bet.gamblerId == gambler.id) {
						message = 'Already sent a bet!';
						return message;
					}
				}

				// check if bets are accepted
				if (!bettingSession.bettingAllowed) {
					message = 'Bets no longer accepted!';
					return message;
				}

				// Send a bet
				this.gamblers.set(gambler.id, gamblerCredits - betValue);
				bettingSession.jackpot += betValue;

				const bet = new BettingSessionBetEntry(gambler.id,gambler.displayName,betValue, minute.toFixed(2));
				bettingSession.bets.push(bet);

				message = `**${gambler.displayName}** bets **${betValue}** credits, that **${summonerName}** will die in **${bet.minute}** minute.`;


			}
		}

		return message;
	};

	/**
	 * Return bet for single gambler
	 * @param bettingSession
	 */
	cancelBettingSession(bettingSession: BettingSession) {
		bettingSession.isActive = false;
		if (bettingSession.bets.length == 1) {
			const betEntry = bettingSession.bets[0];
			const credits = this.getGamblerCredits(betEntry.gamblerId) + betEntry.value;
			this.gamblers.set(betEntry.gamblerId, credits);
			this.uploadGamblersToAzure();
		}
	};

	/**
     * @todo Start new betting event
     * @param summonerName
     * @param channelId
     */
	async startBettingSession(summonerName: string, channelId: string) {
		console.log('Started Betting for: ', summonerName);

		const newBettingSession = new BettingSession(summonerName, channelId, globalVars.gambleConfig.timeLimit);
		this.bettingSessions.push(newBettingSession);
	};

	/**
	 *
	 * @param targetSummoner
	 * @param minute
	 * @returns
	 */
	endBettingSession(targetSummoner: string, deathMinute: number) {
		let message = null;
		for (const bettingSession of this.bettingSessions) {
			// Find betting
			if (bettingSession.summonerName == targetSummoner && bettingSession.isActive) {
				bettingSession.isActive = false;

				if (deathMinute == -1) {
					message = `Pog, ${targetSummoner} didn't die! Everyone lost!`;
					return message;
				}

				if (bettingSession.bets.length < 2) {
					message = `**${targetSummoner}** died in **${deathMinute}** minute but not enough bets were sent!`;
					this.cancelBettingSession(bettingSession);
				}
				message = `**${targetSummoner}** died in **${deathMinute}** minute!`;

				// Find winners
				let winners = '\n💰__**Winners:💰**__\t';
				let losers = '\n__**🐵Losers:🐵**__\t';

				for (const entry of bettingSession.bets) {
					const multiplier = -(2 * Math.log(Math.abs( parseFloat(entry.minute) - deathMinute)) + 1.5);
					const prize = Math.floor(entry.value * multiplier);
					const newCredits = this.gamblers.get(entry.gamblerId)! + prize;
					this.gamblers.set(entry.gamblerId, newCredits);
					if (multiplier > 1) {
						winners += ` ** ${entry.gamblerName}** - ${prize}cr,`;
					}
					else {
						losers += ` ** ${entry.gamblerName}** - ${prize}cr,`;
					}
				}
				this.uploadGamblersToAzure();
				this.logBettingSession(bettingSession);
				message = winners + losers;
				break;
			}
		}

		if (message == null) {
			message = 'Something went wrong in endBetting!';
		}
		return message;
	};

	logBettingSession(bettingSession: BettingSession) {
		const fs = require('fs');
		let row = `${bettingSession.summonerName};`;
		for (const entry of bettingSession.bets) {
			row += `${entry.gamblerName};${entry.value};${entry.minute};`;
		}
		row += '\n';

		fs.appendFile(globalVars.gambleConfig.fileHistoryPath, row, function(err: Error) {
			if (err) throw err;
			console.log('Saved log: ', row);
		});

		Azure.uploadBlob(globalVars.vars.CONTAINER_DATA, globalVars.gambleConfig.fileHistoryPath, true);
	};

	eventGameStarted(req: express.Request){
		const data = req.body;
		const summonerName = data.SummonerName;
		const channelId = data.ChannelId;

		const bettingEmbed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle(`💸 Betting for ${summonerName}'s death! 💸`)
			.setDescription('Use /bet to enter the gamble!')
			.setThumbnail('https://i.imgur.com/qpIocsj.png')
			.setTimestamp()
			.setFooter('Not worth it...', 'https://i.imgur.com/L8gH1y8.png');

		// Avoid duplicate
		let foundDuplicate = false;
		for (const entry of betsLeagueOfLegends.bettingSessions) {
			if (entry.summonerName == summonerName && entry.isActive) {
				foundDuplicate = true;
			}
		}

		if (!foundDuplicate) {
			betsLeagueOfLegends.startBettingSession(summonerName, channelId);
			console.log('Received /game_started request for ', summonerName);
			// SEND CHANNEL MESSAGE
			(globalVars.client.channels.cache.get(channelId) as TextChannel).send({ embeds: [bettingEmbed] });
		}
		else {
			console.log('Received duplicate /game_started request for ', summonerName);
		}
	};

	eventSummonerDeath(req: express.Request){
		const data = req.body;
		let message = 'Something went wrong!';
		const summonerName = data.VictimName;

		let foundBetting = false;
		for (const entry of betsLeagueOfLegends.bettingSessions) {
			if (entry.summonerName == summonerName && entry.isActive) {
				foundBetting = true;
				const time = parseInt(data.EventTime);
				const minute = (time / 60).toFixed(2);
				message = betsLeagueOfLegends.endBettingSession(summonerName, parseFloat(minute));

				// SEND CHANNEL MESSAGE
				const bettingEmbed = new MessageEmbed()
					.setColor('#0099ff')
					.setTitle(`💸 ${summonerName}  died! 💸`)
					.setDescription(message)
					.setThumbnail('https://i.imgur.com/qpIocsj.png')
					.setTimestamp()
					.setFooter('Not worth it...', 'https://i.imgur.com/L8gH1y8.png');
				(globalVars.client.channels.cache.get(entry.channelId) as TextChannel).send({ embeds: [bettingEmbed] });
				break;
			}
		}

		if (!foundBetting) {
			message = `Received false /death request for ${summonerName}`;
		}

		console.log(message);
	}

	eventGameEnded(req: express.Request){
		const data = req.body;
		const summonerName = data.VictimName;

		for (const entry of betsLeagueOfLegends.bettingSessions) {
			if (entry.summonerName == summonerName && entry.isActive) {
				const message = betsLeagueOfLegends.endBettingSession(summonerName, -1);

				// SEND CHANNEL MESSAGE
				(globalVars.client.channels.cache.get(entry.channelId) as TextChannel).send(message);
			}
		}

		console.log('Received /death request for ', summonerName);
	}

	public static get Instance(){
		return this._instance || (this._instance = new BetsLeagueOfLegends());
	};
};

const betsLeagueOfLegends = BetsLeagueOfLegends.Instance;
export {betsLeagueOfLegends};