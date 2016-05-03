// webserver for omnibot

var mods = require("../mods.js");

var express = require("express"),
	app = express();

app.use(express.static(__dirname + "/public"));

app.get("/discord/server/:id", function(req, res) {
	var id = req.params.id;
	var guild = discordie.Guilds.get(id);

	if (guild)
		res.send({ status: "ok", id: id, name: guild.name });
	else
		res.send({ status: "bad" });
});

app.get("/discord/server/:id/jukebox/playlist", function(req, res) {
	var id = req.params.id;

	var playlist = mods.jukebox.playlist()[id];
	var np = mods.jukebox.nowplaying(id);

	if (playlist && np)
		res.send({ status: "ok", id: id, playlist: playlist, np: np });
	else
		res.send({ status: "bad" });
});

app.get("/discord/server/:id/jukebox/delete/:index", function(req, res) {
	var id = req.params.id;
	var index = req.params.index;

	if (id && index)
		mods.jukebox.delete(id, index);

	res.send({ status: "ok" });
});

app.get("/discord/join", function(req, res) {
	res.redirect("https://discordapp.com/oauth2/authorize?&client_id=174913532444278784&scope=bot");
});

app.get("/discord/join/:id", function(req, res) {
	res.redirect("https://discordapp.com/oauth2/authorize?&client_id=174913532444278784&scope=bot&guild_id=" + req.params.id);
});

app.listen(1350);
console.log("[omni] Webserver started on port ::1350");