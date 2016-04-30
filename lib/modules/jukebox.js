var http = require("http"),
	querystring = require("querystring"),
	lame = require("lame"),
	request = require("request");

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
	"playlist": [],
	"isPlaying": false,
	"channels": {},
	"connections": {},
	"update": function(guild, cfg) {
		if (!Jukebox.isPlaying) {
			Jukebox.join(guild, function(vcc) {
				Jukebox.playNext(vcc, cfg);
			});
		}
	},
	"playNext": function(vcc, cfg) {
		var track = Jukebox.playlist.shift();

		if (!track) {
			Jukebox.leave(vcc.guild);
			return;
		}

		Jukebox.isPlaying = true;

		var decoder = new lame.Decoder();

		decoder.on("format", function(fmt) {
			var vccs = vcc.getEncoderStream({ sampleRate: fmt.sampleRate, channels: fmt.channels, frameDuration: 60 });
			vccs.resetTimestamp();

			decoder.pipe(vccs);

			bot.setGame({ name: track.meta.title + " - " + track.meta.artist });

			decoder.once("end", function() {
				Jukebox.playNext(vcc, cfg);
			});

			vccs.once("unpipe", function() {
				// idk?? response closes itself iirc
			});
		});

		request(track.url + "?client_id=" + cfg.soundcloud.id).pipe(decoder);
	},
	"join": function(guild, cb) {
		var vc = Jukebox.channels[guild.id];

		vc.join().then(function(vci) {
			Jukebox.connections[guild.id] = vci;

			cb(vci.voiceConnection);
		});
	},
	"leave": function(guild) {
		Jukebox.isPlaying = false;

		Jukebox.channels[guild.id].leave();
		Jukebox.connections[guild.id].voiceConnection.disconnect();

		Jukebox.connections[guild.id] = null;

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

					http.get("http://api.soundcloud.com/tracks/?" + query, function(res) {
						var transformer = new JSONTransformer();

						res.pipe(transformer);

						transformer.on("done", function(j) {
							if (j.length < 1) {
								msg.reply("Couldn't find any tracks with that name!");
								return;
							}

							var track = j[0];

							Jukebox.playlist.push(Track(track.title, track.user.username, track.stream_url));

							msg.reply("Added **" + track.title + "** by **" + track.user.username + "** to the playlist!");

							Jukebox.update(msg.guild, cfg);
						});
					});
				}).bind()
			.sub("skip")
				.permission("trusted")
				.help("Skip the currently playing track.")
				.on(function(msg, args) {

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

					if (args.get(0).o == "force") {
						Jukebox.channels[msg.guild.id] = null;
					}

					msg.reply("Left the voice channel" + (args.get(0).o == "force" ? " (and removed it from listing)" : "") + ".");
				}).bind().bind();
	}
}