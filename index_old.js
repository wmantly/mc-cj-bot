require('dotenv').config();
const mineflayer = require('mineflayer');
const axios = require('axios');

const minecraftBot = mineflayer.createBot({
    host: process.env.MINECRAFT_SERVER_ADRESS,
    username: process.env.MINECRAFT_USERNAME,
    password: process.env.MINECRAFT_PASSWORD,
    version: '1.18.2',
    auth: process.env.MINECRAFT_AUTH || undefined,
});

// Hold methods only used on CJ server
minecraftBot.cj = {};

minecraftBot.cj.parsePlayers = function(){
    for (const [username, value] of Object.entries(minecraftBot.players)){
        value.lvl = Number(value.displayName.extra[0].text)
    }

    return minecraftBot.players;
}

minecraftBot.cj.slowChat = function(...messages){
    let count = 0;

    for(message of messages){
        count += Math.floor(Math.random() * (3000 - 1500) + 1500);
        setTimeout(function(message){
            // console.log('slowChat out', message)
            minecraftBot.chat(message);
        }, count, message);   
    }

    return count;
}

minecraftBot.cj.slowWhisper = function(to, ...messages){
    minecraftBot.cj.slowChat(...messages.map(message=>`/msg ${to} ${message}`))
};

let ballOptions = [
    "It is certain.",
    "It is decidedly so.",
    "Without a doubt.",
    "Yes definitely.",
    "You may rely on it.",
    "As I see it, yes.",
    "Most likely.",
    "Outlook good.",
    "Yes.",
    "Signs point to yes.",
    "Reply hazy, try again.",
    "Ask again later.",
    "Better not tell you now.",
    "Cannot predict now.",
    "Concentrate and ask again.",
    "Don't count on it.",
    "My reply is no.",
    "My sources say no.",
    "Outlook not so good.",
    "Very doubtful.",
];

commands = {
    joke: {
        desc: " Tells a random joke.",
        function(from){
            minecraftBot.chat('Let me think...');
            axios.get('https://v2.jokeapi.dev/joke/Any?type=single').then(res => {
                let time = minecraftBot.cj.slowChat(...res.data.joke.split('\n').map(e => `> ${e}`));
                unLockCommand(time);
            });
        },
    },
    say: {
        desc: `Make bot say stuff.`,
        allowed: ['wmantly', 'useless666', 'tux4242'],
        function(from, ...messages){
            // console.log('saying from', from, ':', ...messages)
            minecraftBot.chat((messages || []).join(' '))
            unLockCommand(1);
        }
    },
    inv:{
        desc: `Have bot invite you to its position`,
        allowed: ['wmantly', 'useless666', 'VinceNL', 'Ethan63020', 'Ethan63021'],
        function(from){
            minecraftBot.chat(`/invite ${from}`)
            unLockCommand(1);
        }
    },
    quote:{
        desc: 'Say an inspirational quote.',
        function(from){
            minecraftBot.chat('Right away!');
            axios.get('https://zenquotes.io/api/random').then(res => {
                let time = minecraftBot.cj.slowChat(`> ${res.data[0].q} -- ${res.data[0].a}`);
                unLockCommand(time);
            });
        }
    },
    fact:{
        desc: `Say a random fact.`,
        function(from){
            minecraftBot.chat('The internet says this is true?');
            axios.get('https://uselessfacts.jsph.pl/random.json?language=en').then(res => {
                let time = minecraftBot.cj.slowChat(`> ${res.data.text}\n > source: ${res.data.source}`);
                unLockCommand(time);
            });
        }
    },
    advice: { 
        desc: `Say some random advice`,
        function(from){
            minecraftBot.chat('Try this:');
            axios.get('https://api.adviceslip.com/advice').then(res => {
                let time = minecraftBot.cj.slowChat(`> ${res.data.slip.advice}`);
                unLockCommand(time);
            });
        }
    },
    'west-quote':{ 
        desc: `Say a random Kanya West quote.`,
        function(from) {
            minecraftBot.chat('And here we go!');
            axios.get('https://api.kanye.rest/').then(res => {
                let time = minecraftBot.cj.slowChat(`> ${res.data.quote} -- Kanya West`);
                unLockCommand(time);
            });
        }
    },
    idea:{
        desc: `Say a random start up idea.`,
        function(from){
            minecraftBot.chat('How about?');
            axios.get('https://itsthisforthat.com/api.php?text').then(res => {
                let time = minecraftBot.cj.slowChat(`> ${res.data}`);
                unLockCommand(time);
            });
        }
    },
    discord:{
        desc: `Say the CJ discord invite link.`,
        function(from) {
            minecraftBot.chat('https://discord.gg/K4vqHJGf');
            unLockCommand(1);
        }
    },
    '8ball': {
        desc: `magic 8 Ball pick.`,
        function(from){
            minecraftBot.cj.slowChat(...[
                `> The 8 Ball says...`,
                `> ${ballOptions[Math.floor(Math.random()*ballOptions.length)]}`
            ]);
            unLockCommand(1);
        }
    },
    dice: {
        desc: `Roll a die. You can state the max size on the dice. Default is 6.`,
        function(from, size){
            size = size || 6;
            if(!Number.isInteger(Number(size))){
                minecraftBot.cj.slowWhisper(from, `${size} is not a whole number...`)
                return unLockCommand(1);
            }
            let time = minecraftBot.cj.slowChat(...[
                `> Rolling a dice for ${from}`,
                `> ${Math.floor(Math.random()*size)+1}`
            ]);
            unLockCommand(time);
        }
    },
    'random-player': {
        desc: `Return a random online player`,
        function(from){
            let players = minecraftBot.cj.parsePlayers()
            
            delete players[minecraftBot.entity.username]

            let keys = Object.keys(players);
            let player = players[keys[ keys.length * Math.random() << 0]];

            minecraftBot.chat(`> I pick [${player.lvl}]${player.username}`)
            unLockCommand(1)
        }
    },
    'flip':{
        desc: `Flip a coin`,
        function(from){
             minecraftBot.cj.slowChat(...[
                `> Flipping a coin for ${from}`,
                `> ${!!(Math.floor(Math.random() * (3000 - 1500) + 1500)%2) ? "Heads" : "Tails"}`
            ]);
             unLockCommand(1)
        }
    },
    help:{
        desc: `Print the allowed commands`,
        function(from){
            let intro = [
                'I am a bot owned and operated by',
                'wmantly <wmantly@gmail.com>',
                'You have access to the following commands:'
            ]
            let time = minecraftBot.cj.slowWhisper(from, ...intro, ...reduceCommands(from).map(command =>
                `${command} -- ${commands[command].desc || ''}`
            ));
            unLockCommand(time || 1);
        }
    }
}

