var Sultana = require("./index"),
	app = Sultana();

app.use(Sultana.test1());

app.on("1001", function(err, data) {
	console.log(data.data);
	data.socket.send("received");
});

app.start(7002);