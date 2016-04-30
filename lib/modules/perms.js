var relations = require("relations");

module.exports = {
	"name": "perms",
	"init": function(config, cmd) {
		relations.use(relations.stores.memory, {
			dataFile: __dirname + "/../../config/perms.json"
		});

		relations.define("ranks", {
			owner: ["admin", "manage", "trusted", "normal", "devtools"],
			admin: ["admin", "trusted", "normal"],
			developer: ["trusted", "devtools", "normal"],
			trusted: ["trusted", "normal"],
			normal: ["normal"]
		});

		relations.ranks("97707213690249216 is an owner");

		cmd.command("perms")
			.permission("manage")
			.demand(1)
			.usage("<query>")
			.help("Manage permissions.")
			.on(function(msg, args) {
				var q = msg.content.replace("omni perms", "").trim().replace(/<@(\d+)>/, "$1").replace("$guild", msg.guild.id);

				module.exports.exposed.runQuery(q, function(err, result) {
					if (err) {
						msg.reply("An error occured!");
						return;
					}

					msg.reply("Executed query with output:\n>>> " + JSON.stringify(result));
				});
			})
			.bind()
	},
	"exposed": {
		"addRole": function(name, perms) {
			relations.ranks.addRole(name, perms);
		},
		"runQuery": relations.ranks,
		"hasPermission": function(user, perm, guild, cb) {
			if (perm == "normal") {
				cb(true);
				return;
			}

			relations.ranks("Can %s %s %s?", user.id, perm, guild.id, function(err, result) {
				if (err) throw err;

				cb(result);
			});
		}
	}
}