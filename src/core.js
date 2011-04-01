////////////////////////////////////////////////////////////////////////////////
// Core functionality
////////////////////////////////////////////////////////////////////////////////

var jOrder = function (json, options) {
	return jOrder.init(json, options);
};

jOrder.core = function (core) {
	var self = {
		// delegates all of a module's methods to the jOrder object
		delegate: function (module) {
			var method;
			for (method in module) {
				if (typeof module[method] === 'function') {
					jOrder[method] = module[method];
				}
			}
			return module;
		},
	
		// makes a shallow copy of the passed JSON
		// optionally renumbered
		shallow: function (json, renumber) {
			var result = [],
					i;
			if (renumber) {
				// new indices starting from 0
				for (i in json) {
					if (!isNaN(i)) {
						result.push(json[i]);
					}
				}
			} else {
				// retaining indices
				for (i in json) {
					if (!isNaN(i)) {
						result[i] = json[i];
					}
				}
			}
			return result;
		},

		// retrieves the keys of an object
		keys: function (object, values) {
			var result = [],
					key;
			for (key in object) {
				if (object.hasOwnProperty(key)) {
					result.push(key);
				}
			}
			return result;
		},
	
		// gathers the values of an object
		values: function (object) {
			var result = [],
					key;
			for (key in object) {
				if (object.hasOwnProperty(key)) {
					result.push(object[key]);
				}
			}
			return result;
		},
		
		// joins two objects by their shared keys
		join: function (left, right) {
			var result = {},
					key;
			for (key in left) {
				if (left.hasOwnProperty(key)) {
					result[left[key]] = right[key];
				}
			}
			return result;
		}
	};

	return self.delegate(self);
}(jOrder.core || {});

