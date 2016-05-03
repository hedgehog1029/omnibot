// permissions, sleep, etc

var commandeer = require("./commandeer.js");

var fs = require("fs");

var config = JSON.parse(fs.readFileSync(__dirname + "/../config/config.json", 'utf8'));

var ModuleLoader = {
	"load": function(m) {
		fs.readdir(__dirname + "/modules", function(err, files) {
			if (err) {
				console.error("[omni/MODLOADER] Failed to read modules directory:\n" + err);
				return;
			}

			files.forEach(function(file) {
				var mod;
				try {
					mod = require("./modules/" + file);
				} catch(e) {
					console.error("[omni/MODLOADER] Module " + file + " threw an error during require() call!");
					return;
				}

				if (!mod.name) {
					console.error("[omni/MODLOADER] There was a problem loading module file " + file + "!\nError: module has no name!");
					return;
				}

				if (!mod.init) {
					console.error("[omni/MODLOADER] There was a problem loading module " + mod.name + "!\nError: No init function provided!");
					return;
				}

				try {
					mod.init(config, m.manager);
					console.info("[omni/MODLOADER] Loaded module " + mod.name);
				} catch (e) {
					console.error("[omni/MODLOADER] Module " + mod.name + " threw an error while initializing:\n" + e);
					return;
				}

				if (mod.exposed != null)
					module.exports[mod.name] = mod.exposed;
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