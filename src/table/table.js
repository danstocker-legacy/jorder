////////////////////////////////////////////////////////////////////////////////
// jOrder index object
////////////////////////////////////////////////////////////////////////////////
/*jslint nomen:false, onevar:false, forin:true */
/*global jOrder */

jOrder.table = function (core, constants, logging) {
	// jOrder.table
	// database-like table object
	// - data: json table the table object is based on
	return function (data, options) {
		options = options || { renumber: false };

		// member variables
		var _data = core.shallow(data, options.renumber),
				_indexes = {},
				self;

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
		
		self = {
			// set or get an index
			// - name: index name
			// - fields: array of strings representing table fields
			// - options: index options (groupability, sortability, type, etc.)
			index: function (name, fields, options) {
				if (!name) {
					this.reindex();
				}
				if (!fields) {
					return _indexes[name];
				}
				if (null !== _indexes[name]) {
					delete _indexes[name];
				}
				_indexes[name] = jOrder.index(_data, fields, options);
				return this;
			},
	
			// rebuilds indexes on table
			reindex: function () {
				for (var name in _indexes) {
					_indexes[name].rebuild();
				}
			},
	
			// updates, inserts or deletes one row in the table, modifies indexes
			// - before: data row
			// - after: changed data row
			// - options: [indexName]
			update: function (before, after, options) {
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
						throw "Can't find suitable index for fields: '" + core.keys(before).join(",") + "'.";
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
			},
	
			// inserts a row into the table, updates indexes
			// - rows: table rows to be inserted
			// - options: [indexName]
			insert: function (rows, options) {
				for (var idx in rows) {
					this.update(null, rows[idx], options);
				}
			},
	
			// deletes row from table, updates indexes
			// - rows: table rows to delete
			// - options: [indexName]
			remove: function (rows, options) {
				for (var idx in rows) {
					this.update(rows[idx], null, options);
				}
			},
	
			// deletes the tables contents
			clear: function () {
				_data = core.shallow(data);
				_indexes = {};
			},
	
			// selects a set of rows using the specified row ids
			// - rowIds: specifies which rows to include in the result
			// - options:
			//	 - renumber: whether or not to preserve row ids
			select: function (rowIds, options) {
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
			},
	
			// returns the first row as json table from the table ftting the conditions
			// - conditions: list of field-value pairs defining the data we're looking for; can be null = no filtering
			//	 (fields must be in the same exact order as in the index)
			// - options:
			//	 - indexName: index to use for search
			//	 - mode: constants.exact, constants.range, constants.startof (not unicode!)
			//	 - renumber: whether or not to preserve row ids
			//	 - offset: search offset
			//	 - limit: munber of rows to return starting from offset
			where: function (conditions, options) {
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
					case constants.range:
						rowIds = !conditions ? {lower: null, upper: null} :
							function (condition) {
								return index.range({
									lower: typeof condition === 'object' ? condition.lower : condition,
									upper: typeof condition === 'object' ? condition.upper : condition
								}, options);
							}(core.values(conditions[0])[0]);
						break;
					case constants.startof:
						lower = conditions ? core.values(conditions[0])[0] : null;
						upper = lower ? lower + 'z' : null;
						rowIds = index.range({ lower: lower, upper: upper }, options);
						break;
					default:
					case constants.exact:
						// when offset and/or limit is specified, exact mode is not likely to work
						if (options.offset || options.limit) {
							logging.warn("Running 'jOrder.table.where()' in 'exact' mode with offset and limit specified. Consider running it in 'range' mode.");
						}
						// when no conditions are set
						rowIds = conditions ?
							index.lookup(conditions) :
							core.values(index.flat());
						break;
					}
					return this.select(rowIds, { renumber: options.renumber });
				}
	
				// no index found, search iteratively
				logging.warn("No matching index for fields: '" + core.keys(conditions[0]).join(',') + "'.");
	
				// range search
				if (options.mode === constants.range) {
					return this.filter(function (row) {
						var bounds = core.values(conditions[0])[0];
						var field = core.keys(conditions[0])[0];
						return bounds.lower <= row[field] && bounds.upper >= row[field];
					}, options);
				}
	
				// start-of partial match
				if (options.mode === constants.startof) {
					return this.filter(function (row) {
						return row[core.keys(conditions[0])[0]].indexOf(core.values(conditions[0])[0]) === 0;
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
			},
	
			// aggregates the table using a group index
			// - indexName: name of the group index
			// - initCallback: function that initializes the aggregated row
			// - iterateCallback: function performing one step of iteration
			aggregate: function (indexName, initCallback, iterateCallback) {
				// check index
				if (!_indexes.hasOwnProperty(indexName)) {
					throw "Index '" + indexName + "' not found.";
				}
				var index = _indexes[indexName];
				if (!index.grouped()) {
					throw "Can't aggregate using a non-group index! Signature: '" + index.signature() + "'.";
				}
				logging.warn("jOrder.table.aggregate() iterates over the table (length: " + _data.length + ").");
	
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
					var aggregated = initCallback(core.shallow([seed])[0]);
	
					// iterating through each row in group
					for (idx in group) {
						aggregated = iterateCallback(aggregated, _data[group[idx]]);
					}
					// adding aggregated group to result
					grouped[groupId] = aggregated;
				}
	
				return grouped;
			},
	
			// sorts the contents of the table according to an index
			// - fields: array of field names to sort by
			// - direction: constants.asc or constants.desc
			// - options:
			//	 - indexName: name of the index to use for sorting
			//	 - compare: comparer callback (UNUSED)
			//	 - offset
			//	 - limit
			orderby: function (fields, direction, options) {
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
					index = _index(core.join(fields, []));
				}
				if (constants.text === index.type()) {
					throw "Can't order by free-text index: '" + fields.join(',') + "'.";
				}
				// assess sorting order
				var order = index.order(direction, options);
				if (!order) {
					// sorting on the fly
					logging.warn("Index '" + options.indexName + "' is not ordered. Sorting index on the fly.");
					return core.shallow(_data).sort(function (a, b) {
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
			},
	
			// filters table rows using the passed selector function
			// runs the selector on each row of the table
			// returns a json table
			// - selector: function that takes the row (object) as argument and returns a bool
			// - options:
			//	 - renumber: whether to preserve original row ids
			//	 - offset
			//	 - limit
			filter: function (selector, options) {
				// issuing warning
				logging.warn("Performing linear search on table (length: " + _data.length + "). Consider using an index.");
	
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
			},
	
			// counts the lements in the table
			count: function () {
				logging.warn("jOrder.table.count() iterates over the table (length: " + _data.length + ").");
				return core.keys(_data).length;
			},
	
			// returns a copy of the flat contents of the table
			flat: function () {
				return _data;
			},
	
			// get the first row from table
			first: function () {
				var idx;
				for (idx in _data) {
					return _data[idx];
				}
			},
	
			// returns one column of the table as a flat array
			// - field: field name identifying the column
			// - options:
			//	 - renumber: whether or not it should preserve row ids
			column: function (field, options) {
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
			},
	
			// tells whether there's an ordered index on the given fields
			ordered: function (fields) {
				var index = _index(fields);
				if (!index) {
					return false;
				}
				return index.ordered();
			},
	
			// tells whether there's an ordered index on the given fields
			grouped: function (fields) {
				var index = _index(fields);
				if (!index) {
					return false;
				}
				return index.grouped();
			}
		};
		
		return self;
	};
}(jOrder.core,
	jOrder.constants,
	jOrder.logging);

