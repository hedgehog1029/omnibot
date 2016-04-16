// small-json stream parser

var util = require("util");
var Writable = require("stream").Writable;

var JSONTransformer = function() {
	this.chunks = [];

	Writable.call(this, { decodeStrings: false });

	this._write = function(chunk, e, cb) {
		this.chunks.push(chunk);
		cb();
	}

	this.on("finish", function() {
		var final = this.chunks.join("");
		var obj = JSON.parse(final);

		this.emit("done", obj);
	});
}

util.inherits(JSONTransformer, Writable);

module.exports = JSONTransformer;