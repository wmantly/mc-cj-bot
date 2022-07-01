'use strict';

const {bot} = require('./mc-bot');
const {MCAction, Vec3} = require('../model/mcaction');
const {chatBot} = require('./mc-chatbot');
const {sleep} = require('../utils');

const actionBot = new MCAction(bot);

const autoeat = require('mineflayer-auto-eat');
bot.bot.loadPlugin(autoeat);

bot.once('spawn').then((data)=>{
	console.log('once spawn data', data);
	  bot.bot.autoEat.options = {
	    // priority: "saturation",
	    startAt: 20,
	    bannedFood: ["golden_apple", "enchanted_golden_apple", "rotten_flesh", ],
	  }
});

// This is not to be used, its here as a reference
chatBot.addCommand('do', {
	desc: `Make bot say stuff.`,
	allowed: ['wmantlys', 'useless666', 'tux4242'],
	ignoreLock: true,
	async function(...args){
		let [chat, from, action, ..._args] = args;
		console.log('doing action', action)
		let res = await actions[action](..._args)
		chat.whisper(from, 'done', res)
	}
});


let places = {
	villager: Vec3({x: -95610, y: 4, z: 142360 }),
	craftingTable: Vec3({x: -95620, y: 0, z: 142229}),
	sugerCaneChest: Vec3({ x: -95620, y: 1, z: 142230 }),
	emChest: Vec3({x: -95619, y: 0, z: 142229}),
	paperChest: Vec3({x: -95620, y: 0, z: 142228}),
}


let actions = {
	stashBotChest: async function(){
		console.log('trying botChest');
		await actionBot.goto(places.botChest);
		return await actionBot.put(places.botChest);
	},
	getBotChest: async function(){
		console.log('trying botChest');
		await actionBot.goto(places.botChest);
		return await actionBot.get(places.botChest);
	},
	makePaper: async function() {
		console.log('getting paper');
		await actionBot.get(places.sugerCaneChest);
		if(actionBot.bot.inventory.count(actionBot.mcData.itemsByName.sugar_cane.id) > 3){
			const recipes = actionBot.bot.recipesFor(actionBot.mcData.itemsByName.paper.id, null, 64, places.craftingTable)

			if(recipes.length) {
				try{
					await actionBot.bot.craft(recipes[0], 2304, actionBot.bot.blockAt(places.craftingTable))
				}catch(error){
					console.log(error)
				}
				return true
			}else{
				return 'no recipes'
			}
		}
	},
	makeEmBlock: async function() {
		console.log('')
		const recipes = actionBot.bot.recipesFor(actionBot.mcData.itemsByName.emerald_block.id, null, 1, places.craftingTable)

		if(recipes.length) {
			try{
				await actionBot.bot.craft(recipes[0], 10, actionBot.bot.blockAt(places.craftingTable))
			}catch(error){
				console.log(error)
			}
		}

		await actionBot.put(places.emChest, 'emerald_block');
		await actionBot.put(places.emChest, 'emerald');
		await actionBot.put(places.paperChest, 'paper');
	},
	trade: async function(villager){
		while(actionBot.bot.inventory.count(actionBot.mcData.itemsByName.paper.id) > 49){
			for(let villagerID of actionBot.getNearVillagers()){
				if(actionBot.bot.inventory.count(actionBot.mcData.itemsByName.paper.id) < 49){
					console.log('out of paper');
					return
				}
				try{
					// Trade 0 is always paper if its offered.
					await actionBot.trade(villagerID, 0, 2)
				}catch(error){
					console.log(error)
				}
				await sleep(1000)
			}
		}
	}
}

bot.on('onReady', async()=>{
	await sleep(10000);
	while(true){
		await actions.trade()
		await sleep(1000)
		await actions.makeEmBlock()
		await sleep(1000)
		await actions.makePaper()
		await sleep(1000)
	}
});

module.exports = {actionBot, bot}
