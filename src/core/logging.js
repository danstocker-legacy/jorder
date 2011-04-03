////////////////////////////////////////////////////////////////////////////////
// Logging
////////////////////////////////////////////////////////////////////////////////
/*global jOrder, window, Sys */

jOrder.logging = function (jOrder, window) {
	// utility functions
	var self,
			log;

	if (!window.console) {
		log = Sys && Sys.Debug ?
			// using Sys.Debug
			function (msg) {
				Sys.Debug.trace(msg);
			} :
			// no logging
			function () {};

		window.console = {
			log: log,
			warn: log,
			error: log
		};
	}
	
	// properties
	self = {
		// logs to console
		log: function (msg) {
			window.console.log(msg);
		},
		// issues a warning
		warn: function (msg) {
			window.console.warn(msg);
		}
		// use throw instead of console.error()
	};
	
	return jOrder.delegate(self);
}(jOrder,
	window);

