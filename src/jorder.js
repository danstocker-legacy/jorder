// jOrder on GitHub (source, wiki):
// http://github.com/danstocker/jorder
//
// jOrder blog:
// http://jorder.net

/*jslint nomen:false, onevar:false*/

var jOrder = (function () {
	// local jOrder variable
	var jOrder = function (json, options) {
		return new jOrder.table(json, options);
	};

	// constants
	jOrder.version = '1.1.0.14';
	jOrder.name = "jOrder";
	// sorting
	jOrder.asc = 1;
	jOrder.desc = -1;
	// index types
	jOrder.string = 0;
	jOrder.number = 1;
	jOrder.text = 2;
	jOrder.array = 3;
	// range params
	jOrder.start = 0;
	jOrder.end = 1;
	// search mode
	jOrder.exact = 0;
	jOrder.range = 1;
	jOrder.startof = 2;

	// properties
	jOrder.logging = true;

	// general logging function
	jOrder.log = function (message, level) {
		if (!jOrder.logging) {
			return;
		}

		var log, warn, error;
		if (window.console) {
			log = function (msg) {
				window.console.log(msg);
			};
			warn = function (msg) {
				window.console.warn(msg);
			};
			error = function (msg) {
				window.console.error(msg);
			};
		} else if (typeof Sys !== 'undefined') {
			log = warn = error = function (msg) {
				Sys.Debug.trace(msg);
			};
		} else {
			log = function () {};
			warn = error = function (msg) {
				window.alert(msg);
			};
		}

		(function (prefix) {
			switch (level) {
			case 1:
				return warn(prefix + message);
			case 2:
				return error(prefix + message);
			default:
				return log(prefix + message);
			}
		})(jOrder.name + ": ");
	};

	// issues a warning
	jOrder.warning = function (message) {
		return jOrder.log(message, 1);
	};

	// issues an error
	jOrder.error = function (message) {
		return jOrder.log(message, 2);
	};

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

	// generates a lookup index on the specified table for the given set of fields
	// purpose: fast access to rows; no support for sorting and inequality filters
	// - _flat: array of uniform objects
	// - _fields: array of strings representing table fields
	// - _options: grouped, sorted, data type
	//	 - grouped: bool
	//	 - sorted: bool
	//	 - type: jOrder.string, jOrder.number, jOrder.text
	jOrder.index = function (_flat, _fields, _options) {
		// private values
		var _data = {};
		var _order = [];

		// default options
		_options = _options || {};

		// sets a lookup value for a given data row
		// - row: data row that serves as basis for the index key
		// - rowId: index of the row in the original (flat) table
		// - reorder: whether to re-calcuate order after addition
		this.add = function (row, rowId, reorder) {
			// obtain keys associated with the row
			var keys = _keys(row);
			if (null === keys) {
				throw "Can't add row to index. No field matches signature '" + this.signature() + "'";
			}
			for (var idx = 0; idx < keys.length; idx++) {
				var key = keys[idx];

				// extend (and re-calculate) order
				if (_options.ordered) {
					// number variable type must be preserved for sorting purposes
					switch (_options.type) {
					case jOrder.number:
						if (isNaN(row[_fields[0]])) {
							throw "NaN attempted to be added to numeric index. Sanitize values before applying index.";
						}
						_order.push({ key: row[_fields[0]], rowId: rowId });
						break;
					case jOrder.text:
					case jOrder.array:
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
						throw "Can't add more than one row ID to the non-grouped index '" + this.signature() + "'. Consider using a group index instead.";
					}
					_data[key] = rowId;
				}
			}
		};

		// removes a key from the index
		// - row: row to delete
		// - rowId: id of row to delete
		this.remove = function (row, rowId) {
			var keys = _keys(row);
			for (var idx = 0; idx < keys.length; idx++) {
				var key = keys[idx];

				if (!_data.hasOwnProperty(key)) {
					throw "Can't remove row. Row '" + key + "' doesn't match signature '" + this.signature() + "'.";
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
		};

		// rebuilds the index
		this.rebuild = function () {
			// check parameter consistency
			if (_fields.length > 1) {
				switch (_options.type) {
				case jOrder.text:
					throw "Can't create a text index on more than one field.";
				case jOrder.number:
					throw "Can't create a number index on more than one field.";
				}
			}

			// clear index
			_data = {};
			_order = [];

			// generate index
			jOrder.log("Building index of length: " + _flat.length + ", signature '" + this.signature() + "'.");
			for (var rowId in _flat) {
				this.add(_flat[rowId], rowId, false);
			}
			if (!_options.ordered) {
				return;
			}
			
			// generate order
			_reorder();
		};

		// compacts the order by eliminating orphan entries
		this.compact = function () {
			// compacting operates on index order
			if (!_options.ordered) {
				throw "Attempted to compact an unordered index: '" + this.signature() + "'.";
			}
			// tracing calls to this method as it is expensive
			jOrder.log("Compacting index '" + this.signature() + "'.");

			// remove orphan entries
			for (idx in _order) {
				if (!(_order[idx].rowId in _flat)) {
					_order.splice(idx, 1);
				}
			}
		};

		// generates or validates a signature for the index
		// - row: row that we want to validate against the index
		this.signature = function (row) {
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
		};

		// returns the original rowids associated with the index
		// - rows: data rows that serve as basis for the index key
		this.lookup = function (rows) {
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
		};

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

		// binary search on ordered list
		// returns the position or preceeding position of the searched value
		// - value: value we're lookung for
		// - type: jOrder.start or jOrder.end
		this.bsearch = function (value, type) {
			// index must be ordered
			if (!_options.ordered) {
				throw "Attempted bsearch() on unordered index. Signature: " + this.signature() + ".";
			}
			// default range
			var start = 0;
			var end = _order.length - 1;

			// is value off the index
			if (value < _order[0].key) {
				return type === jOrder.start ? 0 : - 1;
			}
			if (value > _order[end].key) {
				return type === jOrder.end ? end : _order.length;
			}
			// start search
			var idx = _bsearch(value, start, end);

			// return the found index on exact hit
			if (_order[idx].key === value) {
				return idx;
			}
			// return the next index if we're looking for a range start
			if (type === jOrder.start) {
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
		this.range = function (bounds, options) {
			// checking environment
			if (!_options.ordered) {
				throw "Can't call index.range() on the unordered index '" + this.signature() + "'. Set up the index as ordered.";
			}
			if ('object' !== typeof bounds) {
				throw "Invalid bounds passed to index.range().";
			}
			// assigning default options
			options = options || {};
			options.offset = options.offset || 0;
			options.limit = options.limit || 1;

			// converting text conditions to lowercase
			var lower = bounds.lower && jOrder.text === _options.type ? bounds.lower.toLowerCase() : bounds.lower;
			var upper = bounds.upper && jOrder.text === _options.type ? bounds.upper.toLowerCase() : bounds.upper;

			// obtaining start of range
			var start = (lower !== null ? this.bsearch(escape(lower), jOrder.start) : 0) + options.offset;

			// obtaining end of range
			// smallest of [range end, page end (limit), table length]
			var end = Math.min(upper ?
				this.bsearch(escape(upper), jOrder.end) :
				_order.length - 1,
			start + options.limit - 1);

			// constructing result set
			// also eliminating duplicate entres
			var result = [];
			for (var idx = start; idx <= end; idx++) {
				result.push(_order[idx].rowId);
			}
			return result;
		};

		// tells whether the index id grouped
		this.grouped = function () {
			return _options.grouped;
		};

		// tells whether the index is ordered
		this.ordered = function () {
			return _options.ordered;
		};

		// returns index type
		this.type = function () {
			return _options.type;
		};

		// flat, json representation of the index data
		this.flat = function () {
			return _data;
		};

		// returns a copy of the index order
		// - direction
		// - options
		//	 - offset
		//	 - limit
		this.order = function (direction, options) {
			if (!options || !options.offset && !options.limit) {
				return _order.length ? _order : null;
			}
			options.offset = options.offset || 0;
			options.limit = options.limit || 1;

			switch (direction) {
			case jOrder.desc:
				return _order.slice(Math.max(0, _order.length - options.offset - options.limit), _order.length - options.offset).reverse();
			default:
			case jOrder.asc:
				return _order.slice(options.offset, Math.min(options.offset + options.limit, _order.length));
			}
		};

		// constructs a key based on values of a row
		// - row: data row that serves as basis for the index key
		function _keys(row) {
			if (jOrder.array === _options.type) {
				return row[_fields[0]];
			}
			if (jOrder.text === _options.type) {
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
		_reorder = _options.type === jOrder.number ?
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

		this.rebuild();
	};

	// jOrder.table
	// database-like table object
	// - data: json table the table object is based on
	jOrder.table = function (data, options) {
		options = options || { renumber: false };

		// member variables
		var _data = jOrder.copyTable(data, options.renumber);
		var _indexes = {};

		// set or get an index
		// - name: index name
		// - fields: array of strings representing table fields
		// - options: index options (groupability, sortability, type, etc.)
		this.index = function (name, fields, options) {
			if (!name) {
				this.reindex();
			}
			if (!fields) {
				return _indexes[name];
			}
			if (null !== _indexes[name]) {
				delete _indexes[name];
			}
			_indexes[name] = new jOrder.index(_data, fields, options);
			return this;
		};

		// rebuilds indexes on table
		this.reindex = function () {
			for (var name in _indexes) {
				_indexes[name].rebuild();
			}
		};

		// updates, inserts or deletes one row in the table, modifies indexes
		// - before: data row
		// - after: changed data row
		// - options: [indexName]
		this.update = function (before, after, options) {
			options = options || {};

			// obtain index explicitely
			// or take the first available unique one
			var index, idx;
			if (options.indexName) {
				index = _indexes[options.indexName];
			} else {
				for (idx in _indexes) {
					if (!_indexes[idx].grouped()) {
						index = _indexes[idx];
						break;
					}
				}
			}

			// obtain old row id
			var oldId = null;
			if (before) {
				if (!index) {
					throw "Can't find suitable index for fields: '" + jOrder.keys(before).join(",") + "'.";
				}
				oldId = index.lookup([before])[0];
				before = _data[oldId];
			}

			// are we inserting?
			var newId = null;
			if (null === oldId) {
				if (!after) {
					return;
				}
				// insert new value
				newId = _data.push(after) - 1;
			} else {
				// delete old
				delete _data[oldId];
				// add new
				if (after) {
					newId = _data.push(after) - 1;
				}
			}

			// update indexes
			for (idx in _indexes) {
				index = _indexes[idx];
				if (before) {
					index.remove(before, oldId);
				}
				if (after) {
					index.add(after, newId);
				}
			}
		};

		// inserts a row into the table, updates indexes
		// - rows: table rows to be inserted
		// - options: [indexName]
		this.insert = function (rows, options) {
			for (var idx in rows) {
				this.update(null, rows[idx], options);
			}
		};

		// deletes row from table, updates indexes
		// - rows: table rows to delete
		// - options: [indexName]
		this.remove = function (rows, options) {
			for (var idx in rows) {
				this.update(rows[idx], null, options);
			}
		};

		// deletes the tables contents
		this.clear = function () {
			_data = jOrder.copyTable(data);
			_indexes = {};
		};

		// selects a set of rows using the specified row ids
		// - rowIds: specifies which rows to include in the result
		// - options:
		//	 - renumber: whether or not to preserve row ids
		this.select = function (rowIds, options) {
			// default options
			options = options || {};

			var result = [],
				idx, rowId;

			if (options.renumber) {
				for (idx in rowIds) {
					rowId = rowIds[idx];
					result.push(_data[rowId]);
				}
				return result;
			}

			for (idx in rowIds) {
				rowId = rowIds[idx];
				result[rowId] = _data[rowId];
			}
			return result;
		};

		// returns the first row as json table from the table ftting the conditions
		// - conditions: list of field-value pairs defining the data we're looking for; can be null = no filtering
		//	 (fields must be in the same exact order as in the index)
		// - options:
		//	 - indexName: index to use for search
		//	 - mode: jOrder.exact, jOrder.range, jOrder.startof (not unicode!)
		//	 - renumber: whether or not to preserve row ids
		//	 - offset: search offset
		//	 - limit: munber of rows to return starting from offset
		this.where = function (conditions, options) {
			// default options
			options = options || {};

			// obtain index
			var index = null;
			if (options.indexName) {
				// use specified index
				if (!_indexes.hasOwnProperty(options.indexName)) {
					throw "Invalid index name: '" + options.indexName + "'.";
				}
				index = _indexes[options.indexName];
			} else {
				// look for a suitable index
				index = _index(conditions[0]);
			}

			// index found, return matching row by index
			var rowIds, lower, upper;
			if (index) {
				switch (options.mode) {
				case jOrder.range:
					rowIds = !conditions ? {lower: null, upper: null} :
						function (condition) {
							return index.range({
								lower: typeof condition === 'object' ? condition.lower : condition,
								upper: typeof condition === 'object' ? condition.upper : condition
							}, options);
						}(jOrder.values(conditions[0])[0]);
					break;
				case jOrder.startof:
					lower = conditions ? jOrder.values(conditions[0])[0] : null;
					upper = lower ? lower + 'z' : null;
					rowIds = index.range({ lower: lower, upper: upper }, options);
					break;
				default:
				case jOrder.exact:
					// when offset and/or limit is specified, exact mode is not likely to work
					if (options.offset || options.limit) {
						jOrder.warning("Running 'jOrder.table.where()' in 'exact' mode with offset and limit specified. Consider running it in 'range' mode.");
					}
					// when no conditions are set
					rowIds = conditions ?
						index.lookup(conditions) :
						jOrder.values(index.flat());
					break;
				}
				return this.select(rowIds, { renumber: options.renumber });
			}

			// no index found, search iteratively
			jOrder.warning("No matching index for fields: '" + jOrder.keys(conditions[0]).join(',') + "'.");

			// range search
			if (options.mode === jOrder.range) {
				return this.filter(function (row) {
					var bounds = jOrder.values(conditions[0])[0];
					var field = jOrder.keys(conditions[0])[0];
					return bounds.lower <= row[field] && bounds.upper >= row[field];
				}, options);
			}

			// start-of partial match
			if (options.mode === jOrder.startof) {
				return this.filter(function (row) {
					return row[jOrder.keys(conditions[0])[0]].indexOf(jOrder.values(conditions[0])[0]) === 0;
				}, options);
			}

			// exact match
			return this.filter(function (row) {
				var match = false;
				for (var idx in conditions) {
					var partial = true;
					for (var field in conditions[idx]) {
						partial &= (conditions[idx][field] === row[field]);
						if (!partial) {
							break;
						}
					}
					match |= partial;
					if (match) {
						break;
					}
				}
				return match;
			}, options);
		};

		// aggregates the table using a group index
		// - indexName: name of the group index
		// - initCallback: function that initializes the aggregated row
		// - iterateCallback: function performing one step of iteration
		this.aggregate = function (indexName, initCallback, iterateCallback) {
			// check index
			if (!_indexes.hasOwnProperty(indexName)) {
				throw "Index '" + indexName + "' not found.";
			}
			var index = _indexes[indexName];
			if (!index.grouped()) {
				throw "Can't aggregate using a non-group index! Signature: '" + index.signature() + "'.";
			}
			jOrder.warning("jOrder.table.aggregate() iterates over the table (length: " + _data.length + ").");

			// cycling through groups according to index
			var groupIndex = index.flat(),
				grouped = [],
				idx;
			for (var groupId in groupIndex) {
				// initializing aggregated row (seed)
				var group = groupIndex[groupId].items;
				var seed;
				for (idx in group) {
					seed = _data[group[idx]];
					break;
				}
				var aggregated = initCallback(jOrder.copyTable([seed])[0]);

				// iterating through each row in group
				for (idx in group) {
					aggregated = iterateCallback(aggregated, _data[group[idx]]);
				}
				// adding aggregated group to result
				grouped[groupId] = aggregated;
			}

			return grouped;
		};

		// sorts the contents of the table according to an index
		// - fields: array of field names to sort by
		// - direction: jOrder.asc or jOrder.desc
		// - options:
		//	 - indexName: name of the index to use for sorting
		//	 - compare: comparer callback (UNUSED)
		//	 - offset
		//	 - limit
		this.orderby = function (fields, direction, options) {
			// default options
			options = options || {};

			// obtain index
			var index = null;
			if (options.indexName) {
				// use specified index
				if (!_indexes.hasOwnProperty(options.indexName)) {
					throw "Invalid index name.";
				}
				index = _indexes[options.indexName];
			} else {
				// look for a suitable index
				index = _index(jOrder.keys(fields, []));
			}
			if (jOrder.text === index.type()) {
				throw "Can't order by free-text index: '" + fields.join(',') + "'.";
			}
			// assess sorting order
			var order = index.order(direction, options);
			if (!order) {
				// sorting on the fly
				jOrder.warning("Index '" + options.indexName + "' is not ordered. Sorting index on the fly.");
				return jOrder.copyTable(_data).sort(function (a, b) {
					return a[fields[0]] > b[fields[0]] ? 1 : a[fields[0]] < b[fields[0]] ? -1 : 0;
				});
			}

			// gathers row ids, compacts index if necessary
			function rowIds() {
				function restart() {
					index.compact();
					order = index.order(direction, options);
					return rowIds();
				}

				var result = [];
				for (var idx = 0; idx < order.length; idx++) {
					// dealing with fragmented order
					if (!(order[idx].rowId in _data)) {
						return restart();
					}
					result.push(order[idx].rowId);
				}
				return result;
			}

			// returning ordered rows
			return this.select(rowIds(), { renumber: true });
		};

		// filters table rows using the passed selector function
		// runs the selector on each row of the table
		// returns a json table
		// - selector: function that takes the row (object) as argument and returns a bool
		// - options:
		//	 - renumber: whether to preserve original row ids
		//	 - offset
		//	 - limit
		this.filter = function (selector, options) {
			// issuing warning
			jOrder.warning("Performing linear search on table (length: " + _data.length + "). Consider using an index.");

			// applying default options
			options = options || {};
			options.offset = options.offset || 0;

			// initializing result
			var result = [],
				idx;

			if (options.renumber) {
				var counter = 0;
				for (idx in _data) {
					if (selector(_data[idx])) {
						if (counter++ >= options.offset) {
							result.push(_data[idx]);
						}
						if (options.limit && counter === options.offset + options.limit) {
							break;
						}
					}
				}
				return result;
			}

			for (idx in _data) {
				if (selector(_data[idx])) {
					result[idx] = _data[idx];
				}
			}
			return result;
		};

		// counts the lements in the table
		this.count = function () {
			jOrder.warning("jOrder.table.count() iterates over the table (length: " + _data.length + ").");
			return jOrder.keys(_data).length;
		};

		// returns a copy of the flat contents of the table
		this.flat = function () {
			return _data;
		};

		// get the first row from table
		this.first = function () {
			for (idx in _data) {
				return _data[idx];
			}
		};

		// returns one column of the table as a flat array
		// - field: field name identifying the column
		// - options:
		//	 - renumber: whether or not it should preserve row ids
		this.column = function (field, options) {
			// default options
			options = options || {};

			var result = [],
				idx;
			if (options.renumber) {
				for (idx in _data) {
					result.push(_data[idx][field]);
				}
				return result;
			}
			for (idx in _data) {
				result[idx] = _data[idx][field];
			}
			return result;
		};

		// tells whether there's an ordered index on the given fields
		this.ordered = function (fields) {
			var index = _index(fields);
			if (!index) {
				return false;
			}
			return index.ordered();
		};

		// tells whether there's an ordered index on the given fields
		this.grouped = function (fields) {
			var index = _index(fields);
			if (!index) {
				return false;
			}
			return index.grouped();
		};

		// looks up an index according to the given fields
		// - row: sample row that's supposed to match the index
		function _index(row) {
			for (var idx in _indexes) {
				if (_indexes[idx].signature(row)) {
					return _indexes[idx];
				}
			}
			return null;
		}
	};
	
	return jOrder;
})();

