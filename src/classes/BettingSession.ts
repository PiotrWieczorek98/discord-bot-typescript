import { TextChannel } from "discord.js";
import { wait } from "../functions/wait";
import { betsLeagueOfLegends } from "./BetsLeagueOfLegends";
import { BetEntry } from "./BetEntry";
import { globalVars } from "./GlobalVars";

/**
 * Class representing a single betting event
 */
 export class BettingSession {

	summonerName:string;
	isActive:boolean;
	bettingAllowed:boolean;
	jackpot:number;
	bets: BetEntry[];
	channelId:string;

	/**
	 * Constructor
	 * @param  summonerName
	 * @param channelId
	 * @param timeLimit
	 */
	constructor(summonerName: string, channelId: string, timeLimit: number) {
		this.summonerName = summonerName;
		this.isActive = true;
		this.bettingAllowed = true;
		this.jackpot = 0;
		this.channelId = channelId;
		this.bets = [];
		this.startTimer(timeLimit);
	}

	/**
	 * Allow betting for a limited time
	 * @param time
	 */
	async startTimer(time:number) {
		await wait(time);
		this.bettingAllowed = false;
		if (this.bets.length < 2) {
			betsLeagueOfLegends.cancelBettingSession(this);
			const message = `Betting on **${this.summonerName}** canceled - not enough bets were sent!`;
			(globalVars.client.channels.cache.get(this.channelId) as TextChannel).send(message);
			console.log(message);
		}
	}
}