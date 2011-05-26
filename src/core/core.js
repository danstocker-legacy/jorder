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
	
		// creates a deep copy of the object recursively
		// optionally renumbered
		// WARNING: reference looping is NOT handled!
		deep: function (json, renumber) {
			var result,
					isArray = json && typeof json.length !== 'undefined',
					i;
			
			// renumber flag only valid if json is array
			renumber = isArray && renumber === true;
			
			// ordinal types are returned as is
			if (typeof json !== 'object' || json === null) {
				return json;
			}
			
			// processing arrays and hashtables
			result = isArray ? [] : {};
			for (i in json) {
				if (json.hasOwnProperty(i)) {
					if (renumber) {
						result.push(self.deep(json[i]));
					} else {
						result[i] = self.deep(json[i]);
					}
				}
			}
			return result;
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
		// returns an array of STRINGS
		// as object property keys are always strings
		keys: function (object) {
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
		},
		
		// legacy function for deep copying
		// DEPRECATED
		copyTable: function (json) {
			return self.deep(json, true);
		}
	};

	return self.delegate(self);
}();

