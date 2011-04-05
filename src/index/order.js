////////////////////////////////////////////////////////////////////////////////
// B-search based order lookup for jOrder
////////////////////////////////////////////////////////////////////////////////
/*global jOrder, escape */

// generates a lookup order on the specified table for the given set of fields
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
		// - keys: keys to add to index, extracted from row
		// - rowId: index of the row in the original (flat) table
		// - reorder: whether to re-calcuate order after addition
		self.add = function (keys, rowId, reorder) {
			// adding index value for each key in row
			var i, key;
			for (i = 0; i < keys.length; i++) {
				key = keys[i];
				// extending order (and re-calculating if necessary)
				// number variable type must be preserved for sorting purposes
				switch (self.options.type) {
				case constants.number:
					if (isNaN(key)) {
						throw "NaN attempted to be added to numeric index. Sanitize values before applying index.";
					}
					order.push({ key: key, rowId: rowId });
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
		};

		// removes rows from order preserving index integrity
		// - keys: keys identifying the rows to remove
		// - rowId: index of row to be removed
		self.remove = function (keys, rowId) {
			var i, key;
			for (i = 0; i < keys.length; i++) {
				// finding id of key within order in log(n) steps
				key = bsearch(keys[i], 0, order.length - 1);
				// removing key from order
				order.splice(key, 1);
			}
		};
		
		// compacts the order by eliminating orphan entries
		self.compact = function () {
			// tracing calls to this method as it is expensive
			logging.log("Compacting index '" + self.signature() + "'.");

			// remove orphan entries
			var i;
			for (i = order.length - 1; i >= 0; i--) {
				if (!order[i]) {
					order.splice(i, 1);
				}
			}
		};

		// internal function for bsearch
		// - value: searched value
		// - start: starting index in the order
		// - end: ending index in the order
		function bsearch(value, start, end) {
			// returning first item on exact hit
			if (order[start].key === value) {
				return start;
			}
			// returning hit if scope shrunk to 1 item
			// (usual exit-point)
			if (end - start === 1) {
				return start;
			}
			// pin-pointing middle item and deciding which half to take
			// of two items, it'll take the smaller
			var middle = start + Math.floor((end - start) / 2);
			if (order[middle].key > value) {
				return bsearch(value, start, middle);
			} else {
				return bsearch(value, middle, end);
			}
		}
		
		// binary search on ordered list
		// returns the position or preceeding position of the searched value
		// - value: value we're lookung for
		// - type: constants.start or constants.end
		self.bsearch = function (value, type) {
			// default range
			var start = 0,
					end = order.length - 1,
					idx;

			// is value off the index
			if (value < order[0].key) {
				// returning first index if value is start type
				// -1 otherwise
				return type === constants.start ? 0 : - 1;
			} else if (value > order[end].key) {
				// returning last index if value is end type
				// last+1 otherwise
				return type === constants.end ? end : order.length;
			}
			
			// start search
			idx = bsearch(value, start, end);

			// return the found index on exact hit
			if (order[idx].key === value) {
				return idx;
			}
			// return the next index if we're looking for a range start
			// returned index doesn't have to be valid
			// if the value & type combination spot an off-index position
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
			if (typeof bounds !== 'object') {
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
