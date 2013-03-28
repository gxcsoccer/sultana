module.exports = function() {
	return function(req, next) {
		console.log("here is in test1 middleware!");
		console.dir(req.data);
		next();
	};
};