'use strict';

const axios = require('axios');

const conf = require('../conf');
const {bot} = require('./mc-bot');
const {ChatBot} = require('../model/mcchat');
const {sleep} = require('../utils');

const chatBot = new ChatBot(bot);

chatBot.addCommand('inv', {
    desc: `Have bot invite you to its position`,
    allowed: ['wmantly', 'useless666', 'tux4242', /*'VinceNL', 'Ethan63020', 'Ethan63021'*/],
    async function(that, from){
        await that.say(`/invite ${from}`);
    }
});

chatBot.addCommand('.invite', {
	desc: `The bot will /accept an /invite from you.`,
	allowed: ['wmantly', 'useless666', 'tux4242'],
	async function(that, from){
		await that.whisper('Coming');
		await that.say(`/accept`);
	}
});

chatBot.addCommand('say', {
    desc: `Make bot say stuff.`,
    allowed: ['wmantlys', 'useless666', 'tux4242'],
    ignoreLock: true,
    async function(that, from, ...messages){
        await that.say((messages || []).join(' '));
    }
});

chatBot.addCommand("joke", {
    desc: "Tells a random joke.",
    async function(that, from){
        await that.say('Let me think...');
        let res = await axios.get('https://v2.jokeapi.dev/joke/Any?type=single')
        await that.say(...res.data.joke.split('\n').map(e => `> ${e}`));
    },
});

chatBot.addCommand("quote", {
    desc: 'Say an inspirational quote.',
    async function(that, from){
        await that.say('Right away!');
        let res = await axios.get('https://zenquotes.io/api/random')
        console.log('res', res)
        await that.say(`> ${res.data[0].q} -- ${res.data[0].a}`);
        
    }
});

chatBot.addCommand("fact", {
    desc: `Say a random fact.`,
    async function(that, from){
        await that.say('The internet says this is true?');
        let res = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en')
        await that.say(`> ${res.data.text}\n > source: ${res.data.source}`);
    }
});

chatBot.addCommand("advice", { 
    desc: `Sat some random advice`,
    async function(that, from){
        await that.say(['Try this:']);
        let res = await axios.get('https://api.adviceslip.com/advice');
        await that.say(`> ${res.data.slip.advice}`);
        
    }
});

chatBot.addCommand('west-quote', { 
    desc: `Say a random Kanya West quote.`,
    async function(that, from) {
        await that.say('And here we go!');
        let res = await axios.get('https://api.kanye.rest/');
        await that.say(`> ${res.data.quote} -- Kanya West`);
        
    }
});

chatBot.addCommand('idea', {
    desc: `Say a random start up idea.`,
    async function(that, from){
        await that.say('How about?');
        let res = axios.get('https://itsthisforthat.com/api.php?text')
        await that.say(`> ${res.data}`);
    }
});

chatBot.addCommand('discord', {
    desc: `Say the CJ discord invite link.`,
    async function(that, from) {
        await that.say('https://discord.gg/K4vqHJGf');
    }
});

chatBot.addCommand('help', {
    desc: `Print the allowed commands`,
    async function(that, from){
        let intro = [
            'I am a bot owned and operated by',
            'wmantly <wmantly@gmail.com>',
            'You have access to the following commands:'
        ]
        await that.whisper(from, ...intro, ...reduceCommands(from).map(command =>
            `${command} -- ${commands[command].desc || ''}`
        ));
    }
});



module.exports = {chatBot, bot};
