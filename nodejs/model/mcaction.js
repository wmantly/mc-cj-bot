'use strict';

const {sleep} = require('../utils');
const mineflayer = require('mineflayer');
const minecraftData = require('minecraft-data');
const { pathfinder, Movements, goals: { GoalNear } } = require('mineflayer-pathfinder');
const Vec3 = require('vec3');

class MCAction{
	static Vec3 = Vec3
	isLocked = false
	actions = {};
	currentAction = false;

	constructor(cjbot){
		this.cjbot = cjbot;
		this.bot = this.cjbot.bot;

		this.__onReady();
		this.cjbot.on('onReady', this.__onReady.bind(this));
	}

	async __onReady(){
		this.bot.loadPlugin(pathfinder);
		this.mcData = minecraftData(this.bot.version);
		this.defaultMove = new Movements(this.bot, this.mcData);
		this.defaultMove.canDig = false
		this.bot.pathfinder.setMovements(this.defaultMove);
	}

	__blockOrVec(thing){
		if(thing instanceof Vec3.Vec3) return this.bot.blockAt(thing);
		if(thing.constructor && thing.constructor.name === 'Block') return thing;

		throw new Error('Not supported block identifier');
	}

	actionAdd(name, obj){
		if(this.actions[name]) throw new Error('Action already exists');
		if(!obj.function && typeof obj.function !== "function") throw new Error('Action must have a function')

		this.actions[name] = {name, ...obj};

		return true;
	}

	actionGoTo(action, reTry){
		return new Promise(async(resolve, reject)=>{

			let range = reTryCount ? 10 + (action.range || 0) : action.range;

			try{
				await this.goto(action.where, range)
				return reTry ? await this.actionGoTo(action) : resolve();
			}catch(error){
				if(reTry) return reject('Action can not move to where')
				await this.actionGoTo(action, true);
			}
		});
	}
	async action(name, ...args){
		if(!this.actions[name]) throw new Error('Action not found.');
		let action = this.actions[name];
		
		console.log('action', name)

		if(action.skip){
			if(action.skip === true && await action.until.call({...action, ...this}))return true;	
			if(typeof action.skip === 'function' && await action.skip.call({...action, ...this})) return true;
		}

		let handler = async (resolve, reject)=>{

			let clear = false;
			let error = false;
			

			if(action.where) await this.goto(action.where, action.range)

			if(action.timeout !== false){
				clear = setTimeout( async reject =>{
						if(this.bot.currentWindow){
							try{
								console.log('found open widow on timeout')
								await  this.bot.closeWindow(this.bot.currentWindow);
							}catch(error){
								console.log('error on close window timeout', error)
							}
						}
						reject('Action timed out.');
					},
					action.timeout || 10000,
					reject
				);
			}

			console.log('doing')

			try {
				var res = await action.function.call({...action, ...this}, ...args);}
			catch(error){
				error = error;
			}

			if(clear) clearInterval(clear);

			if(action.until && !await action.until.call({...action, ...this})){
				if(action.untilCoolDown){
					console.log('sleeping for until')
					await sleep(action.untilCoolDown)
				}
				console.log('until not met, running agian')
				return handler(resolve, reject)
			}


			return error ? reject(error) : resolve(res);
		}

		await (new Promise(handler));
	}

	routines = {}
	currentRoutine = false;

	async routine(name, ...args){
		if(!this.routines[name]) throw new Error('Routine not found.');
		let routine = this.routines[name];


		let state = routine.state = {
			run: true,
			step: 0,
			completeCount: 0,
		}

		while(true){
			let action = this.actions[routine.actions[state.step]];
			// console.log('action', action, routine.actions[state.step])


			try{
				await this.action(action.name);
			}catch(error){
				console.log(action.name, 'error', error)
				if(routine.onStepError){
					routine.onStepError(step)
				}
			}
			if(state.step++ == routine.actions.length-1){
				state.step = 0;
				state.completeCount++;
				if(routine.coolDown || routine.stepCoolDown) await sleep(routine.coolDown || routine.stepCoolDown);
			}else{
				if(routine.stepCoolDown) await sleep(routine.stepCoolDown);
			}
		}
	}

	addRoutine(name, obj){
		if(this.routines[name]) throw new Error('Action already exists');
		// if(!obj.function && typeof obj.function !== "function") throw new Error('Action must have a function')

		this.routines[name] = obj;

		return true;
	}

	inventoryCount(block){
		if(Number.isInteger(Number(block))) block = Number(block)
		else block = this.mcData.itemsByName[block].id

		return this.bot.inventory.count(block);
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
			console.log('in get')
			if(item.slot > window.inventoryStart) break;
			let currentSlot = Number(item.slot);
			if(!window.slots[currentSlot]) continue;
			if(amount && !amount--) break;
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
		case bot.entity.position.distanceTo(e.position) > 3:
		  console.log('villager out of reach')
		  break
		default: {
		  let villager;
		  let timeout = setTimeout(async(resolve, villager)=>{
		  	console.log('villager', villager ? villager : 'no villager loaded')
			console.log('trade Promise timeout reject');
			if(villager) try{
				await villager.close()

			}catch(error){
				console.error('villager close error', error)
				try{
					if(bot.currentWindow) await bot.currentWindow.close();
				}catch(error){

				}
			}
			resolve();
		  }, 5000, resolve, villager);

		  try{
			  console.log('getting villager')
			  villager = await bot.openVillager(e)
			  console.log('have villager')

			}catch(error){
				clearTimeout(timeout)
				return reject(error)
			}
		  const trade = villager.trades[index]
		  count = count || trade.maxTradeuses - trade.tooluses

		  switch (true) {
			case !trade:
			  console.log('trade not found')
			  villager.close()
			  break
			case trade.inputItem1.name !== 'paper':
				console.log('villager does not have paper')
				villager.close()
			case trade.tradeDisabled:
			  console.log('trade is disabled')
			  villager.close()
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



				try {
			  		await bot.trade(villager, index, count)
					console.log(`traded ${count} times`)
				  } catch (err) {
		  			clearTimeout(timeout);
					return reject(err)
				  }
			  await villager.close();
			  
		  }
		  clearTimeout(timeout);
		}
	  }
	  return resolve();

  })
}

module.exports = {MCAction, Vec3};
