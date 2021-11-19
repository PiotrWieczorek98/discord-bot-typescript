import fetch from 'node-fetch';

export function wakeUpDyno(interval = 25, callback: Function){
	const milliseconds = interval * 60000;
	setTimeout(() => {

		try {
			console.log('setTimeout called.');
			// HTTP GET request to the dyno's url
			const DYNO_URL = 'https://discord-js-boi-bot.herokuapp.com/ping';
			fetch(DYNO_URL).then(() => console.log(`Fetching ${DYNO_URL}.`));
		}
		catch (error) {
			const err = error as Error;
			console.log(`Error fetching: ${err.message} 
            Will try again in ${interval} minutes...`);
		}
		finally {

			try {
				callback();
			}
			catch (error) {
				const err = error as Error;
				callback ? console.log('Callback failed: ', err.message) : null;
			}
			finally {
				return wakeUpDyno(interval, callback);
			}

		}

	}, milliseconds);
};