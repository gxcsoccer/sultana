var toString = Object.prototype.toString,
	hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * 工具类
 */
var util = {
	isArray: function(input) {
		return toString.call(input) == "[object Array]";
	},
	isFunction: function(input) {
		return "function" == typeof input;
	},
	isString: function(input) {
		return toString.call(input) == "[object String]";
	},
	isRegExp: function(input) {
		return toString.call(input) == "[object RegExp]";
	},
	hasOwnProperty: function(owner, prop) {
		return hasOwnProperty.call(owner, prop);
	}
}

module.exports = util;
