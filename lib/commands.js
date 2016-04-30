var commandeer = require("./commandeer.js"),
	mods = require("./mods.js");

commandeer.manager
.command("help")
	.alias("h")
	.help("Get help!")
	.on(function(msg, args) {
		var helptxt = "**OmniBot Help**\nAll commands are prefixed with `omni` (with a space).\n\n";
		var promises = [];

		msg.channel.sendTyping();

		for (var i = 0; i < commandeer.manager._.helptopics.length; i++) {
			promises.push(new Promise(function(resolve, reject) {
				var command = commandeer.manager._.helptopics[i];

				mods.perms.hasPermission(msg.author, command.permission(), msg.guild, function(result) {
					if (result)
						helptxt += "`" + command.alias() + " " + command.usage().trim() + ": " + command.help() + "`\n";

					resolve();
				});
			}));
		}

		Promise.all(promises).then(function() {
			msg.reply("Check your PMs.");
			msg.author.openDM().then(function(dm) {
				dm.sendMessage(helptxt);
			});
		});
	}).bind()
;