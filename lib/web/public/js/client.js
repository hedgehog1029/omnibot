// client.js

var u = {
	"exec": function(arr) {
		return function(e) {
			arr.forEach(function(f) {
				f(e);
			});
		}
	},
	"call": function(f, arg1, arg2) {
		return function() {
			f(arg1, arg2);
		}
	},
	"req": function(url, then) {
		return function() {
			m.request({ method: "GET", url: url, background: true }).then(m.redraw).then(then);
		}
	},
	"class": function(s) {
		var ele = document.querySelector(s);

		if (ele) {
			return new function() {
				this.classes = ele.className.split(" ");
				this.element = ele;

				this.add = function(cl) {
					if (this.classes.indexOf(cl) == -1)
						this.classes.push(cl);

					return this;
				}

				this.del = function(cl) {
					if (this.classes.indexOf(cl) != -1)
						this.classes.splice(this.classes.indexOf(cl), 1);

					return this;
				}

				this.update = function() {
					var className = this.classes.join(" ").trim();

					ele.className = className;

					return this;
				}
			}
		} else return null;
	},
	"spin": function(e) {
		var classes = e.target.getElementsByTagName("i").item(0).classList;

		classes.add("fa-cog", "fa-spin");
		classes.remove("fa-trash");
	}
}

var OmniComponent = {
	"controller": function() {
		var ctrl = {
      		"ticks": m.prop([
      			{ txt: "everyone.", class: "" },
  				{ txt: "music.", class: "" },
  				{ txt: "fun.", class: "" },
  				{ txt: "memes.", class: "" }
      		]),
      		"rotate": function() {
        		ctrl.ticks()[0].class = "up";
        		ctrl.ticks()[1].class = "up";
        		m.redraw();
        
        		window.setTimeout(function() {
          			ctrl.ticks()[0].class = "";
          			ctrl.ticks()[1].class = "";
          			ctrl.ticks().push(ctrl.ticks().shift());
          			m.redraw();
        		}, 1000);
      		}
    	}
    
    	window.setInterval(ctrl.rotate, 4000);

		return ctrl;
	},
	"view": function(ctrl) {
		document.title = "OmniBot";

		return m("div.page.splash", [
			m("div.header", [
				m("img.avatar", { src: "img/avatar.png" }),
				m("h1.t", "OmniBot"),
				m("p", "A Discord bot for ", m("div.ticker",
					m("ul", [
						ctrl.ticks().map(function(v) {
							return m("li", { className: v.class }, v.txt);
						})
					])
				)),
				m("a", { href: "/discord/join" }, "Get OmniBot")
			])
		]);
	}
}

var SubContent = { _: {} };

SubContent._.get = function(page) {
	if (SubContent[page])
		return SubContent[page];
	else
		return SubContent.default;
}

SubContent.default = {
	"view": function(c, ctrl) {
		return m("div.sub", [
			m("h1", "Welcome to the OmniBot server page!"),
			m("p.bold", "Your server: " + ctrl.server().name),
			m("p", "Check out the left links for cool stuff.")
		]);
	}
}

SubContent.jukebox = {
	"controller": function(ctrl) {
		var c = {
			jukebox: m.prop({
				np: { title: "No music currently playing.", artist: "" },
				playlist: []
			}),
			refresh: function() {
				m.request({
					method: "GET",
					url: "/discord/server/" + ctrl.server().id + "/jukebox/playlist",
					unwrapSuccess: function(v) {
						return { np: (v.np ? v.np : c.jukebox().np), playlist: (v.playlist ? v.playlist : c.jukebox().playlist) }
					}
				}).then(c.jukebox).then(m.redraw);
			}
		}

		c.refresh();

		return c;
	},
	"view": function(c, ctrl) {
		return m("div.sub.jukebox", [
			m("h1", "Jukebox", m("a", { onclick: c.refresh }, "refresh")),
			m("hr"),
			m("p.inline", m("h3", "Now Playing: "), c.jukebox().np.title + " - " + c.jukebox().np.artist),
			m("h3", "Playlist:"),
			m("table.playlist", [
				m("tr", [
					m("th", "Track"),
					m("th", "Artist"),
					m("th.small", "Action")
				]),
				c.jukebox().playlist.map(function(v, i) {
					return m("tr", [
						m("td", v.meta.title),
						m("td", v.meta.artist),
						m("td", [
							m("a", { onclick: u.exec([ u.req("/discord/server/" + ctrl.server().id + "/jukebox/delete/" + i, c.refresh)]) }, m("i.fa.fa-trash.fa-2x"))
						])
					]);
				})
			])
		]);
	}
}

var ServerPage = {
	"controller": function() {
		var id = m.route.param("id"),
			page = m.route.param("page");

		var s = m.request({ method: "GET", url: "/discord/server/" + id });
		
		if (page)
			return { server: s, page: page };
		else
			return { server: s };
	},
	"view": function(ctrl) {
		document.title = "OmniBot | " + ctrl.server().name;

		return m("div.page", [
			m("div.menu", [
				m("h2.menu-head", "OmniBot"),
				m("img.mob", { src: "img/avatar.png" }),
				m("a", { href: "/server/" + ctrl.server().id, config: m.route }, m("i.fa.fa-home"), m("span", "Home")),
				m("a", { href: "/server/" + ctrl.server().id + "/jukebox", config: m.route }, m("i.fa.fa-music"), m("span", "Jukebox")),
				m("a", { href: "/discord/join/" + ctrl.server().id }, m("i.fa.fa-envelope"), m("span", "Invite"))
			]),
			m("div.main", [
				m("div.breadcrumb", [
					m("h2.server-title", { title: ctrl.server().name }, "Server: " + ctrl.server().name)
				]),
				m("div.content", m.component(SubContent._.get(ctrl.page), { server: ctrl.server }))
			])
		])
	}
}

window.addEventListener("load", function() {
	m.route.mode = "hash";
	m.route(document.body, "/", {
		"/": OmniComponent,
		"/server/:id": ServerPage,
		"/server/:id/:page": ServerPage
	});
});