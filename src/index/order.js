////////////////////////////////////////////////////////////////////////////////
// B-search based order lookup for jOrder
//
// Terminology:
// - Tight Array: Array with no gaps
// - Dense Array: Array with a few, small gaps
// - Sparse Array: Array with gaps overweighing data
////////////////////////////////////////////////////////////////////////////////
/*global jOrder, escape */

jOrder.order = function ($constants, $logging, $signature) {
	// constants
	var DEFAULT_LIMIT = 100;
	
	// generates a lookup order on the specified table for the given set of fields
	// - json: array of uniform objects
	// - fields: array of strings representing table fields
	// - options: grouped, sorted, data type
	//	 - type: jOrder.string, jOrder.number, jOrder.text, jOrder.array
	return function (json, fields, options) {
		// private values
		var base = $signature(fields, options),
				self = Object.create(base),
				order;
		
		// clears internal buffers
		self.clear = function () {
			order = [];
		};
		self.clear();
				
		// reorders the index
		// must use comparer, since order contains objects, not strings
		// sort() w/o comparer is a lot faster in certain browsers tho
		self.reorder = function () {
			order.sort(function (a, b) {
				if (a.key > b.key) {
					return 1;
				} else if (a.key < b.key) {
					return -1;
				} else if (a.rowId > b.rowId) {
					return 1;
				} else if (a.rowId < b.rowId) {
					return -1;
				} else {
					return 0;
				}
			});
		};

		// tests an actual key value against expected
		function equal(actual, expected) {
			switch (self.options.type) {
			case $constants.string:
			case $constants.text:
				return actual.match(new RegExp('^' + expected));
			default:
			case $constants.number:
				return actual === expected;
			}
		}
		
		// sets a lookup value for a given data row
		// - keys: keys to add to index, extracted from row
		// - rowId: index of the row in the original (flat) table
		// - reorder: whether to re-calcuate order after addition
		self.add = function (keys, rowId, lazy) {
			// adding index value for each key in row
			var i, key, pos, alt;
			for (i = 0; i < keys.length; i++) {
				// determining what key to store depending on index type
				key = keys[i];
				switch (self.options.type) {
				case $constants.text:
				case $constants.array:
					alt = key.toLowerCase();
					break;
				default:
					alt = key;
					break;
				}
				// adding key to index
				if (lazy) {
					// adding key to order at end
					// index must be sorted before use
					order.push({ key: alt, rowId: rowId });
				} else {
					// adding key to order at suitable index
					// number variable type must be preserved for sorting purposes
					pos = order.length > 0 ? self.bsearch(key, $constants.start, rowId) : 0;
					order.splice(pos, 0, { key: alt, rowId: rowId });
				}
			}
		};

		// removes rows from order preserving index integrity
		// slow for repetitious indexes, use only when necessary
		// - keys: keys identifying the rows to remove
		// - rowId: index of row to be removed
		self.remove = function (keys, rowId) {
			var i, pos;
			for (i = 0; i < keys.length; i++) {
				// finding a matching id in log(n) steps
				pos = self.bsearch(keys[i], $constants.start, rowId);
				// removing key from order
				order.splice(pos, 1);
			}
		};
		
		// internal function for bsearch
		// - key: search term key
		// - start: starting index in the order
		// - end: ending index in the order
		function bsearch(key, start, end, rowId) {
			var hasId = typeof rowId !== 'undefined',
					middle, median,
					first = order[start];
			
			// returning first item on exact hit
			if (hasId && first.rowId === rowId ||
				!hasId && equal(first.key, key)) {
				return {pos: start, exact: true};
			}

			// returning hit if scope shrunk to 1 item
			// (usual exit-point)
			if (end - start <= 1) {
				return {pos: start, exact: false};
			}
			// pin-pointing middle item and deciding which half to take
			// of two items, it'll take the smaller
			middle = start + Math.floor((end - start) / 2);
			median = order[middle];
			if (median.key < key ||
					hasId && median.key === key && median.rowId < rowId) {
				return bsearch(key, middle, end, rowId);
			} else {
				return bsearch(key, start, middle, rowId);
			}
		}
		
		// binary search on ordered list
		// returns the position or preceeding position of the searched value
		// order is expected to be a tight array
		// - value: value we're lookung for
		// - type: $constants.start or $constants.end
		// - rowId: UNDOCUMENTED. required by .add()
		self.bsearch = function (key, type, rowId) {
			// returning "not found" when order is empty
			if (!order.length) {
				return -1;
			}
			
			// default range equals full length
			var start = 0,
					first = order[0],
					end = order.length - 1,
					last = order[end],
					hasId = typeof rowId !== 'undefined',
					hit, pos;

			// determining whether key is off-index
			if (key < first.key || hasId && equal(first.key, key) && rowId < first.rowId) {
				// returning first index if key is start type
				// -1 otherwise
				return type === $constants.start ? start : - 1;
			} else if (key > last.key || hasId && equal(last.key, key) && rowId > last.rowId) {
				// returning last index if key is end type
				// last+1 otherwise
				return type === $constants.end ? end : order.length;
			}
			
			// start search
			// returned index doesn't have to be valid
			// if the key & type combination spot an off-index position
			hit = bsearch(key, start, end, rowId);			
			if (hit.exact) {
				// exact hit returns the pos as start position
				pos = type === $constants.start ? hit.pos : hit.pos - 1;
			} else {
				// non-exact hit returns the pos preceding a possible match
				pos = type === $constants.start ? hit.pos + 1 : hit.pos;
			}
			return pos;
		};

		// returns a list of rowIds matching the given bounds
		// - bounds:
		//	 - lower: lower bound for the range
		//	 - upper: upper bound of the range
		// - options:
		//	 - offset
		//	 - limit
		self.range = function (bounds, options) {
			// default bounds
			bounds = bounds || {};
			
			// default options
			options = options || {};
			options.offset = options.offset || 0;
			options.limit = options.limit || DEFAULT_LIMIT;

			var lower, upper,
					start, end,
					result = [],
					i;
			
			// determining search bounds based on index type and arguments
			switch (self.options.type) {
			case $constants.text:
				lower = bounds.lower ? escape(bounds.lower.toLowerCase()) : bounds.lower;
				upper = bounds.upper ? escape(bounds.upper.toLowerCase()) : bounds.upper;
				break;
			case $constants.string:
				lower = bounds.lower ? escape(bounds.lower) : bounds.lower;
				upper = bounds.upper ? escape(bounds.upper) : bounds.upper;
				break;
			default:
				lower = bounds.lower;
				upper = bounds.upper;
				break;
			}
			
			// obtaining start of range
			start = (typeof lower !== 'undefined' ? self.bsearch(lower, $constants.start) : 0) + options.offset;

			// obtaining end of range
			// smallest of [range end, page end (limit), table length]
			end = Math.min(
				typeof upper !== 'undefined' ? self.bsearch(upper, $constants.end) : order.length - 1,
				start + options.limit - 1);

			// collecting positions of actial data rows according to index
			for (i = start; i <= end; i++) {
				result.push(order[i].rowId);
			}
			return result;
		};

		// returns a copy of the index order
		// without options, returns reference to order object -> faster
		// - dir: either jOrder.asc or jOrder.desc
		// - options
		//	 - offset
		//	 - limit
		self.order = function (dir, options) {
			// returning early on empty index
			if (!order.length) {
				return order;
			}

			// default args
			dir = dir || $constants.asc;
			options = options || {};
			options.offset = options.offset || 0;
			options.limit = options.limit || 0;
			
			// returning ref for ascending, full order
			if (dir === $constants.asc && !options.offset && !options.limit) {
				return order;
			}

			// taking slice of order
			options.limit = options.limit || DEFAULT_LIMIT;
			switch (dir) {
			case $constants.desc:
				return order.slice(Math.max(0, order.length - options.offset - options.limit), order.length - options.offset).reverse();
			default:
			case $constants.asc:
				return order.slice(options.offset, Math.min(options.offset + options.limit, order.length));
			}
		};

		// legacy methods 
		self.compact = function () {
			$logging.warn("Compacting is obsolete");
		};
		
		return self;
	};
}(jOrder.constants,
	jOrder.logging,
	jOrder.signature);
