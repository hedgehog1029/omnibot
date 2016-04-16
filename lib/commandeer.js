// command manager

var mods = require("./mods.js");

var listeners = {}
var invite_regex = new RegExp(/http[s]*:\/\/discord\.gg\/(\w+)/);
var joinurl = "https://discordapp.com/oauth2/authorize?&client_id=166509746298421248&scope=bot";

function listDemands(arr) {
	var str = "";
	for (var i = 0; i < arr.length; i++) {
		if (arr[i].type) str += arr[i].type + ", ";
		else str += arr[i] + ", ";
	}

	return str.substr(0, str.length - 2);
}

var ErrorSystem = function() {
	this.throw = function(e, msg) {
		e.reply("Error: " + msg);
	}
}

var TypedArgument = function(type, obj) {
	return { type: type, o: obj };
}

var ArgumentParser = function(raw) {
	this.rawList = raw;
	this.argsList = [];

	this.parse = function(e, cb) {
		for (var i = 0; i < this.rawList.length; i++) {
		 	var arg = this.rawList[i];

			if (arg.startsWith("<")) {
				if (arg.charAt(1) == "#") {
					var id = arg.replace(/<#(\d+)>/, "$1");

					var chs = e.guild.textChannels.filter(function(ch) {
						return ch.id == id;
					});

					if (chs != null && chs[0] != null) {
						this.argsList.push(TypedArgument("txt-ch", chs[0]));
					}
				} else if (arg.chatAt(1) == "@") {
					var id = arg.replace(/<@(\d+)>/, "$1");

					var usrs = e.guild.members.filter(function(u) {
						return u.id == id;
					});

					if (usrs != null && usrs[0] != null) {
						this.argsList.push(TypedArgument("user", usrs[0]));
					}
				}
			} else if (/\$guild/.test(arg)) {
				this.argsList.push(TypedArgument("guild", e.guild));
			} else if (/\$me/.test(arg)) {
				this.argsList.push(TypedArgument("user", e.author));
			} else if (/\$ch/.test(arg)) {
				this.argsList.push(TypedArgument("txt-ch", e.channel));
			} else if (/\$vc/.test(arg)) {
				if (e.member && e.member.getVoiceChannel())
					this.argsList.push(TypedArgument("voice-ch", e.member.getVoiceChannel()));
			} else {
				this.argsList.push(TypedArgument("text", arg));
			}
		}

		cb(this);
	}

	this.get = function(i) {
		return this.argsList[i];
	}

	this.length = function() {
		return this.argsList.length;
	}
}

var Command = function(manager, alias) {
	this.manager = manager;
	this._ = {};
	this._.aliases = [alias];
	this._.permission = "normal";
	this._.usage = "";
	this._.help = "No help provided.";
	this._.helptopics = [];
	this._.commands = {};
	this._.reqArgs = -1;
	this._.demandArgs = [];
	this._.callback = function(e, a) {
		if (this.commands[a.get(0)] != null && a.get(0).type == "text")
			this.commands[a.get(0)]._.run(e, a.slice(1));
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

	this.demand = function(i) {
		if (!Array.isArray(i)) {
			this._.reqArgs = i;
		} else {
			this._.reqArgs = i.length;
			this._.demandArgs = i;
		}
		
		return this;
	}

	this.bind = function() {
		for (var i = 0; i < this._.aliases.length; i++) {
			this.manager._.commands[this._.aliases[i]] = this;
		}

		this.manager._.helptopics.push(this);

		return this.manager;
	}

	this._.run = function(e, a, err) {
		if (this.reqArgs == -1) {
			this.callback(e, a);
		} else {
			if (a.length() >= this.reqArgs) {
				for (var i = 0; i < this.demandArgs.length; i++) {
					if (this.demandArgs[i] != a[i].type) {
						err.throw(e, "Argument error: Expected `" + listDemands(this.demandArgs) + "`, got `" + listDemands(a) + "`.");
						return;
					}
				}

				this.callback(e, a);
			} else {
				err.throw(e, "Argument error: Expected at least " + this.reqArgs + " arguments.");
			}
		}
	}
}

var CommandManager = function() {
	this._ = {};
	this._.commands = {};
	this._.helptopics = [];

	this.command = function(alias) {
		return new Command(this, alias);
	}

	this.dispatch = function(cmd, msg, args, err) {
		if (this._.commands[cmd] != null) {
			var c = this._.commands[cmd];

			mods.perms.hasPermission(msg.author, c.permission(), msg.guild, function(result) {
				if (result)
					c._.run(msg, args, err);
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
			//mods.permissions.addBringer(invite.guild.id, message.author.id);
		}).catch(function(err) {
			if (err)
				message.channel.sendMessage("Your invite was broken, but click this link: " + joinurl);
		});

		return;
	}
}

var manager = {
	"manager": new CommandManager(),
	"errors": new ErrorSystem(),
	"dispatch": function(message) {
		if (message.author.id == global.bot_id) return;
		if (message.isPrivate) {
			inviteTest(message);
		}

		var extract = message.content.toLowerCase().split(" "),
			parser = new ArgumentParser(extract.slice(2));
		if (extract[0] == "omni") {
			parser.parse(message, function(p) {
				manager.manager.dispatch(extract[1], message, p, manager.errors);
			});
		}
	}
}

module.exports = manager;