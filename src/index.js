////////////////////////////////////////////////////////////////////////////////
// jOrder index object
////////////////////////////////////////////////////////////////////////////////
/*jslint nomen:false, onevar:false, forin:true */
/*global jOrder, escape */

// generates a lookup index on the specified table for the given set of fields
// - json: array of uniform objects
// - _fields: array of strings representing table fields
// - _options: grouped, sorted, data type
//	 - grouped: bool
//	 - sorted: bool
//	 - type: jOrder.string, jOrder.number, jOrder.text
jOrder.index = function (constants, logging) {
	return function (json, _fields, _options) {
		// private values
		var _data = {},
				_order = [],
				self,
				_reorder;
	
		// default options
		_options = _options || {};
	
		// internal function for bsearch
		// - value: searched value
		// - start: starting index in the order
		// - end: ending index in the order
		function _bsearch(value, start, end) {
			if (_order[start].key === value) {
				return start;
			}
			if (end - start === 1) {
				return start;
			}
			var middle = start + Math.floor((end - start) / 2);
			if (_order[middle].key > value) {
				return _bsearch(value, start, middle);
			} else {
				return _bsearch(value, middle, end);
			}
		}
	
		// constructs a key based on values of a row
		// - row: data row that serves as basis for the index key
		function _keys(row) {
			if (constants.array === _options.type) {
				return row[_fields[0]];
			}
			if (constants.text === _options.type) {
				return row[_fields[0]].split(' ');
			}
			var key = [];
			for (var idx = 0; idx < _fields.length; idx++) {
				if (!row.hasOwnProperty(_fields[idx])) {
					return null;
				}
				key.push(row[_fields[idx]]);
			}
			return [escape(key.join('_'))];
		}
	
		// reorders the index
		// must use comparer, since _order contains objects, not strings
		// sort() w/o comparer is a lot faster in certain browsers tho
		_reorder = _options.type === constants.number ?
			function () {
				_order.sort(function (a, b) {
					return a.key - b.key;
				});
			} :
			function () {
				_order.sort(function (a, b) {
					return a.key > b.key ? 1 : a.key < b.key ? -1 : 0;
				});
			};
	
		self = {	
			// sets a lookup value for a given data row
			// - row: data row that serves as basis for the index key
			// - rowId: index of the row in the original (flat) table
			// - reorder: whether to re-calcuate order after addition
			add: function (row, rowId, reorder) {
				// obtain keys associated with the row
				var keys = _keys(row);
				if (null === keys) {
					throw "Can't add row to index. No field matches signature '" + self.signature() + "'";
				}
				for (var idx = 0; idx < keys.length; idx++) {
					var key = keys[idx];
	
					// extend (and re-calculate) order
					if (_options.ordered) {
						// number variable type must be preserved for sorting purposes
						switch (_options.type) {
						case constants.number:
							if (isNaN(row[_fields[0]])) {
								throw "NaN attempted to be added to numeric index. Sanitize values before applying index.";
							}
							_order.push({ key: row[_fields[0]], rowId: rowId });
							break;
						case constants.text:
						case constants.array:
							_order.push({ key: key.toLowerCase(), rowId: rowId });
							break;
						default:
							_order.push({ key: key, rowId: rowId });
							break;
						}
						if (!(false === reorder)) {
							_reorder();
						}
					}
	
					// add row id to index
					if (_options.grouped) {
						// grouped index
						if (!_data.hasOwnProperty(key)) {
							_data[key] = { items: [], count: 0 };
						}
						if (!(rowId in _data[key].items)) {
							_data[key].count++;
						}
						_data[key].items[rowId] = rowId;
					} else {
						// non-grouped index
						if (_data.hasOwnProperty(key)) {
							throw "Can't add more than one row ID to the non-grouped index '" + self.signature() + "'. Consider using a group index instead.";
						}
						_data[key] = rowId;
					}
				}
			},
	
			// removes a key from the index
			// - row: row to delete
			// - rowId: id of row to delete
			remove: function (row, rowId) {
				var keys = _keys(row);
				for (var idx = 0; idx < keys.length; idx++) {
					var key = keys[idx];
	
					if (!_data.hasOwnProperty(key)) {
						throw "Can't remove row. Row '" + key + "' doesn't match signature '" + self.signature() + "'.";
					}
	
					// non-group index
					if (!_options.grouped) {
						delete _data[key];
						return;
					}
	
					if (null === rowId) {
						throw "Must pass rowId when deleting from group index.";
					}
					
					// group index
					if (_data[key].items && rowId in _data[key].items) {
						_data[key].count--;
					}
					delete _data[key].items[rowId];
				}
			},
	
			// rebuilds the index
			rebuild: function () {
				// check parameter consistency
				if (_fields.length > 1) {
					switch (_options.type) {
					case constants.text:
						throw "Can't create a text index on more than one field.";
					case constants.number:
						throw "Can't create a number index on more than one field.";
					}
				}
	
				// clear index
				_data = {};
				_order = [];
	
				// generate index
				logging.log("Building index of length: " + json.length + ", signature '" + self.signature() + "'.");
				for (var rowId in json) {
					self.add(json[rowId], rowId, false);
				}
				if (!_options.ordered) {
					return;
				}
				
				// generate order
				_reorder();
			},
	
			// compacts the order by eliminating orphan entries
			compact: function () {
				// compacting operates on index order
				if (!_options.ordered) {
					throw "Attempted to compact an unordered index: '" + self.signature() + "'.";
				}
				// tracing calls to this method as it is expensive
				logging.log("Compacting index '" + self.signature() + "'.");
	
				// remove orphan entries
				for (var idx in _order) {
					if (!(_order[idx].rowId in json)) {
						_order.splice(idx, 1);
					}
				}
			},
	
			// generates or validates a signature for the index
			// - row: row that we want to validate against the index
			signature: function (row) {
				if (!row) {
					return escape(_fields.join('_'));
				}
				// validation: all fields of the index must be present in the test row
				for (var idx = 0; idx < _fields.length; idx++) {
					if (!row.hasOwnProperty(_fields[idx])) {
						return false;
					}
				}
				return true;
			},
	
			// returns the original rowids associated with the index
			// - rows: data rows that serve as basis for the index key
			lookup: function (rows) {
				var result = [];
				for (var idx in rows) {
					var key = _keys(rows[idx])[0];
					if (!_data.hasOwnProperty(key)) {
						continue;
					}
	
					// index element is either an array or a number
					var rowIds = _data[key];
					if ('object' === typeof rowIds) {
						for (var jdx in rowIds.items) {
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
				if (!_options.ordered) {
					throw "Attempted bsearch() on unordered index. Signature: " + self.signature() + ".";
				}
				// default range
				var start = 0;
				var end = _order.length - 1;
	
				// is value off the index
				if (value < _order[0].key) {
					return type === constants.start ? 0 : - 1;
				}
				if (value > _order[end].key) {
					return type === constants.end ? end : _order.length;
				}
				// start search
				var idx = _bsearch(value, start, end);
	
				// return the found index on exact hit
				if (_order[idx].key === value) {
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
				if (!_options.ordered) {
					throw "Can't call index.range() on the unordered index '" + self.signature() + "'. Set up the index as ordered.";
				}
				if ('object' !== typeof bounds) {
					throw "Invalid bounds passed to index.range().";
				}
				// assigning default options
				options = options || {};
				options.offset = options.offset || 0;
				options.limit = options.limit || 1;
	
				// converting text conditions to lowercase
				var lower = bounds.lower && constants.text === _options.type ? bounds.lower.toLowerCase() : bounds.lower;
				var upper = bounds.upper && constants.text === _options.type ? bounds.upper.toLowerCase() : bounds.upper;
	
				// obtaining start of range
				var start = (lower !== null ? self.bsearch(escape(lower), constants.start) : 0) + options.offset;
	
				// obtaining end of range
				// smallest of [range end, page end (limit), table length]
				var end = Math.min(upper ?
					self.bsearch(escape(upper), constants.end) :
					_order.length - 1,
				start + options.limit - 1);
	
				// constructing result set
				// also eliminating duplicate entres
				var result = [];
				for (var idx = start; idx <= end; idx++) {
					result.push(_order[idx].rowId);
				}
				return result;
			},
	
			// tells whether the index id grouped
			grouped: function () {
				return _options.grouped;
			},
	
			// tells whether the index is ordered
			ordered: function () {
				return _options.ordered;
			},
	
			// returns index type
			type: function () {
				return _options.type;
			},
	
			// flat, json representation of the index data
			flat: function () {
				return _data;
			},
	
			// returns a copy of the index order
			// - direction
			// - options
			//	 - offset
			//	 - limit
			order: function (direction, options) {
				if (!options || !options.offset && !options.limit) {
					return _order.length ? _order : null;
				}
				options.offset = options.offset || 0;
				options.limit = options.limit || 1;
	
				switch (direction) {
				case constants.desc:
					return _order.slice(Math.max(0, _order.length - options.offset - options.limit), _order.length - options.offset).reverse();
				default:
				case constants.asc:
					return _order.slice(options.offset, Math.min(options.offset + options.limit, _order.length));
				}
			}
		};
	
		self.rebuild();
		
		return self;
	};
}(jOrder.constants,
	jOrder.logging);
