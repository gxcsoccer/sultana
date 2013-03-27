var util = require("util"),
	EventEmitter = require("events").EventEmitter,
	ST_INITED = 0,
	ST_CLOSED = 1;

var Siosocket = function(id, socket) {
		if (!(this instanceof Siosocket)) {
			return new Siosocket(id, socket);
		}

		this.id = id;
		this.socket = socket;
		this.state = ST_INITED;

		EventEmitter.call(this);
	};

util.inherits(Siosocket, EventEmitter);

module.exports = Siosocket;

Siosocket.prototype.disconnect = function() {
	if (this.state === ST_CLOSED) {
		return;
	}

	this.state = ST_CLOSED;
	this.socket.disconnect();
};

Siosocket.prototype.send = function(data) {
	if (this.state !== ST_INITED) {
		return;
	}

	if (data.eventtype && data.data) {
		this.socket.emit(data.eventtype, data.data);
		return;
	}

	if (typeof data !== 'string') {
		data = JSON.stringify(data);
	}
	this.socket.send(data);
};