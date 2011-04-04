////////////////////////////////////////////////////////////////////////////////
// jOrder lookup index
////////////////////////////////////////////////////////////////////////////////
/*global jOrder, escape */

// generates a lookup index on the specified table for the given set of fields
// - json: array of uniform objects
// - fields: array of strings representing table fields
// - options: grouped, sorted, data type
//	 - grouped: bool
//	 - type: jOrder.string, jOrder.number, jOrder.text, jOrder.array
jOrder.lookup = function (constants, logging) {
	return function (json, fields, options) {
		// private values
		var base = jOrder.signature(fields, options),
				self = Object.create(base),
				flat = {};

		// clears internal buffers
		self.clear = function () {
			flat = {};
		};
				
		// sets a lookup value for a given data row
		// - keys: keys to add to index, extracted from row
		// - rowId: index of the row in the original (flat) table
		self.add = function (keys, rowId) {
			// adding index value for each key in row
			var i, key, ids;
			for (i = 0; i < keys.length; i++) {
				key = keys[i];
				// adding row id to index
				if (self.options.grouped) {
					// grouped index
					if (!flat.hasOwnProperty(key)) {
						// initializing index key
						ids = { items: {}, count: 1 };
						ids.items[rowId] = rowId;
						flat[key] = ids;
					} else {
						// incrementing index key
						ids = flat[key];
						if (!ids.items.hasOwnProperty(rowId)) {
							ids.count++;
							ids.items[rowId] = rowId;
						}
					}
				} else {
					// non-grouped index
					if (flat.hasOwnProperty(key)) {
						throw "Can't add more than one row ID to the non-grouped index '" + self.signature() + "'. Consider using a group index instead.";
					}
					flat[key] = rowId;
				}
			}
		};

		// removes a key from the index
		// - keys: keys to delete from index
		// - rowId: id of row to delete
		self.remove = function (keys, rowId) {
			var idx, key, ids;
			for (idx = 0; idx < keys.length; idx++) {
				key = keys[idx];

				if (!flat.hasOwnProperty(key)) {
					throw "Can't remove row. Row '" + key + "' doesn't match signature '" + self.signature() + "'.";
				}

				// removing key from unique index altogether
				if (!self.options.grouped) {
					delete flat[key];
					return;
				}

				if (null === rowId) {
					throw "Must pass rowId when deleting from group index.";
				}
				
				// decreasing count on selected key
				ids = flat[key];
				if (ids.items && ids.items.hasOwnProperty(rowId)) {
					ids.count--;
				}
				if (!ids.count) {
					// deleting key altogether
					// when there are no more items in key
					delete flat[key];
				} else {
					// removing item associated with row
					delete ids.items[rowId];
				}
			}
		};

		// returns original rowids for rows according to index
		// - rows: sparse array of data rows to look up
		self.lookup = function (rows) {
			var result = [],
					i, key, ids,	// 'ids' is a sparse array, since 'rows' is
					j;
			for (i in rows) {
				if (flat.hasOwnProperty(key = self.key(rows[i]))) {
					// taking associated row ids from internal index structure
					ids = flat[key].items;
					if (ids) {
						// for grouped index
						for (j in ids) {
							if (ids.hasOwnProperty(j)) {
								result.push(ids[j]);
							}
						}
					} else {
						// for unique index
						result.push(flat[key]);
					}
				}
			}
			return result;
		};
	
		// flat, json representation of the index data
		self.flat = function () {
			return flat;
		};
	
		return self;
	};
}(jOrder.constants,
	jOrder.logging);
