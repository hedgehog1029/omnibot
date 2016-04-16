// permissions, sleep, etc

var fs = require("fs"),
	http = require("http"),
	querystring = require("querystring"),
	relations = require("relations");

var JSONTransformer = require("./json-stream.js");
var config = JSON.parse(fs.readFileSync(__dirname + "/../config/config.json", 'utf8'));

relations.use(relations.stores.memory, { dataFile: __dirname + "/../config/perms.json" });
relations.define("ranks", {
	owner: ["admin", "manage", "trusted", "normal", "devtools"],
	admin: ["admin", "trusted", "normal"],
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
	},
	"memes": {
		"memelist": {},
		"init": function() {
			http.get("http://api.imgflip.com/get_memes", function(res) {
				var parser = new JSONTransformer();
				res.pipe(parser);

				parser.on("done", function(response) {
					if (response.success) {
						response.data.memes.forEach(function(meme) {
							mods.memes.memelist[meme.name.toLowerCase()] = meme.id;
						});
					}
				});
			});
		},
		"memeify": function(meme, text0, text1, cb) {
			if (mods.memes.memelist[meme]) {
				var mid = mods.memes.memelist[meme];

				var params = querystring.stringify({
					template_id: mid,
					username: config.imgflip.username,
					password: config.imgflip.password,
					text0: text0,
					text1: text1
				});

				http.get("http://api.imgflip.com/caption_image?" + params, function(res) {
					var parser = new JSONTransformer();
					res.pipe(parser);

					parser.on("done", function(response) {
						if (response.success) {
							cb(response.data);
						}
					});
				});
			}
		}
	}
}

mods.memes.init();

module.exports = mods;