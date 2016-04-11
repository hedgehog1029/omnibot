// command manager

var mods = require("./mods.js");

var listeners = {}
var invite_regex = new RegExp(/http[s]*:\/\/discord\.gg\/(\w+)/);
var joinurl = "https://discordapp.com/oauth2/authorize?&client_id=166509746298421248&scope=bot";

var Command = function(manager, alias) {
	this.manager = manager;
	this._ = {};
	this._.aliases = [alias];
	this._.permission = "normal";
	this._.usage = "";
	this._.help = "No help provided.";
	this._.commands = {};
	this._.callback = function(e, a) {
		if (this.commands[a[0]] != null)
			this.commands[a[0]]._.run(e, a.slice(1));
	};

	this.alias = function(alias) {
		if (alias == null) return this._.aliases[0];
		this._.aliases.push(alias);
		return this;
	}

	this.permission = function(permission) {
		if (permission == null) return this._.permission;
		this._.permission = permission;
		return this;
	}

	this.usage = function(usage) {
		if (usage == null) return this._.usage;
		this._.usage = usage;
		return this;
	}

	this.help = function(help) {
		if (help == null) return this._.help;
		this._.help = help;
		return this;
	}

	this.on = function(cb) {
		this._.callback = cb;
		return this;
	}

	this.sub = function(alias) {
		return new Command(this, alias);
	}

	this.bind = function() {
		for (var i = 0; i < this._.aliases.length; i++) {
			this.manager._.commands[this._.aliases[i]] = this;
		}

		this.manager._.helptopics.push(this);

		return this.manager;
	}

	this._.run = function(e, a) {
		this.callback(e, a);
	}
}

var CommandManager = function() {
	this._ = {};
	this._.commands = {};
	this._.helptopics = [];

	this.command = function(alias) {
		return new Command(this, alias);
	}

	this.dispatch = function(cmd, msg, args) {
		if (this._.commands[cmd] != null) {
			var c = this._.commands[cmd]

			mods.perms.hasPermission(msg.author, c.permission(), msg.guild, function(result) {
				if (result)
					c._.run(msg, args);
			});
		}
	}
}

function inviteTest(message) {
	if (invite_regex.test(message.content)) {
		var invid = invite_regex.exec(message.content)[1];
		var invite = global.InviteManager.resolve(invid);

		message.channel.sendMessage("Hi, " + message.author.username + "! I'm a bot! If you want me to join your server, you're gonna need to authorize me.");

		invite.then(function(invite) {
			message.channel.sendMessage("Click here to authorize me to join " + invite.guild.name + ": " + joinurl + "&guild_id=" + invite.guild.id);
			mods.permissions.addBringer(invite.guild.id, message.author.id);
		}).catch(function(err) {
			if (err)
				message.channel.sendMessage("Your invite was broken, but click this link: " + joinurl);
		});

		return;
	}
}

var manager = {
	"manager": new CommandManager(),
	"dispatch": function(message) {
		if (message.author.id == global.bot_id) return;
		if (message.isPrivate) {
			inviteTest(message);
		}

		var extract = message.content.toLowerCase().split(" ");

		if (extract[0] == "omni") {
			manager.manager.dispatch(extract[1], message, extract.slice(2));
		}
	}
}

module.exports = manager;