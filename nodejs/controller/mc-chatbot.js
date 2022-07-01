'use strict';

const conf = require('../conf');
const {bot} = require('./mc-bot');
const {ChatBot} = require('../model/mcchat');
const {sleep} = require('../utils');

const chatBot = new ChatBot(bot);

chatBot.addCommand('inv', {
    desc: `Have bot invite you to its position`,
    allowed: ['wmantly', 'useless666', 'tux4242', 'VinceNL', 'Ethan63020', 'Ethan63021'],
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

module.exports = {chatBot, bot};
