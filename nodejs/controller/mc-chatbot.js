'use strict';

const conf = require('../conf');
const {CJbot} = require('../model/minecraft');
const {ChatBot} = require('../model/chatbot');

const bot = new CJbot({host: conf.mc.server, ...conf.mc.bots.useless666});

const chatBot = new ChatBot(bot);

bot.on('chat', (from, messages)=>console.log('controller on chat', from, messages))


const axios = require('axios');

chatBot.addCommand('joke', {
	desc: "Tells a random joke.",
	async function(bot, from){
		await bot.chat('Let me think...');
		let res = await axios.get('https://v2.jokeapi.dev/joke/Any?type=single');
		bot.chat(...res.data.joke.split('\n').map(e => `> ${e}`));
	}
});

chatBot.addCommand('help', {
	desc: `Print the allowed commands.`,
	async function(that, from){
		let intro = [
			'I am a bot owned and operated by',
			'wmantly <wmantly@gmail.com>',
			'You have access to the following commands:'
		]
		await that.whisper(from, ...intro, ...Object.keys(that.commands).map(command =>
			`${command} -- ${that.commands[command].desc || ''}`
		));
	}
});
