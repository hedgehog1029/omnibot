var http = require("http"),
	querystring = require("querystring"),
	lame = require("lame"),
	request = require("request");

var webserver = require("../web/webserver.js");

var JSONTransformer = require("../json-stream.js");

function Track(title, artist, streamurl) {
	return {
		meta: {
			title: title,
			artist: artist
		},
		url: streamurl
	}
}

var Jukebox = {
	"playlist": {},
	"nowplaying": {},
	"channels": {},
	"connections": {},
	"update": function(guild) {
		if (!Jukebox.connections[guild.id]) {
			Jukebox.join(guild, function(vcc) {
				Jukebox.playNext(vcc);
			});
		}
	},
	"playNext": function(vcc) {
		if (!vcc.guild) return;



		var track = Jukebox.playlist[vcc.guild.id].shift();

		if (!track) {
			Jukebox.leave(vcc.guild);
			return;
		}

		var decoder = new lame.Decoder();

		decoder.on("format", function(fmt) {
			var vccs = vcc.getEncoderStream({ sampleRate: fmt.sampleRate, channels: fmt.channels, frameDuration: 60 });
			vccs.resetTimestamp();

			decoder.pipe(vccs);

			bot.setGame({ name: track.meta.title + " - " + track.meta.artist });

			decoder.once("end", function() {
				Jukebox.playNext(vcc);
			});

			if (vcc.guild)
				Jukebox.nowplaying[vcc.guild.id] = { meta: track.meta, decoder: decoder };

			vccs.once("unpipe", function() {
				//Jukebox.playNext(vcc);
			});
		});

		request(track.url).pipe(decoder);
	},
	"join": function(guild, cb) {
		var vc = Jukebox.channels[guild.id];

		if (!vc) return;

		vc.join().then(function(vci) {
			Jukebox.connections[guild.id] = vci;

			cb(vci.voiceConnection);
		});
	},
	"leave": function(guild) {
		Jukebox.channels[guild.id].leave();
		Jukebox.connections[guild.id].voiceConnection.disconnect();

		Jukebox.connections[guild.id] = null;
		Jukebox.nowplaying[guild.id] = null;

		bot.setGame(null);
		return;
	}
}

module.exports = {
	"name": "jukebox",
	"init": function(cfg, cmd) {
		cmd.command("jukebox")
			.sub("soundcloud")
				.permission("normal")
				.demand(1)
				.usage("<track>")
				.help("Add Soundcloud tracks to the queue!")
				.on(function(msg, args) {
					var query = querystring.stringify({
						client_id: cfg.soundcloud.id,
						q: args.getFull()
					});

					if (!Jukebox.playlist[msg.guild.id])
						Jukebox.playlist[msg.guild.id] = [];

					http.get("http://api.soundcloud.com/tracks/?" + query, function(res) {
						var transformer = new JSONTransformer();

						res.pipe(transformer);

						transformer.on("done", function(j) {
							if (j.length < 1) {
								msg.reply("Couldn't find any tracks with that name!");
								return;
							}

							var track = j[0];

							Jukebox.playlist[msg.guild.id].push(Track(track.title, track.user.username, track.stream_url  + "?client_id=" + cfg.soundcloud.id));

							msg.reply("Added **" + track.title + "** by **" + track.user.username + "** to the playlist!");

							Jukebox.update(msg.guild);
						});
					});
				}).bind()
			.sub("url")
				.permission("normal")
				.demand(1)
				.usage("<mp3 url>")
				.help("Add a track by its stream url!")
				.on(function(msg, args) {
					if (!Jukebox.playlist[msg.guild.id])
						Jukebox.playlist[msg.guild.id] = [];

					Jukebox.playlist[msg.guild.id].push(Track("From URL", "Unknown", args.getFull()));
					msg.reply("Added that URL to the queue!");

					Jukebox.update(msg.guild);
				}).bind()
			.sub("skip")
				.permission("trusted")
				.help("Skip the currently playing track.")
				.on(function(msg, args) {
					var playing = Jukebox.nowplaying[msg.guild.id];

					if (playing) {
						try {
							playing.decoder.unpipe();

							if (Jukebox.connections[msg.guild.id])
								Jukebox.playNext(Jukebox.connections[msg.guild.id].voiceConnection);

							msg.reply("Skipped song **" + playing.meta.title + " - " + playing.meta.artist + "**.");
						} catch (e) {
							msg.reply("There was an error skipping the song. Perhaps it already finished.");
						}
					} else {
						msg.reply("No music currently playing.");
					}
				}).bind()
			.sub("np")
				.alias("nowplaying")
				.on(function(msg, args) {
					var track = Jukebox.nowplaying[msg.guild.id].meta;

					if (track)
						msg.reply("Now playing in " + Jukebox.channels[msg.guild.id].name + ": **" + track.title + "** by **" + track.artist + "**.");
					else
						msg.reply("No music currently playing.");
				}).bind()
			.sub("join")
				.permission("normal")
				.demand(1)
				.usage("Add a voice channel to the joinable list.")
				.on(function(msg, args) {
					if (args.get(0).type == "voice-ch") {
						Jukebox.channels[msg.guild.id] = args.get(0).o;

						msg.reply("Added your channel (" + args.get(0).o.name + ") to the music channel list!\nThis channel will be joined when music is requested on this server.");
					} else {
						msg.guild.voiceChannels.forEach(function(vc) {
							if (vc.name == args.getFull()) {
								Jukebox.channels[msg.guild.id] = vc;

								msg.reply("Added " + vc.name + " to the list!");
							}
						});
					}
				}).bind()
			.sub("leave")
				.permission("normal")
				.usage("Leave this server's VC.")
				.on(function(msg, args) {
					Jukebox.leave(msg.guild);

					if (args.get(0) && args.get(0).o == "force") {
						Jukebox.channels[msg.guild.id] = null;
					}

					msg.reply("Left the voice channel.");
				}).bind().bind();
	},
	"exposed": {
		"playlist": function() {
			return Jukebox.playlist;
		},
		"nowplaying": function(id) {
			if (Jukebox.nowplaying[id])
				return Jukebox.nowplaying[id].meta;
			else return null;
		},
		"delete": function(id, i) {
			var playlist = Jukebox.playlist[id];

			if (playlist)
				Jukebox.playlist[id].splice(i, 1);
		}
	}
};