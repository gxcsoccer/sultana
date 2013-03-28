var ST_INITED = 0,
	ST_CLOSED = 1;

var Siosocket = function(id, socket) {
		if (!(this instanceof Siosocket)) {
			return new Siosocket(id, socket);
		}

		this.id = id;
		this.socket = socket;
		this.state = ST_INITED;
	};

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

	if (typeof data !== 'string') {
		data = JSON.stringify(data);
	}
	this.socket.send(data);
};

Siosocket.prototype.emit = function(event, data) {
	if (this.state !== ST_INITED) {
		return;
	}

	this.socket.emit(event, data);
}