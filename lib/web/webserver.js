// webserver for omnibot

var mods = require("../mods.js");

var express = require("express"),
	ws = require("ws"),
	app = express(),
	wss = new ws.Server({ port: 1349 });

var ClientList = {};

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
console.log("[omni] Webserver started on port ::1350 (websocket ::1349)");

wss.on("connection", function(socket) {
	socket.on("message", function(msg) {
		var msg = JSON.parse(msg);

		if (msg) {
			if (msg.f == "IDENTIFY") {
				if (msg.d.id) {
					if (!ClientList[msg.d.id])
						ClientList[msg.d.id] = [];

					ClientList[msg.d.id].push(socket);

					socket.send(JSON.stringify({ f: "IDENTITY", s: "AUTHORIZED" }));
				} else {
					socket.send(JSON.stringify({ f: "IDENTITY", s: "ERROR" }));
				}
			}
		}
	});
});

module.exports = {
	"getSockets": function(gid) {
		if (ClientList[gid])
			return new function() {
				this.clients = ClientList[gid];

				this.send = function(msg) {
					client.forEach(function(c) {
						c.send(msg);
					});
				}
			}
	}
}
