import { TextChannel } from "discord.js";

/**
 * If object is undefined this function will reply to interaction and return 'true'
 * @param obj 
 * @param message 
 * @param interaction 
 * @returns 
 */
 export function handleUndefined(obj: any, message: string, channel: TextChannel){
	if(obj == undefined || obj == null){
		channel.send(message);
		console.log(`Guild ${channel.guildId}: ${message}`)
		return true;
	}
	return false;
}