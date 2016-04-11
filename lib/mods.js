// permissions, sleep, etc

var fs = require("fs"),
	relations = require("relations");

relations.use(relations.stores.memory, { dataFile: __dirname + "/../config/perms.json" });
relations.define("ranks", {
	owner: ["admin", "manage", "trusted", "normal", "devtools"],
	developer: ["trusted", "devtools", "normal"],
	trusted: ["trusted", "normal"],
	normal: ["normal"]
});

relations.ranks("97707213690249216 is an owner");

var mods = {
	"data": {
		"save": function() {
			fs.writeFile(__dirname + "/../config/data.json", JSON.stringify(data), function(err) {
				if (err) console.log(err);
			});
		}
	},
	"perms": {
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

module.exports = mods;