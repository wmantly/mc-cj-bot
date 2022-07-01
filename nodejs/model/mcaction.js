'use strict';

const {sleep} = require('../utils');
const mineflayer = require('mineflayer');
const minecraftData = require('minecraft-data');
const inventoryViewer = require('mineflayer-web-inventory');
const { pathfinder, Movements, goals: { GoalNear } } = require('mineflayer-pathfinder');
const Vec3 = require('vec3');

class MCAction{
	static Vec3 = Vec3

	constructor(cjbot){
		this.cjbot = cjbot;
		this.bot = this.cjbot.bot;

		this.__onReady();
	}

	__onReady(){

		inventoryViewer(this.bot);
		require('minecraft-data')(this.bot.version);

		this.cjbot.on('onReady', async ()=>{
			console.log('MCAction ready');

			this.bot.loadPlugin(pathfinder);

			this.mcData = minecraftData(this.bot.version);
			this.defaultMove = new Movements(this.bot, this.mcData);
			this.defaultMove.canDig = false
			this.bot.pathfinder.setMovements(this.defaultMove);
		});
	}

	__blockOrVec(thing){
		if(thing instanceof Vec3.Vec3) return this.bot.blockAt(thing);
		if(thing.constructor && thing.constructor.name === 'Block') return thing;

		throw new Error('Not supported block identifier');
	}

	async goto(block, range=2){
		block = this.__blockOrVec(block);

		return await this.bot.pathfinder.goto(new GoalNear(...block.position.toArray(), range));
	}

	async __nextContainerSlot(window, item) {
		let firstEmptySlot = false;

		await window.containerItems();

		for(let slot in window.slots.slice(0, window.inventoryStart)){
			if(window.slots[slot] === null ){
				if(!Number.isInteger(firstEmptySlot)) firstEmptySlot = Number(slot);
				continue;
			}
			if(item.type === window.slots[slot].type && window.slots[slot].count < window.slots[slot].stackSize){
				return slot;
			}
		}

		return firstEmptySlot;
	}

	async put(block, blockName, amount) {
		block = this.__blockOrVec(block);

		this.bot.openContainer(block);
		let window = await this.cjbot.once('windowOpen');

		for(let item of window.slots.slice(window.inventoryStart).filter(function(item){
			if(!item) return false;
			if(blockName && blockName !== item.name) return false;
			return true;
		})){
			let currentSlot = Number(item.slot);
			if(!window.slots[currentSlot]) continue;

			if(amount && !amount--) return;
			let chestSlot = await this.__nextContainerSlot(window, item);
			await this.bot.moveSlotItem(currentSlot, chestSlot)
			
			await this.bot.closeWindow(window);

			let res = await this.put(...arguments);
			if(res === false) return amount ? amount : false;
		}

		await this.bot.closeWindow(window);

		return amount ? amount : true;
	}

	async __nextInventorySlot(window, item) {
		let firstEmptySlot = false;

		for(let idx in window.slots.slice(window.inventoryStart)){
			let currentItem = window.slots[Number(idx)+window.inventoryStart]

			if(currentItem === null){
				if(!Number.isInteger(firstEmptySlot)) firstEmptySlot = Number(idx)+window.inventoryStart;
				continue;
			}
			if(currentItem.type === item.type && item.count < item.stackSize){
				return currentItem.slot;
			}
		}

		return firstEmptySlot;
	}

	async get(block, blockName, amount) {
		block = this.__blockOrVec(block);

		// Open the chest
		this.bot.openContainer(block);
		let window = await this.cjbot.once('windowOpen');

		for(let item of await window.containerItems()){
			if(item.slot > window.inventoryStart) break;
			let currentSlot = Number(item.slot);
			if(!window.slots[currentSlot]) continue;
			if(amount && !amount--) return;
			let inventorySlot = await this.__nextInventorySlot(window, item);

			await this.bot.moveSlotItem(currentSlot, inventorySlot)
			
			// let res = await this.get(...arguments);
			// if(res === false) return amount ? amount : false;
		}

		await this.bot.closeWindow(window);

		return amount ? amount : true;
	}

	async trade(villagerID, tradeID, amount){
		return await trade(this, villagerID, tradeID, amount)
	}

	getNearVillagers(distance=4){
		const villagers = Object.keys(this.bot.entities)
			.map(id => this.bot.entities[id])
			.filter(e => e.entityType === this.mcData.entitiesByName.villager.id);

		const closeVillagersId = villagers
			.filter(e => this.bot.entity.position.distanceTo(e.position) < distance)
			.map(e => e.id);

  		return closeVillagersId;
	}

}

// Trade helper functions
// I did NOT write this non-sens. I did have to hack it to *sometimes* work
// https://github.com/PrismarineJS/mineflayer/blob/a0befeb042fe3851ac35887da116c2910f505791/examples/trader.js



function trade (actionBot, id, index, count) {

  function hasResources (window, trade, count) {
    const first = enough(trade.inputItem1, count)
    const second = !trade.hasItem2 || enough(trade.secondaryInput, count)
    return first && second

    function enough (item, count) {
    	return true;
      return window.count(item.type, item.metadata) >= item.count * count
    }
  }
  return new Promise(async(resolve, reject)=>{
	  const bot = actionBot.bot
	  const e = bot.entities[id]
	  switch (true) {
	    case !e:
	      console.log(`cant find entity with id ${id}`)
	      break
	    case e.entityType !== actionBot.mcData.entitiesByName.villager.id:
	      console.log('entity is not a villager')
	      break
	    case bot.entity.position.distanceTo(e.position) > 2:
	      console.log('villager out of reach')
	      break
	    default: {
	      const villager = await bot.openVillager(e)
	      const trade = villager.trades[index]
	      count = count || trade.maxTradeuses - trade.tooluses

	      switch (true) {
	        case !trade:
	          villager.close()
	          console.log('trade not found')
	          break
	        case trade.inputItem1.name !== 'paper':
	        	console.log('villager does not have paper')
	        	villager.close()
	        case trade.tradeDisabled:
	          villager.close()
	          console.log('trade is disabled')
	          break
	        // case trade.maxTradeuses - trade.tooluses < count:
	        //   villager.close()
	        //   console.log('cant trade that often')
	        //   break;
	        case !hasResources(villager.window, trade, count):
	          villager.close()
	          console.log('dont have the resources to do that trade')
	          break
	        default:
	          console.log('starting to trade')

	          let timeout = setTimeout(async(resolve, villager)=>{
	          	console.log('trade Promise timeout reject');
	          	await villager.close()

	          	resolve();
	          }, 30000, resolve, villager);


	          while(true){
	          	try {
	          		console.log('doing trade')
		            await bot.trade(villager, index, count)
		            console.log(`traded ${count} times`)
		          } catch (err) {
		            console.log('an error acured while tyring to trade')
		            console.log(err)
	          		await villager.close();
	          		clearTimeout(timeout);

	          		return resolve()

		          }
	          }
	          clearTimeout(timeout);
	      }

	    }
	  }
	  return resolve();

  })
}

module.exports = {MCAction, Vec3};
