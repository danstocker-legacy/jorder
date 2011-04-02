////////////////////////////////////////////////////////////////////////////////
// jOrder index object
////////////////////////////////////////////////////////////////////////////////
/*jslint forin:true */
/*global jOrder, escape */

// generates a lookup index on the specified table for the given set of fields
// - json: array of uniform objects
// - fields: array of strings representing table fields
// - options: grouped, sorted, data type
//	 - grouped: bool
//	 - sorted: bool
//	 - type: jOrder.string, jOrder.number, jOrder.text
jOrder.index = function (constants, logging) {
	return function (json, fields, options) {
		if (typeof fields === 'undefined' || !fields.length) {
			throw "No field(s) specified";
		}

		// default options		
		options = options || {};
	
		// private values
		var flat = {},
				order = [],
				self;
				
		// internal function for bsearch
		// - value: searched value
		// - start: starting index in the order
		// - end: ending index in the order
		function bsearch(value, start, end) {
			if (order[start].key === value) {
				return start;
			}
			if (end - start === 1) {
				return start;
			}
			var middle = start + Math.floor((end - start) / 2);
			if (order[middle].key > value) {
				return bsearch(value, start, middle);
			} else {
				return bsearch(value, middle, end);
			}
		}
		
		self = {
			options: options,
			
			// constructs a key based on values of a row
			// - row: data row that serves as basis for the index key
			keys: function (row) {
				if (constants.array === self.options.type) {
					return row[fields[0]];
				}
				if (constants.text === self.options.type) {
					return row[fields[0]].split(' ');
				}
				var key = [],
						idx;
				for (idx = 0; idx < fields.length; idx++) {
					if (!row.hasOwnProperty(fields[idx])) {
						return null;
					}
					key.push(row[fields[idx]]);
				}
				return [escape(key.join('_'))];
			},

			// reorders the index
			// must use comparer, since order contains objects, not strings
			// sort() w/o comparer is a lot faster in certain browsers tho
			reorder: options.type === constants.number ?
			function () {
				order.sort(function (a, b) {
					return a.key - b.key;
				});
			} : function () {
				order.sort(function (a, b) {
					return a.key > b.key ? 1 : a.key < b.key ? -1 : 0;
				});
			},

			// sets a lookup value for a given data row
			// - row: data row that serves as basis for the index key
			// - rowId: index of the row in the original (flat) table
			// - reorder: whether to re-calcuate order after addition
			add: function (row, rowId, reorder) {
				// obtain keys associated with the row
				var keys = self.keys(row),
						idx, key;
				if (null === keys) {
					throw "Can't add row to index. No field matches signature '" + self.signature() + "'";
				}
				for (idx = 0; idx < keys.length; idx++) {
					key = keys[idx];
	
					// extend (and re-calculate) order
					if (self.options.ordered) {
						// number variable type must be preserved for sorting purposes
						switch (self.options.type) {
						case constants.number:
							if (isNaN(row[fields[0]])) {
								throw "NaN attempted to be added to numeric index. Sanitize values before applying index.";
							}
							order.push({ key: row[fields[0]], rowId: rowId });
							break;
						case constants.text:
						case constants.array:
							order.push({ key: key.toLowerCase(), rowId: rowId });
							break;
						default:
							order.push({ key: key, rowId: rowId });
							break;
						}
						if (!(false === reorder)) {
							self.reorder();
						}
					}
	
					// add row id to index
					if (self.options.grouped) {
						// grouped index
						if (!flat.hasOwnProperty(key)) {
							flat[key] = { items: [], count: 0 };
						}
						if (!(rowId in flat[key].items)) {
							flat[key].count++;
						}
						flat[key].items[rowId] = rowId;
					} else {
						// non-grouped index
						if (flat.hasOwnProperty(key)) {
							throw "Can't add more than one row ID to the non-grouped index '" + self.signature() + "'. Consider using a group index instead.";
						}
						flat[key] = rowId;
					}
				}
			},
	
			// removes a key from the index
			// - row: row to delete
			// - rowId: id of row to delete
			remove: function (row, rowId) {
				var keys = self.keys(row),
						idx, key;
				for (idx = 0; idx < keys.length; idx++) {
					key = keys[idx];
	
					if (!flat.hasOwnProperty(key)) {
						throw "Can't remove row. Row '" + key + "' doesn't match signature '" + self.signature() + "'.";
					}
	
					// non-group index
					if (!self.options.grouped) {
						delete flat[key];
						return;
					}
	
					if (null === rowId) {
						throw "Must pass rowId when deleting from group index.";
					}
					
					// group index
					if (flat[key].items && rowId in flat[key].items) {
						flat[key].count--;
					}
					delete flat[key].items[rowId];
				}
			},
	
			// rebuilds the index
			rebuild: function () {
				// check parameter consistency
				if (fields.length > 1) {
					switch (self.options.type) {
					case constants.text:
						throw "Can't create a text index on more than one field.";
					case constants.number:
						throw "Can't create a number index on more than one field.";
					}
				}
	
				// clear index
				flat = {};
				order = [];
	
				// generate index
				logging.log("Building index of length: " + json.length + ", signature '" + self.signature() + "'.");
				for (var rowId in json) {
					self.add(json[rowId], rowId, false);
				}
				if (!self.options.ordered) {
					return;
				}
				
				// generate order
				self.reorder();
			},
	
			// compacts the order by eliminating orphan entries
			compact: function () {
				// compacting operates on index order
				if (!self.options.ordered) {
					throw "Attempted to compact an unordered index: '" + self.signature() + "'.";
				}
				// tracing calls to this method as it is expensive
				logging.log("Compacting index '" + self.signature() + "'.");
	
				// remove orphan entries
				for (var idx in order) {
					if (!(order[idx].rowId in json)) {
						order.splice(idx, 1);
					}
				}
			},
	
			// generates or validates a signature for the index
			// - row: row that we want to validate against the index
			signature: function (row) {
				if (!row) {
					return escape(fields.join('_'));
				}
				// validation: all fields of the index must be present in the test row
				for (var idx = 0; idx < fields.length; idx++) {
					if (!row.hasOwnProperty(fields[idx])) {
						return false;
					}
				}
				return true;
			},
	
			// returns the original rowids associated with the index
			// - rows: data rows that serve as basis for the index key
			lookup: function (rows) {
				var result = [],
						idx, key, rowIds,
						jdx;
				for (idx in rows) {
					key = self.keys(rows[idx])[0];
					if (!flat.hasOwnProperty(key)) {
						continue;
					}
	
					// index element is either an array or a number
					rowIds = flat[key];
					if ('object' === typeof rowIds) {
						for (jdx in rowIds.items) {
							result.push(rowIds.items[jdx]);
						}
					} else {
						result.push(rowIds);
					}
				}
				return result;
			},
	
			// binary search on ordered list
			// returns the position or preceeding position of the searched value
			// - value: value we're lookung for
			// - type: constants.start or constants.end
			bsearch: function (value, type) {
				// index must be ordered
				if (!self.options.ordered) {
					throw "Attempted bsearch() on unordered index. Signature: " + self.signature() + ".";
				}
				// default range
				var start = 0,
						end = order.length - 1,
						idx;
	
				// is value off the index
				if (value < order[0].key) {
					return type === constants.start ? 0 : - 1;
				}
				if (value > order[end].key) {
					return type === constants.end ? end : order.length;
				}
				// start search
				idx = bsearch(value, start, end);
	
				// return the found index on exact hit
				if (order[idx].key === value) {
					return idx;
				}
				// return the next index if we're looking for a range start
				if (type === constants.start) {
					return idx + 1;
				}
				return idx;
			},
	
			// returns a list of rowIds matching the given bounds
			// - bounds:
			//	 - lower: lower bound for the range
			//	 - upper: upper bound of the range
			// - options:
			//	 - offset
			//	 - limit
			range: function (bounds, options) {
				// checking environment
				if (!self.options.ordered) {
					throw "Can't call index.range() on the unordered index '" + self.signature() + "'. Set up the index as ordered.";
				}
				if ('object' !== typeof bounds) {
					throw "Invalid bounds passed to index.range().";
				}
				// assigning default options
				options = options || {};
				options.offset = options.offset || 0;
				options.limit = options.limit || 1;
	
				var
				// converting text conditions to lowercase
				lower = bounds.lower && constants.text === self.options.type ? bounds.lower.toLowerCase() : bounds.lower,
				upper = bounds.upper && constants.text === self.options.type ? bounds.upper.toLowerCase() : bounds.upper,
				// obtaining start of range
				start = (lower !== null ? self.bsearch(escape(lower), constants.start) : 0) + options.offset,
				// obtaining end of range
				// smallest of [range end, page end (limit), table length]
				end = Math.min(
					upper ? self.bsearch(escape(upper), constants.end) : order.length - 1,
					start + options.limit - 1),
				// constructing result set
				// also eliminating duplicate entres
				result = [],
				idx;

				for (idx = start; idx <= end; idx++) {
					result.push(order[idx].rowId);
				}
				return result;
			},
	
			// tells whether the index id grouped
			grouped: function () {
				return self.options.grouped;
			},
	
			// tells whether the index is ordered
			ordered: function () {
				return self.options.ordered;
			},
	
			// returns index type
			type: function () {
				return self.options.type;
			},
	
			// flat, json representation of the index data
			flat: function () {
				return flat;
			},
	
			// returns a copy of the index order
			// - direction
			// - options
			//	 - offset
			//	 - limit
			order: function (direction, options) {
				if (!options || !options.offset && !options.limit) {
					return order.length ? order : null;
				}
				options.offset = options.offset || 0;
				options.limit = options.limit || 1;
	
				switch (direction) {
				case constants.desc:
					return order.slice(Math.max(0, order.length - options.offset - options.limit), order.length - options.offset).reverse();
				default:
				case constants.asc:
					return order.slice(options.offset, Math.min(options.offset + options.limit, order.length));
				}
			}
		};
	
		self.rebuild();
		
		return self;
	};
}(jOrder.constants,
	jOrder.logging);
