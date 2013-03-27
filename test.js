var Sultana = require("./index"),
	app = Sultana();

app.on("1001", function(data) {
	console.log(data.data);
	data.socket.send("received");
});

app.start(7002);