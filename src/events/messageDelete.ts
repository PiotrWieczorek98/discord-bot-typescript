
// --------------------------------------------------------------------
// When bot leaves guild
// --------------------------------------------------------------------

import { Message } from "discord.js";
import { globalVars } from "../classes/GlobalVars";

module.exports = {
	name: 'messageDelete',
	once: false,
	/**
	 * When message get deleted
	 * @param guild
	 */
	execute(message: Message) {
            
        // Check if player embed was deleted by someone
        for(const guildPlayer of globalVars.guildsPlayers.values()){
            if(guildPlayer.messageHandle?.id == message.id){
                    guildPlayer.recreateEmbed();
            }
        }
	},
};