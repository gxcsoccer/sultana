var io = require("socket.io"),
	util = require("util"),
	EventEmitter = require("events").EventEmitter,
	Siosocket = require("./siosocket"),
	environment = process.env.NODE_ENV || "developement",
	ST_INIT = 0,
	ST_START = 1,
	incrId = 1,
	hasOwnProperty = Object.prototype.hasOwnProperty;

var Sultana = function() {
		if (!(this instanceof Sultana)) {
			return new Sultana();
		}

		this.state = ST_INIT;
		this.settings = {};

		this.__defineGetter__("events", function() {
			var evts = [];
			for (var key in this._events) {
				if (hasOwnProperty.call(this._events, key)) {
					evts.push(key);
				}
			}
			return evts;
		});
		EventEmitter.call(this);
	};

util.inherits(Sultana, EventEmitter);

module.exports = Sultana;

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
			socket.on(ev, function(data) {
				me.emit(ev, {
					eventtype: ev,
					socket: siosocket,
					data: data
				});
			});
		});

		socket.on("message", function(msg) {
			me.emit("message", {
				socket: siosocket,
				data: msg
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