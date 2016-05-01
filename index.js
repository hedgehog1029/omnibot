// omnibot - a discord bot

var discordie = require("discordie"),
	fs = require("fs");

var commandeer = require("./lib/commandeer.js"),
	commands = require("./lib/commands.js"),
	webserver = require("./lib/web/webserver.js"),
	mods = require("./lib/mods.js");

console.log("Starting OmniBot v0.1");

var config = JSON.parse(fs.readFileSync(__dirname + "/config/config.json", 'utf8'));
var bot = new discordie();

bot.connect({
	token: config.token
});

bot.Dispatcher.on(discordie.Events.GATEWAY_READY, function(e) {
	console.log("OmniBot started. Username: " + bot.User.username);

	global.InviteManager = bot.Invites;
	global.bot_id = bot.User.id;
	global.bot = bot.User;
	global.discordie = bot;
	//bot.User.edit(null, null, fs.readFileSync("profile.png")); // temp profile update

	mods.loader.load(commandeer);
});

bot.Dispatcher.on(discordie.Events.MESSAGE_CREATE, function(e) {
	commandeer.dispatch(e.message);
});