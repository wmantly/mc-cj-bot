'use strict';

const {bot} = require('./mc-bot');
const {chatBot} = require('./mc-chatbot');
const {MCAction, Vec3} = require('../model/mcaction');
const {sleep} = require('../utils');

const actionBot = new MCAction(bot);


actionBot.actionAdd('getSugarCane',{
    where: Vec3({ x: -95620, y: 1, z: 142230 }),
    // timeout: 1000,
    skip: true,
    until: async function(){
    	console.log('until get sugar cane',  actionBot.inventoryCount('sugar_cane'), actionBot.inventoryCount('paper'))
       return (actionBot.inventoryCount('sugar_cane') > 64  || actionBot.inventoryCount('paper') > 64) 
   },
    async function(){;
    	console.log('in getSugarCane')
        await actionBot.get(this.where, 'sugar_cane');
    }
});

actionBot.actionAdd('craftPaper', {
    where: Vec3({x: -95620, y: 0, z: 142229}),
    timeout: 360000,
    skip: true,
    until: async function(){
    	console.log('until craftPaper', actionBot.inventoryCount('sugar_cane') < 3)
       return actionBot.inventoryCount('sugar_cane') < 3
    },
    async function(){
        const recipes = actionBot.bot.recipesFor(actionBot.mcData.itemsByName.paper.id, null, null , this.where)
        await actionBot.bot.craft(recipes[0], null, actionBot.bot.blockAt(this.where))
    }
});

actionBot.actionAdd('trade', {
    async function(villager, tradeIndex, returnItemCount){
		actionBot.bot.lookAt(villager.position);
		bot.bot.setControlState('forward', true);
		await sleep(750);
		bot.bot.setControlState('forward', false);

        await actionBot.trade(villager.id, tradeIndex, returnItemCount)
    }    
});

actionBot.actionAdd('craftEmeraldBlock', {
    where: Vec3({x: -95620, y: 0, z: 142229}),
    until: async function(){
		console.log('until craft em block', actionBot.inventoryCount('emerald') < 9)
		return actionBot.inventoryCount('emerald') < 9
    },
    skip: true,
    timeout: 60000,
    async function(){
        const recipes = actionBot.bot.recipesFor(actionBot.mcData.itemsByName.emerald_block.id, null, 1, this.where)
        await actionBot.bot.craft(recipes[0], 10, actionBot.bot.blockAt(this.where))
    }
});

actionBot.actionAdd('putEmeraldBlock', {
    where: Vec3({x: -95619, y: 0, z: 142229}),
    until: async function(){
       return actionBot.inventoryCount('emerald_block') === 0
    },
    skip: true,
    async function() {
        await actionBot.put(this.where, 'emerald_block');
    }
});

actionBot.actionAdd('putEmerald', {
    where: Vec3({x: -95619, y: 0, z: 142229}),
    until: async function(){
       return actionBot.inventoryCount('emerald') === 0
    },
    skip: true,
    async function() {
        await actionBot.put(this.where, 'emerald');
    }
});

actionBot.actionAdd('tradePaperLoop',{
    until: async function(){
       return actionBot.inventoryCount('paper') < 64
    },
    skip: true,
    timeout: 600000,
    untilCoolDown: 120000,
    async function(){
        for(let villager of actionBot.getNearVillagers(10)){
            try{
                await actionBot.action('trade', villager, 0, 2);
            }catch(error){
                if(error.message === 'This is not a villager') continue;
                if(error.message === 'Not enough items to trade') return;
            }
        if(actionBot.inventoryCount('paper') < 64) break;
        }
    }
});

actionBot.addRoutine('emeraldJob', {
    actions:[
        'getSugarCane',
        'craftPaper',
        'tradePaperLoop',
        'craftEmeraldBlock',
        'putEmeraldBlock',
        'putEmerald',
    ],
    steepCoolDown: 500,
});


actionBot.actionAdd('randomMovement', {
	timeout:30000,
	async function(){
		actionBot.bot.setControlState('left', true);
		await sleep(4000);
		actionBot.bot.setControlState('left', false);
		actionBot.bot.setControlState('right', true);
		await sleep(4000);
		actionBot.bot.setControlState('right', false);
		actionBot.bot.setControlState('forward', true);
		await sleep(4000);
		actionBot.bot.setControlState('forward', false);
		actionBot.bot.setControlState('back', true);
		await sleep(4000);
		actionBot.bot.setControlState('back', false);
	}
})

bot.on('spawn', async()=>{
	console.log('in spawn')
	await sleep(2000);
	await actionBot.action('randomMovement');

	await actionBot.routine('emeraldJob');
});

module.exports = {actionBot}
