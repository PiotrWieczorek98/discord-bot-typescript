import fetch from 'node-fetch';

export function wakeUpDyno(url: string, interval = 25, callback: Function){
	const milliseconds = interval * 60000;
	setTimeout(() => {

		try {
			console.log('setTimeout called.');
			// HTTP GET request to the dyno's url
			fetch(url).then(() => console.log(`Fetching ${url}.`));
		}
		catch (error) {
			const err = error as Error;
			console.log(`Error fetching ${url}: ${err.message} 
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
				return wakeUpDyno(url, interval, callback);
			}

		}

	}, milliseconds);
};