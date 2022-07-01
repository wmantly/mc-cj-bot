'use strict';

const conf = require('../conf');
const {CJbot} = require('../model/minecraft');

const bot = new CJbot({host: conf.mc.server, ...conf.mc.bots.owen});

module.exports = {bot};
