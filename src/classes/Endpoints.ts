import * as expressCore from 'express-serve-static-core';
import { globalVars } from './GlobalVars';
import { betsLeagueOfLegends } from './BetsLeagueOfLegends';
import express from 'express';
import { wakeUpDyno } from '../helpers/wakeUpDyno';

/**
 * Web HTTP endpoints
 */
class Endpoints {
	private static _instance: Endpoints;
	app: expressCore.Express;

	/**
	 * Initialize gambling system
	 * @param client
	 */
	private constructor() {
		this.app = express();
		this.app.use(express.json());
	};
	/**
     * React to web requests
     * @param port
     */
	async setListener(port: number) {

		this.app.post('/game_started', (req: express.Request, res: express.Response) => {
			betsLeagueOfLegends.eventGameStarted(req);
			res.send({ status: 'ok' });

		});

		this.app.post('/death', (req: express.Request, res: express.Response) => {
			betsLeagueOfLegends.eventSummonerDeath(req);
			res.send({ status: 'ok' });

		});

		this.app.post('/game_ended', (req: express.Request, res: express.Response) => {
			betsLeagueOfLegends.eventGameEnded(req);
			res.send({ status: 'ok' });
		});

		this.app.get('/ping', (req: express.Request, res: express.Response) => {
			let data = req.body;
			data ??= { status: 'ok' };

			console.log('Received /ping request for ', data);
			res.send(data);
		});

		const listeningPort = process.env.PORT || port;
		this.app.listen(listeningPort, () => {
			const DYNO_URL = 'https://discord-js-boi-bot.herokuapp.com/ping';
			wakeUpDyno(DYNO_URL, 25, wakeUpDyno);
			console.log('Listening on port: ', listeningPort);
		});
	};

	public static get Instance(){
		return this._instance || (this._instance = new this());
	}

};

const endpoints = Endpoints.Instance;

export {endpoints};