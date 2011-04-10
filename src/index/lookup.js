////////////////////////////////////////////////////////////////////////////////
// jOrder lookup index
////////////////////////////////////////////////////////////////////////////////
/*global jOrder */

jOrder.lookup = function ($constants, $logging, $signature) {
	// generates a lookup index on the specified table for the given set of fields
	// - json: array of uniform objects
	// - fields: array of strings representing table fields
	// - options: grouped, sorted, data type
	//	 - grouped: bool
	//	 - type: jOrder.string, jOrder.number, jOrder.text, jOrder.array
	return function (json, fields, options) {
		// private values
		var base = $signature(fields, options),
				self = Object.create(base),
				flat, count;

		// clears internal buffers
		self.clear = function () {
			flat = {};
			count = 0;
		};
		self.clear();
		
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
						count++;
					} else {
						// incrementing index key
						ids = flat[key];
						if (!ids.items.hasOwnProperty(rowId)) {
							ids.count++;
							ids.items[rowId] = rowId;
							count++;
						}
					}
				} else {
					// non-grouped index
					if (flat.hasOwnProperty(key)) {
						throw "Can't add more than one row ID to the non-grouped index '" + self.signature() + "'. Consider using a group index instead.";
					}
					flat[key] = rowId;
					count++;
				}
			}
		};

		// removes a key from the index
		// - keys: keys to delete from index
		// - rowId: id of row to delete
		self.remove = function (keys, rowId) {
			var i, key, ids;
			for (i = 0; i < keys.length; i++) {
				key = keys[i];

				if (!flat.hasOwnProperty(key)) {
					throw "Can't remove row. Row '" + key + "' doesn't match signature '" + self.signature() + "'.";
				}

				// removing key from unique index altogether
				if (!self.options.grouped) {
					delete flat[key];
					count--;
					return;
				}

				if (typeof rowId === 'undefined') {
					throw "Must pass rowId when deleting from group index.";
				}
				
				// decreasing count on selected key
				ids = flat[key];
				if (ids.items && ids.items.hasOwnProperty(rowId)) {
					ids.count--;
					count--;
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
		
		// returns key count for one key or whole index
		// - key: key to count
		self.count = function (key) {
			if (typeof key === 'undefined') {
				// total count on no key specified
				return count;
			} else if (!flat.hasOwnProperty(key)) {
				// key is not present in lookup
				return 0;
			} else if (self.options.grouped) {
				// key count on grouped index
				return flat[key].count;
			} else {
				// unique index has only 1 of each key
				return 1;
			}
		};
	
		return self;
	};
}(jOrder.constants,
	jOrder.logging,
	jOrder.signature);
