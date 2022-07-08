'use strict';

const conf = require('../conf');
const {CJbot} = require('../model/minecraft');
const inventoryViewer = require('mineflayer-web-inventory');

const bot = new CJbot({host: conf.mc.server, ...conf.mc.bots.owen});

inventoryViewer(bot.bot);


module.exports = {bot};
