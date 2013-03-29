var Sultana = require("./index"),
	app = Sultana();

app.use(Sultana.test1());

app.route("1001", function(data, next) {
	console.log("hello");
	next();
}, function(err, data) {
	console.log(data.data);
	data.socket.send("received");
});

app.start(7002);