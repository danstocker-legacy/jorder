////////////////////////////////////////////////////////////////////////////////
// B-search based order lookup for jOrder
//
// Terminology:
// - Tight Array: Array with no gaps
// - Dense Array: Array with a few, small gaps
// - Sparse Array: Array with gaps overweighing data
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
			if (end - start <= 1) {
				return start;
			}
			// pin-pointing middle item and deciding which half to take
			// of two items, it'll take the smaller
			var middle = start + Math.floor((end - start) / 2);
			if (order[middle].key < value) {
				return bsearch(value, middle, end);
			} else {
				return bsearch(value, start, middle);
			}
		}
		
		// sets a lookup value for a given data row
		// - keys: keys to add to index, extracted from row
		// - rowId: index of the row in the original (flat) table
		// - reorder: whether to re-calcuate order after addition
		self.add = function (keys, rowId) {
			// adding index value for each key in row
			var i, key, id;
			for (i = 0; i < keys.length; i++) {
				key = keys[i];
				id = order.length > 0 ? self.bsearch(key, constants.start) : 0;
				// adding key to order at suitable index
				// number variable type must be preserved for sorting purposes
				switch (self.options.type) {
				case constants.number:
					if (isNaN(key)) {
						throw "NaN attempted to be added to numeric index. Sanitize values before applying index.";
					}
					order.splice(id, 0, { key: key, rowId: rowId });
					break;
				case constants.text:
				case constants.array:
					order.splice(id, 0, { key: key.toLowerCase(), rowId: rowId });
					break;
				default:
					order.splice(id, 0, { key: key, rowId: rowId });
					break;
				}
			}
		};

		// removes rows from order preserving index integrity
		// slow for repetitious indexes, use only when necessary
		// - keys: keys identifying the rows to remove
		// - rowId: index of row to be removed
		self.remove = function (keys, rowId) {
			var i, id;
			for (i = 0; i < keys.length; i++) {
				// finding a matching id in log(n) steps
				id = self.bsearch(keys[i], constants.start);
				// finding suitable id when there are more: hit must match rowId
				// this iteration can be slow on highly redundant data
				// in that case, instead of calling order.remove() every time
				while (order[id].rowId !== rowId) {
					id++;
				}
				// removing key from order
				order.splice(id, 1);
			}
		};
		
		// compacts the order by eliminating orphan entries
		self.compact = function () {
			// tracing calls to this method as it is expensive
			logging.log("Compacting index '" + self.signature() + "'.");

			// removing orphan entries
			var i;
			for (i = order.length - 1; i >= 0; i--) {
				if (!order[i]) {
					order.splice(i, 1);
				}
			}
		};

		// binary search on ordered list
		// returns the position or preceeding position of the searched value
		// order is expected to be a tight array
		// - value: value we're lookung for
		// - type: constants.start or constants.end
		self.bsearch = function (value, type) {
			// returning "not found" when order is empty
			if (!order.length) {
				return -1;
			}
			
			// default range equals full length
			var start = 0,
					end = order.length - 1,
					id;

			// determining whether value is off-index
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
			id = bsearch(value, start, end);

			// return the found index on exact hit
			if (order[id].key === value) {
				return id;
			}
			// return the next index if we're looking for a range start
			// returned index doesn't have to be valid
			// if the value & type combination spot an off-index position
			if (type === constants.start) {
				return id + 1;
			}
			return id;
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
