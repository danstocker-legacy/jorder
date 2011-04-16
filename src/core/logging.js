////////////////////////////////////////////////////////////////////////////////
// Logging
////////////////////////////////////////////////////////////////////////////////
/*global jOrder, window, Sys */

jOrder.logging = function ($core) {
	// utility functions
	var self,
			log;

	if (!window.console) {
		log = window.Sys && window.Sys.Debug ?
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
			if (jOrder.logging) {
				window.console.log(msg);
			}
		},
		// issues a warning
		warn: function (msg) {
			if (jOrder.logging) {
				window.console.warn(msg);
			}
		}
		// use throw instead of console.error()
	};
	
	return $core.delegate(self);
}(jOrder.core);

