var mineflayer = require('mineflayer');
console.log(process.env)
var mcBot = mineflayer.createBot({
  host: "mc.civclassic.com",              // optional
  username: process.env.MC_EMAIL,         // email and password are required only for
  password: process.env.MC_PASS,          // online-mode=true servers
  version: '1.10'
});

const LOCAL_CHAT_CHANNELS = [
	'316235146774708226', // #bots
]

const GROUP_MAPPINGS = {
	'CW-#general': '313388169095806986', // #general
	'CW-#civclassic': '320416260376494093', // #civclassic
	'CW-1': '325637706405117955', // #cw-1
}

const CHANNEL_MAPPINGS = {
	'313388169095806986': 'CW-#general', // #general
	'320416260376494093': 'CW-#civclassic', // #civclassic
	'325637706405117955': 'CW-1' // #cw-1
}

const Discord = require('discord.js');
const discordBot = new Discord.Client();

process.on("unhandledRejection", function (err) { throw err; })

discordBot.on('message', message => {
	if (LOCAL_CHAT_CHANNELS.indexOf(message.channel.id) != -1) {
		if(message.author.bot) {
			return;
		}
		MCchatQueue.add('', `[Discord] ${message.member.displayName}: ${message.cleanContent}`)
	}
	if (CHANNEL_MAPPINGS[message.channel.id]) {
		if(message.author.bot) {
			return;
		}
		MCchatQueue.add(CHANNEL_MAPPINGS[message.channel.id], `${message.member.displayName}: ${message.cleanContent}`)
	}
});

discordBot.login(process.env.DISCORD_TOKEN);

mcBot.on('message', function(message) {
	console.log('recieved', message.toString())
	const localRegex = /^([A-Za-z0-9_]+): (.+)$/
	const groupRegex = /^\[([A-Za-z#0-9-]+)\] ([A-Za-z0-9_]+): (.+)$/
	let match;
	if (match = localRegex.exec(message.toString())) {
		if (match[1] != mcBot.username){
			LOCAL_CHAT_CHANNELS.forEach(chanId => {
				const chan = discordBot.channels.get(chanId)
				if (chan) {
					chan.send(generateMsg(match[1], match[2]))
				}
			})
		}
	} else if (match = groupRegex.exec(message.toString())) {
		console.log(match);
		if(match[1] == 'CW-1' && match[3] == '!groups') {
			MCchatQueue.add(null, `/nlip CW-#general ${match[2]}`)
			MCchatQueue.add(null, `/nlip CW-#civclassic ${match[2]}`)
			return;
		}
		if (match[2] != mcBot.username){
			const chanId = GROUP_MAPPINGS[match[1]]
			if (chanId) {
				const chan = discordBot.channels.get(chanId)
				chan.send(generateMsg(match[2], match[3]))
			}
		}
	}
});

mcBot.on('kicked', function(message) {
	console.log(message)
})

mcBot.on('end', function(message) {
	discordBot.channels.get('316235146774708226').send(`@Gaelan@0424 disconnected`).then(() => process.exit())
})
/*
mcBot.on('playerJoined', function(player) {
	discordBot.channels.get('316235146774708226').send(`${player.username} joined`)
})

mcBot.on('playerLeft', function(player) {
	discordBot.channels.get('316235146774708226').send(`${player.username} left`)
})
*/
function generateMsg(mcName, text) {
	return `**${mcName}:** ${text}`
}

const MCchatQueue = {
	queue: [],
	state: null,
	add(type, message) {
		this.queue.push({type, message})
		console.log(this.queue)
	},
	exec() {
		if (this.queue.length == 0) {
			return
		} else {
			const msg = this.queue[0];
			if ((msg.type !== undefined) && (this.state !== msg.type)) {
				mcBot.chat(`/gc ${msg.type}`)
				console.log('set type to ' + msg.type)
				this.state = msg.type
			} else {
				mcBot.chat(msg.message.substring(0,199))
				console.log('sent ', msg.message)
				this.queue.shift();
			}
		}
	}
}

setInterval(() => MCchatQueue.exec(), 500);
