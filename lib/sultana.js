var io = require("socket.io"),
	fs = require("fs"),
	path = require("path"),
	util = require("util"),
	EventEmitter = require("events").EventEmitter,
	Siosocket = require("./siosocket"),
	utility = require("./util"),
	environment = process.env.NODE_ENV || "developement",
	ST_INIT = 0,
	ST_START = 1,
	incrId = 1;

var Sultana = function() {
		if (!(this instanceof Sultana)) {
			return new Sultana();
		}

		this.state = ST_INIT;
		this.settings = {};
		this.stack = [];

		this.__defineGetter__("events", function() {
			var evts = [];
			for (var key in this._events) {
				if (utility.hasOwnProperty(this._events, key)) {
					evts.push(key);
				}
			}
			return evts;
		});
		EventEmitter.call(this);
	};

util.inherits(Sultana, EventEmitter);

// 保留EventEmitter的on方法，以备后用
Sultana.prototype.$on = EventEmitter.prototype.on;

module.exports = Sultana;

/**
 * 版本号
 */
Sultana.version = "0.0.0";

/**
 * 内置的中间件
 */
Sultana.components = {};

/** 
 * 启动
 */
Sultana.prototype.start = function(port) {
	if (this.state == ST_START) {
		console.log("already start!");
		return;
	}

	var me = this;
	this.ws = io.listen(port);
	this.ws.on("connection", function(socket) {
		var siosocket = new Siosocket(incrId++, socket),
			events = me.events.concat(["message", "disconnect", "error"]);

		// for customize events
		events.forEach(function(ev) {
			socket.on(ev, function(rawData) {
				var req = {
					eventtype: ev,
					socket: siosocket,
					data: rawData
				};
				me.handle(req, function(err) {
					me.emit(ev, err, req);
				});
			});
		});

		me.emit("connection", siosocket);
	});
};

/**
 * 停止
 */
Sultana.prototype.close = function() {
	if (this.state == ST_INIT) {
		return;
	}

	var me = this;
	this.ws.server.close(function() {
		me.state = ST_INIT;
	});
};

/**
 * 配置
 */
Sultana.prototype.configure = function(evt, callback) {
	if (~evt.indexOf(environment)) {
		callback();
	}
};

/**
 * 设置参数
 */
Sultana.prototype.set = function(key, setting, attach) {
	this.settings[key] = setting;
	if (attach) {
		this[key] = setting;
	}
};

/**
 * 获取参数
 */
Sultana.prototype.get = function(key) {
	return this.settings[key];
};

/**
 * 使用中间件
 */
Sultana.prototype.use = function(route, fn, exclude) {
	if (!utility.isString(route) && !utility.isRegExp(route)) {
		fn = route;
		route = /.*/;
	}

	// wrap sub-apps
	if (utility.isFunction(fn.handle)) {
		var server = fn;
		fn.route = route;
		fn = function(data, next) {
			server.handle(data, next);
		};
	}

	if (!exclude) {
		exclude = function() {
			return false;
		};
	}

	if (!utility.isFunction(exclude)) {
		var exList = utility.isArray(exclude) ? exclude : [exclude];
		exclude = function(route) {
			return !~exList.indexOf(route);
		};
	}

	this.stack.push({
		route: route,
		handle: fn,
		exclude: exclude
	});
};

/**
 * 路由
 */
Sultana.prototype.on = Sultana.prototype.route = function() {
	var args = Array.prototype.slice.call(arguments, 0),
		evt = args[0],
		fns = args.slice(1, -1);
	console.log(evt);
	if (fns.length) {
		fns.forEach(function(fn) {
			this.use(evt, fn);
		}, this);
	}

	this.$on(evt, args[args.length - 1]);
};

/**
 * 处理
 */
Sultana.prototype.handle = function(data, out) {
	var stack = this.stack,
		index = 0;
	console.log(stack.length);

	function next(err) {
		var layer = stack[index++];

		// all done
		if (!layer) {
			if (out) return out(err);

			if (err) {
				data.socket.emit("error", err);
			}
		}

		// 如果在排除列表里面
		if (layer.exclude(data.eventtype)) {
			next(err);
			return;
		}

		if ((utility.isRegExp(layer.route) && layer.route.test(data.eventtype)) || (utility.isString(layer.route) && layer.route === data.eventtype)) {
			try {
				var arity = layer.handle.length;
				if (err) {
					if (arity === 3) {
						layer.handle(err, data, next);
					} else {
						next(err);
					}
				} else if (arity < 3) {
					layer.handle(data, next);
				} else {
					next();
				}
			} catch (e) {
				next(e);
			}
		} else {
			next(err);
		}
	}

	next();
};

/**
 * Auto-load bundled middleware with getters.
 */
fs.readdirSync(__dirname + '/middleware').forEach(function(filename) {
	if (!/\.js$/.test(filename)) {
		return;
	}
	var name = path.basename(filename, '.js'),
		load = function() {
			return require('./middleware/' + name);
		};
	Sultana.components.__defineGetter__(name, load);
	Sultana.__defineGetter__(name, load);
});