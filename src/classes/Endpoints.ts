import * as expressCore from 'express-serve-static-core';
import { betsLeagueOfLegends } from './BetsLeagueOfLegends';
import express from 'express';
import { globalVars } from './GlobalVars';
import fetch from 'node-fetch';

/**
 * Web HTTP endpoints
 */
export class WebService {
	private static _instance: WebService;
	app: expressCore.Express;
	endpoints: string[];
	listeningPort: string;

	/**
	 * Initialize gambling system
	 * @param client
	 */
	private constructor() {
		this.app = express();
		this.app.use(express.json());
		this.endpoints = [];
		this.setEndpoints();

		this.listeningPort = process.env.PORT || globalVars.gambleConfig.port;
		this.app.listen(parseInt(this.listeningPort), () => {

		// Keep dyno awake
		setInterval(()=>{
		// HTTP GET request to the dyno's url
		const DYNO_URL = 'https://discord-js-boi-bot.herokuapp.com/ping';
		fetch(DYNO_URL);
		}, 25 * 60000)
		});
	};

	public static get getInstance(){
		return this._instance || (this._instance = new this());
	}

	private setEndpoints() {
		let endpoint: string;
		endpoint = '/game_started';
		this.app.post(endpoint, (req: express.Request, res: express.Response) => {
			betsLeagueOfLegends.eventGameStarted(req);
			res.send({ status: 'ok' });

		});
		this.endpoints.push(endpoint);

		endpoint = '/death';
		this.app.post(endpoint, (req: express.Request, res: express.Response) => {
			betsLeagueOfLegends.eventSummonerDeath(req);
			res.send({ status: 'ok' });

		});
		this.endpoints.push(endpoint);

		endpoint = '/game_ended';
		this.app.post(endpoint, (req: express.Request, res: express.Response) => {
			betsLeagueOfLegends.eventGameEnded(req);
			res.send({ status: 'ok' });
		});
		this.endpoints.push(endpoint);

		endpoint = '/ping';
		this.app.get(endpoint, (req: express.Request, res: express.Response) => {
			let data = req.body;
			data ??= { status: 'ok' };

			console.log('Received /ping request for ', data);
			res.send(data);
		});
		this.endpoints.push(endpoint);
	};
	
	display(){
		console.log(`Listening on port: ${this.listeningPort} for:`);
		let list = '\n';
		let i = 0;
		for (const endpoint of this.endpoints) {
			i += 1;
			list += `${i}. ${endpoint}\n`;
		}
		console.log(list);
	}

};