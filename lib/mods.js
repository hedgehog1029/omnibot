// permissions, sleep, etc

var commandeer = require("./commandeer.js");

var fs = require("fs");

var config = JSON.parse(fs.readFileSync(__dirname + "/../config/config.json", 'utf8'));

var ModuleLoader = {
	"load": function(m) {
		fs.readdir(__dirname + "/modules", function(err, files) {
			files.forEach(function(file) {
				var mod = require("./modules/" + file);

				if (!mod.name) {
					console.error("[omni] There was a problem loading module file " + file + "!\nError: module has no name!");
					return;
				}

				if (!mod.init) {
					console.error("[omni] There was a problem loading module " + mod.name + "!\nError: No init function provided!");
					return;
				}

				mod.init(config, m.manager);

				if (mod.exposed)
					mods[mod.name] = mod.exposed;
			});
		});
	}
}

var mods = {
	"loader": {
		"load": ModuleLoader.load
	}
}

module.exports = mods;