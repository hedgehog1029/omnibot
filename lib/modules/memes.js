var http = require("http"),
	querystring = require("querystring");

var JSONTransformer = require("../json-stream.js");
var config;

module.exports = {
	"name": "memes",
	"init": function(cfg, cmd) {
		config = cfg;

		http.get("http://api.imgflip.com/get_memes", function(res) {
			var parser = new JSONTransformer();
			res.pipe(parser);

			parser.on("done", function(response) {
				if (response.success) {
					response.data.memes.forEach(function(meme) {
						module.exports.exposed.memelist[meme.name.toLowerCase()] = meme.id;
					});
				}
			});
		});

		cmd.command("meme")
			.help("Make a meme!")
			.demand(1)
			.usage("<memeid/list>; <top text>; <bottom text>")
			.on(function(msg, args) {
				if (args.get(0).o == "list") {
					msg.reply("List of memes: https://imgflip.com/memetemplates");

					return;
				}

				var vargs = msg.content.split("omni meme ")[1].split(";");

				if (vargs.length < 3) {
					msg.reply("Insufficient arguments! Remember the semicolon seperator.");
					return;
				}

				var meme = vargs[0].trim().toLowerCase();
				var text0 = vargs[1].trim();
				var text1 = vargs[2].trim();

				module.exports.exposed.memeify(meme, text0, text1, function(data) {
					if (data)
						msg.reply(data.url);
				});
			}).bind();
	},
	"exposed": {
		"memelist": {},
		"memeify": function(meme, text0, text1, cb) {
			if (module.exports.exposed.memelist[meme]) {
				var mid = module.exports.exposed.memelist[meme];

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
			} else cb(null);
		}
	}
}