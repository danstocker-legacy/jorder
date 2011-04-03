////////////////////////////////////////////////////////////////////////////////
// B-search based order lookup for jOrder
////////////////////////////////////////////////////////////////////////////////
/*global jOrder, escape */

// generates a lookup index on the specified table for the given set of fields
// - json: array of uniform objects
// - fields: array of strings representing table fields
// - options: grouped, sorted, data type
//	 - type: jOrder.string, jOrder.number, jOrder.text, jOrder.array
jOrder.order = function (constants, logging) {
	return function (json, fields, options) {
		// private values
		var base = jOrder.signature(fields, options),
				self = Object.create(base),
				order = [];
		
		// clears internal buffers
		self.clear = function () {
			order = [];
		};
				
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
		
		// reorders the index
		// must use comparer, since order contains objects, not strings
		// sort() w/o comparer is a lot faster in certain browsers tho
		self.reorder = self.options.type === constants.number ?
		function () {
			order.sort(function (a, b) {
				return a.key - b.key;
			});
		} : function () {
			order.sort(function (a, b) {
				return a.key > b.key ? 1 : a.key < b.key ? -1 : 0;
			});
		};

		// sets a lookup value for a given data row
		// - row: data row that serves as basis for the index key
		// - rowId: index of the row in the original (flat) table
		// - reorder: whether to re-calcuate order after addition
		self.add = function (row, rowId, reorder) {
			// obtain keys associated with the row
			var keys = self.keys(row),
					i, key, ids;
			if (!keys.length) {
				throw "Can't add row to index. No field matches signature '" + self.signature() + "'";
			}
			// adding index value for each key in row
			for (i = 0; i < keys.length; i++) {
				key = keys[i];

				// extending order (and re-calculating if necessary)
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
				if (reorder !== false) {
					self.reorder();
				}
			}
			
			return self;
		};

		// compacts the order by eliminating orphan entries
		self.compact = function () {
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
		};

		// binary search on ordered list
		// returns the position or preceeding position of the searched value
		// - value: value we're lookung for
		// - type: constants.start or constants.end
		self.bsearch = function (value, type) {
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
		};

		// returns a list of rowIds matching the given bounds
		// - bounds:
		//	 - lower: lower bound for the range
		//	 - upper: upper bound of the range
		// - options:
		//	 - offset
		//	 - limit
		self.range = function (bounds, options) {
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
		};

		// returns a copy of the index order
		// - direction
		// - options
		//	 - offset
		//	 - limit
		self.order = function (direction, options) {
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
		};
	
		return self;
	};
}(jOrder.constants,
	jOrder.logging);
