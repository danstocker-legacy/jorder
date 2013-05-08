////////////////////////////////////////////////////////////////////////////////
// Logging
////////////////////////////////////////////////////////////////////////////////
/*global jOrder, window, console */

jOrder.logging = function ($core) {
	var lconsole = typeof window === 'object' ? window.console : console,
	
	// properties
	self = {
		// logs to console
		log: function (msg) {
			if (lconsole && jOrder.logging) {
				lconsole.log(msg);
			}
		},
		// issues a warning
		warn: function (msg) {
			if (lconsole && jOrder.logging) {
				lconsole.warn(msg);
			}
		},
		// use throw instead of console.error()
		// DEPRECATED
		error: function () {
			self.warn("Use throw instead of .error()");
		}
	};
	
	// legacy warning function
	// DEPRECATED
	self.warning = self.warn;
	
	return $core.delegate(self);
}(jOrder.core);

