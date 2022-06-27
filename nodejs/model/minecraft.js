'use strict';

const mineflayer = require('mineflayer');

function sleep(ms) {
  return new Promise((resolve) => {
	setTimeout(resolve, ms);
  });
}

class CJbot{
	isReady = false;
	listeners = {};

	constructor(args){
		this.username = args.username;
		this.password = args.password;
		this.host = args.host;
		this.auth = args.auth;
		this.version = args.version || '1.18.2';
		this.autoReConnect = args.auth || true;
		this.autoConnect = args.autoConnect || true;
	
		if(this.autoConnect){
			this.connect();
		}

		if(this.autoReConnect){
			this.__autoReConnect()
		}
	}

	connect(){

		this.bot = mineflayer.createBot({
			host: this.host,
			username: this.username,
			password: this.password,
			version: this.version,
			auth: this.auth,
		});

		this.bot.on('login', ()=>this.__onReady());

		this.bot.on('end', reason => this.isReady = false);


	}

	__onReady(){
		console.log('Bot is ready')
		this.isReady = true;
		this.__startListeners();
		for(let callback of this.listeners.onReady || []){
			callback()
		}
	}

	__startListeners(){
		for(let event in this.listeners){
			for(let callback of this.listeners[event]){
				this.bot.on(event, callback)
			}
		}
	}

	on(event, callback){
		console.log('adding listener', event)
		if(!this.listeners[event]) this.listeners[event] = [];

		this.listeners[event].push(callback);

		if(this.isReady) this.bot.on(event, callback);

		return ()=> this.bot.off(listener, callback);
	}

	__autoReConnect(){
		this.on('end', (reason)=>{
			console.error('MC on end', reason)

			sleep(30000);
			this.connect()
		});

		this.on('error', (error)=>{
			console.error('MC on error', reason)

			sleep(30000);
			this.connect()
		});
	}

	__error(){
		this.bot.on('error', (error)=>{
			console.error(`ERROR!!! MC bot ${this.username} on ${this.host} had an error:\n`, error)
		});
	}

	getPlayers(){
		for (const [username, value] of Object.entries(this.bot.players)){
			value.lvl = Number(value.displayName.extra[0].text)
		}

		return this.bot.players;
	}
}

module.exports = {CJbot};
