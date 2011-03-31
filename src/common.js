////////////////////////////////////////////////////////////////////////////////
// Basic data manipulation methods
////////////////////////////////////////////////////////////////////////////////
/*jslint onevar:false*/

var jOrder = function (jOrder) {
	// provides a deep copy of a table (array of objects)
	jOrder.copyTable = function (table, renumber) {
		jOrder.log("Creating deep copy of table (length: " + table.length + ").");
		var result = [],
			idx, temp, field;
		if (renumber) {
			for (idx in table) {
				temp = {};
				for (field in table[idx]) {
					temp[field] = table[idx][field];
				}
				result.push(temp);
			}
			return result;
		}
		for (idx in table) {
			temp = {};
			for (field in table[idx]) {
				temp[field] = table[idx][field];
			}
			result[idx] = temp;
		}

		return result;
	};

	// retrieves the keys of an object
	jOrder.keys = function (object, values) {
		// construct an object if value is given
		if (values) {
			var result = {};
			for (var idx in object) {
				result[object[idx]] = values[idx];
			}
			return result;
		}
		// get the object's keys otherwise
		result = [];
		for (var key in object) {
			result.push(key);
		}
		return result;
	};

	// gathers the values of an object
	jOrder.values = function (object) {
		var result = [];
		for (var key in object) {
			result.push(object[key]);
		}
		return result;
	};

	return jOrder;
}(jOrder || {});

