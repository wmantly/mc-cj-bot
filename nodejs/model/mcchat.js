'use strict';

const {sleep} = require('../utils');

class ChatBot{
	commandLock = false;
	commandCollDownTime = 1500;
	commands = {};
	nextChatTime = 0

	constructor(cjbot){
		this.cjbot = cjbot;
		this.bot = this.cjbot.bot;

		this.__listen();
	}

	__listen(){
		this.cjbot.on('chat', (from, message)=>{

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

		this.cjbot.on('whisper', (from, message)=>{
			this.__doCommand(
				from,
				message.replace(`${this.bot.entity.username} ` , ' ').trim()
			)
		});

		this.cjbot.on('message', (message, type)=>{
			if(type === 'system' && message.toString().includes(' invited you to teleport to him.')){
				// teleport invite

				// console.log('ChatBot on message', message.toString())
				this.__doCommand(message.toString().split(' ')[0], '.invite');
			}
		});

	}

	__chatCoolDown(){
		return Math.floor(Math.random() * (3000 - 1500) + 1500);
	}

	async say(...messages){
		for(let message of messages){
			if(this.nextChatTime > Date.now()){
				await sleep(this.nextChatTime-Date.now()+1)
			}

			this.bot.chat(message);
			this.nextChatTime = Date.now() + this.__chatCoolDown();
		}
	}

	async whisper(to, ...messages){
		await this.say(...messages.map(message=>`/msg ${to} ${message}`));
	}

	async __unLockCommand(time){
		await sleep(this.commandCollDownTime);
		this.commandLock = false;
	}

	__reduceCommands(from){
		return Object.keys(this.commands).filter(command =>{
			if (this.commands[command].allowed && !this.commands[command].allowed.includes(from)) return false;
			return true;
		});
	}

	async __doCommand(from, command){
		if(this.commandLock){
			this.whisper(from, `cool down, try again in ${this.commandCollDownTime/1000} seconds...`);
			return ;
		}

		let [cmd, ...parts] = command.split(/\s+/);

		if(this.__reduceCommands(from).includes(cmd)){
			this.commandLock = true;
			try{
				await this.commands[cmd].function(this, from, ...parts);
			}catch(error){
				this.whisper(from, `The command encountered an error.`);
				console.error(`Chat command error on ${cmd} from ${from}\n`, error);
			}
			this.__unLockCommand();
		}else{
			this.whisper(from, `I dont know anything about ${cmd}`);
		}
	}

	addCommand(name, obj){
		if(this.commands[name]) return false;
		this.commands[name] = obj;
	}
}

module.exports = {ChatBot};