commandLock = false;

function reduceCommands(from, _commands){
    commands = _commands ||  commands;
    return Object.keys(commands).filter(command =>{
        if (commands[command].allowed && !commands[command].allowed.includes(from)) return false;
        return true;
    });
}

function unLockCommand(time){
    setTimeout(function(){
        commandLock = false;
    }, time+15000)
}

function doCommand(from, command){
    if(commandLock){
        minecraftBot.chat(`/msg ${from} cool down, try again in 15 seconds...`);
        return ;
    }

    let [cmd, ...parts] = command.split(/\s+/);

    if(reduceCommands(from).includes(cmd)){
        commandLock = true;
        commands[cmd].function(from, ...parts);
    }else{
        minecraftBot.chat(`/msg ${from} I dont know anything about ${cmd}.`)
        return false;   
    }

}

function handleTeleportInvite(from){
    if(['wmantly', 'useless666', 'tux4242'].includes(from)){
        minecraftBot.chat('/accept');
    }else{
        minecraftBot.chat(`/msg ${from} no thanks...`)
    }
}

minecraftBot.on('chat', (from, message, wtf) => {
    console.log('chat 1')

    if(from === minecraftBot.entity.username) return;

    if(message.startsWith(minecraftBot.entity.username)) doCommand(from,
        message.replace(`${minecraftBot.entity.username} ` , ' ').trim()
    )
});

minecraftBot.on('chat', (from, message, wtf) => {
    console.log('chat 2')
});


minecraftBot.on('whisper', (from, message) => {
    if(from === minecraftBot.entity.username) return;

    if(from && message) doCommand(from,
        message.replace(`${minecraftBot.entity.username} ` , ' ').trim()
    )
});

minecraftBot.on('message', function(message, type){
    try{
        if(type === 'chat'){
            let [completeMsg, lvl, username, msg] = message.toString().match(/(\d*)] (.*)\>\s(.*)/) || [message];

            // console.log(lvl, username, msg);

            if(username === minecraftBot.entity.username) return;

        }else if(type === 'system' && message.toString().includes('whispers:')){
            let [completeMsg, username, msg] = message.toString().trim().match(/(.*) whispers: (.*)/) || [message]

            // console.log('whisper', username, msg)

           
        }else if(type === 'system' && message.toString().includes(' to teleport to you')){
            // console.log('teleport msg', message.toString())
        }else if(type === 'system' && message.toString().includes('teleported to you')){
            // console.log('teleport msg complete', message.toString())
        }else if(type === 'system' && message.toString().includes('You whisper to')){
            // console.log('whisper sent', message.toString())
        }else if(type === 'system' && message.toString().includes(' joined the game')){
            // console.log(message.toString())
        }else if(type === 'system' && message.toString().includes("Don't worry if you don't see people on:")){
            // console.log(message.toString())
        }else if(type === 'system' && message.toString().includes(' invited you to teleport to him.')){
            // teleport invite
            handleTeleportInvite(message.toString().split(' ')[0])

        }else if(type === "game_info") {
            // console.log('game_info', message.toString(), arguments)
        }else{
            console.log('other message type', type, message.toString(), arguments)
        }

    }catch(error){
        console.error('ERROR! mcbot on message', error);
    }
});

minecraftBot.on('end', function(data){
    console.error('MC on end', data)
    process.exit(1);
});

minecraftBot.on('error', function(error){
    console.error("ERROR!!! mcbot on error", error)
    process.exit(1);
});

// module.exports = { minecraftEvents };

