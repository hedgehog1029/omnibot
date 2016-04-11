var commandeer = require("./commandeer.js"),
	mods = require("./mods.js");

commandeer.manager
.command("perms")
	.permission("manage")
	.usage("<query>")
	.help("Manage permissions.")
	.on(function(msg, args) {
		var q = msg.content.replace("omni perms", "").trim().replace(/<@(\d+)>/, "$1").replace("$guild", msg.guild.id);

		mods.perms.runQuery(q, function(err, result) {
			if (err) {
				msg.reply("An error occured!");
				return;
			}

			msg.reply("Executed query with output:\n>>> " + JSON.stringify(result));
		});
	})
	.bind()
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
	})
	.bind()
.command("jukebox")
	.help("Play a YouTube video. If no channel is specified, plays in your channel.")
	.usage("<play/stop/pause>")
	.sub("play")
		.usage("<video> [channel]")
		.on(function(msg, args) {
			if (args[0] != null) {
				
			}
		}).bind()
	.sub("stop")
		.on(function(msg, args) {

		}).bind()
	.bind()
;