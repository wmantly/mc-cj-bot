'use strict';

const {sleep} = require('../utils');
const mineflayer = require('mineflayer');


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

		// this.bot.on('message', (m)=> console.log(m.toString()))
		this.bot.on('error', (m)=> console.log(m.toString()))

		this.bot.on('login', ()=> this.__onReady());

		this.bot.on('end', reason => this.isReady = false);
	}

	once(event){
		return new Promise((resolve, reject)=> this.bot.once(event, resolve));
	}

	async __onReady(){

		this.__startListeners();
		for(let callback of this.listeners.onReady || []){
			console.log('__onReady callback', callback)
			callback(this)
		}

		console.log('jump')
		this.bot.setControlState('jump', true);
		await sleep(2000);
		this.bot.setControlState('jump', false);
		console.log('jump done')

		this.isReady = true;
		console.log('Bot is ready');
	}

	__startListeners(){
		for(let event in this.listeners){
			for(let callback of this.listeners[event]){
				this.bot.on(event, callback)
			}
		}
	}

	on(event, callback){
		if(!this.listeners[event]) this.listeners[event] = [];

		this.listeners[event].push(callback);

		if(this.isReady){
			if(event === 'onReady') callback(this);
			else this.bot.on(event, callback);
		}

		return event === 'onReady' ? true : ()=> this.bot.off(listener, callback);
	}

	__autoReConnect(){
		this.on('end', (reason)=>{
			console.error('MC on end', reason)

			sleep(30000);
			this.connect()
		});

		this.bot.on('kick', console.error)

		this.on('error', (error)=>{
			console.error('MC on error', error);

			sleep(30000);
			this.connect();
		});
	}

	__error(){
		this.bot.on('error', (error)=>{
			console.error(`ERROR!!! MC bot ${this.username} on ${this.host} had an error:\n`, error)
		});
	}

	getPlayers(){
		for (let [username, value] of Object.entries(this.bot.players)){
			value.lvl = Number(value.displayName.extra[0].text)
		}

		return this.bot.players;
	}
}

module.exports = {CJbot};
