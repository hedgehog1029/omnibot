// youtube.js - jukebox's youtube server

var ytdl = require("ytdl-core"),
	ffmpeg = require("fluent-ffmpeg");

module.exports = {
	"name": "youtube",
	"init": function(cfg, cmd) {
	},
	"exposed": {
		"info": function(url, cb) {
			ytdl.getInfo(url, function(err, info) {
				if (err) {
					console.error(err);
					return;
				}

				cb(info);
			});
		},
		"convert": function(url, decoder) {
			ffmpeg().input(ytdl(url)).noVideo().format("mp3").pipe(decoder, { end: true });
		}
	}
}