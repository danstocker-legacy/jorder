////////////////////////////////////////////////////////////////////////////////
// Logging
////////////////////////////////////////////////////////////////////////////////
var jOrder = function (jOrder, window) {
	// properties
	jOrder.logging = true;

	// general logging function
	jOrder.log = function (message, level) {
		if (!jOrder.logging) {
			return;
		}

		var log, warn, error;
		if (window.console) {
			log = function (msg) {
				window.console.log(msg);
			};
			warn = function (msg) {
				window.console.warn(msg);
			};
			error = function (msg) {
				window.console.error(msg);
			};
		} else if (typeof Sys !== 'undefined') {
			log = warn = error = function (msg) {
				Sys.Debug.trace(msg);
			};
		} else {
			log = function () {};
			warn = error = function (msg) {
				window.alert(msg);
			};
		}

		(function (prefix) {
			switch (level) {
			case 1:
				return warn(prefix + message);
			case 2:
				return error(prefix + message);
			default:
				return log(prefix + message);
			}
		})(jOrder.name + ": ");
	};

	// issues a warning
	jOrder.warning = function (message) {
		return jOrder.log(message, 1);
	};

	// issues an error
	jOrder.error = function (message) {
		return jOrder.log(message, 2);
	};
	
	return jOrder;
}(jOrder || {},
	window);

