////////////////////////////////////////////////////////////////////////////////
// Core functionality
////////////////////////////////////////////////////////////////////////////////

var jOrder = function (json, options) {
	return jOrder.table(json, options);
};

jOrder.core = function () {
	var self = {
		// delegates all of a module's properties to the jOrder object
		delegate: function (module, host, properties) {
			host = host || jOrder;
			var property;
			for (property in module) {
				if (
					// strict condition when no explicite property list given
					!properties && module.hasOwnProperty(property) ||
					// loose condition when explicite property list is present
					properties.hasOwnProperty(property) && (property in module)
				) {
					host[property] = module[property];
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
		
		// splits an object to keys and values
		split: function (object) {
			var keys = [],
					values = [],
					key;
			for (key in object) {
				if (object.hasOwnProperty(key)) {
					keys.push(key);
					values.push(object[key]);
				}
			}
			return {
				keys: keys,
				values: values
			};
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
}();

