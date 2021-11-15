import {promises as fsPromises} from'fs';
import * as https from 'https';
import * as fs  from 'fs';

/**
 * Static class used to retrieve and upload data from cloud and manage local files.
 * Prepared for usage with ephermal storage
 */
export class GuildDataManager {

	/**
	 * Writes map object to file
	 * @param map
	 * @param filePath
	 * @returns 
	 */
	static async writeMapToFile(map: Map<any,any>, filePath:string) {
		console.log('Writing map to file...');
		const serializedGuilds = JSON.stringify([...map.entries()]);
		try{
			await fsPromises.writeFile(filePath, serializedGuilds);
		console.log('Success!');
			return new Promise<boolean>((resolve) => {
				resolve(true);
			});
		}
		catch(err){
			console.error('Error occured: ', err)
			return new Promise<boolean>((reject) => {
				reject(false);
			});
		}
	}

	/**
	 * Reads map from JSON
	 * @param filePath
	 * @returns
	 */
	static async readMapFromFile(filePath: string) {
		console.log('Writing map to file...');
		try{
			const data = await fsPromises.readFile(filePath);
			const result = JSON.parse(data.toString());
			console.log('Success!');
			return new Promise<Map<any,any>>((resolve) => {
				resolve(result);
			});
		}
		catch (err) {
			console.error('Error writing file! ', err);
			return new Promise<Map<any,any>>((reject) => {
				const rej = new Map();
				reject(rej);
			});
		}
	}

	/**
	 * Download file from given url to local storage
	 * @param url
	 * @param filePath
	 */
	static async downloadFromUrl(url:string, filePath:string) {
		const file = fs.createWriteStream(filePath);
		https.get(url, function(response) {
			response.pipe(file);
			file.on('finish', function() {
				file.close();
			});
		})
	}
}