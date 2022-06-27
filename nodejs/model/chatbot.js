'use strict';


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

class ChatBot{
	commandLock = false;
	commandCollDownTime = 15000;
	commands = {};
	nextChatTime = 0

	constructor(cjbot){
		this.cjbot = cjbot;
		this.bot = this.cjbot.bot;
		this.bot.on('chat', (from, message)=>{

			// Ignore messages from this bot
			if(from === this.bot.entity.username) return;

			// Filter messages to this bot
			if(message.startsWith(this.bot.entity.username)){
				this.__doCommand(
					from,
		        	message.replace(`${this.bot.entity.username} ` , ' ').trim()
		        )
			}
		});
	}

	__chatCoolDown(){
		return Math.floor(Math.random() * (3000 - 1500) + 1500);
	}

	async chat(...messages){
		for(let message of messages){
			if(this.nextChatTime > Date.now()){
				await sleep(this.nextChatTime-Date.now()+1)
			}

			this.bot.chat(message);
			this.nextChatTime = Date.now() + this.__chatCoolDown();
		}
	}

	async whisper(to, ...messages){
		await this.chat(...messages.map(message=>`/msg ${to} ${message}`));
	}

	async __unLockCommand(time){
		await sleep(this.commandCollDownTime);
		this.commandLock = false;
	}

	async __doCommand(from, command){

		if(this.commandLock){
			this.whisper(from, `cool down, try again in ${this.commandCollDownTime/1000} seconds...`);
			return ;
		}

		let [cmd, ...parts] = command.split(/\s+/);

		if(Object.keys(this.commands).includes(cmd)){
			this.commandLock = true;
			try{
				await this.commands[cmd].function(this, from, ...parts);
			}catch(error){
				this.whisper(from, `The command encountered an error.`)
				console.log(`Chat command error on ${cmd} from ${from}\n`, error);
			}
			this.__unLockCommand()
		}
	}

	addCommand(name, obj){
		if(this.commands[name]) return false;
		this.commands[name] = obj;
	}
}

module.exports = {ChatBot};
