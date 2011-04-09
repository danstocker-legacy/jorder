////////////////////////////////////////////////////////////////////////////////
// jOrder index object
////////////////////////////////////////////////////////////////////////////////
/*global jOrder */

jOrder.table = function (core, constants, logging) {
	// jOrder.table
	// database-like table object
	// - data: json table the table object is based on
	return function (data, options) {
		options = options || { renumber: false };

		// member variables
		var indexes = {},
				self;

		// looks up an index according to the given fields
		// - row: sample row that's supposed to match the index
		function findIndex(row) {
			for (var name in indexes) {
				if (indexes.hasOwnProperty(name) && indexes[name].signature(row)) {
					return indexes[name];
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
					return indexes[name];
				}
				if (null !== indexes[name]) {
					delete indexes[name];
				}
				indexes[name] = jOrder.index(data, fields, options);
				return this;
			},
	
			// rebuilds indexes on table
			reindex: function () {
				for (var name in indexes) {
					if (indexes.hasOrnProperty(name)) {
						indexes[name].rebuild();
					}
				}
			},
	
			// updates, inserts or deletes one row in the table, modifies indexes
			// - before: data row
			// - after: changed data row
			// - options: [indexName]
			update: function (before, after, options) {
				options = options || {};
	
				var index, i,
						oldId, newId,
						name;
	
				// obtain index explicitely
				// or take the first available unique one
				if (options.indexName) {
					index = indexes[options.indexName];
				} else {
					for (i in indexes) {
						if (indexes.hasOwnProperty(i) && !indexes[i].grouped()) {
							index = indexes[i];
							break;
						}
					}
				}
	
				// obtain old row id
				oldId = null;
				if (before) {
					if (!index) {
						throw "Can't find suitable index for fields: '" + core.keys(before).join(",") + "'.";
					}
					oldId = index.lookup([before])[0];
					before = data[oldId];
				}
	
				// are we inserting?
				newId = null;
				if (null === oldId) {
					if (!after) {
						return;
					}
					// insert new value
					newId = data.push(after) - 1;
				} else {
					// delete old
					delete data[oldId];
					// add new
					if (after) {
						newId = data.push(after) - 1;
					}
				}
	
				// update indexes
				for (name in indexes) {
					if (indexes.hasOwnProperty(name)) {
						index = indexes[name];
						if (before) {
							index.remove(before, oldId);
						}
						if (after) {
							index.add(after, newId);
						}
					}
				}
			},
	
			// inserts a row into the table, updates indexes
			// - rows: table rows to be inserted
			// - options: [indexName]
			insert: function (rows, options) {
				var i;
				for (i = 0; i < rows.length; i++) {
					this.update(null, rows[i], options);
				}
			},
	
			// deletes row from table, updates indexes
			// - rows: table rows to delete
			// - options: [indexName]
			remove: function (rows, options) {
				var i;
				for (i = 0; i < rows.length; i++) {
					this.update(rows[i], null, options);
				}
			},
	
			// deletes the tables contents
			clear: function () {
				data = core.shallow(data);
				indexes = {};
			},
	
			// selects a set of rows using the specified row ids
			// - rowIds: specifies which rows to include in the result
			// - options:
			//	 - renumber: whether or not to preserve row ids
			select: function (rowIds, options) {
				// default options
				options = options || {};
	
				var result = [],
						i, rowId;
	
				if (options.renumber) {
					for (i = 0; i < rowIds.length; i++) {
						result.push(data[rowIds[i]]);
					}
				} else {
					for (i = 0; i < rowIds.length; i++) {
						rowId = rowIds[i];
						result[rowId] = data[rowId];
					}
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
	
				var index,
						rowIds,
						lower, upper;
				
				// obtaining index
				index = null;
				if (options.indexName) {
					// using specified index if there is one
					if (!indexes.hasOwnProperty(options.indexName)) {
						throw "Invalid index name: '" + options.indexName + "'.";
					}
					index = indexes[options.indexName];
				} else {
					// looking for a suitable index
					index = findIndex(conditions[0]);
				}
	
				// index found, returning matching row by index
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
						var bounds = core.values(conditions[0])[0],
								field = core.keys(conditions[0])[0];
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
					var match = false,
							partial, condition,
							i, field;
					for (i = 0; i < conditions.length; i++) {
						partial = true;
						condition = conditions[i];
						for (field in condition) {
							if (condition.hasOwnProperty(field)) {
								partial &= (condition[field] === row[field]);
								if (!partial) {
									break;
								}
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
				var result = [],
						index,
						groupIndex, groupId, group, seed, rowId, aggregated,
						i;				

				// checking index
				if (!indexes.hasOwnProperty(indexName)) {
					throw "Index '" + indexName + "' not found.";
				}
				if (!(index = indexes[indexName]).grouped()) {
					throw "Can't aggregate using a non-group index! Signature: '" + index.signature() + "'.";
				}
				logging.warn("jOrder.table.aggregate() iterates over the table (length: " + data.length + ").");
	
				// cycling through groups according to index
				groupIndex = index.flat();
				result = [];
				for (groupId in groupIndex) {
					if (groupIndex.hasOwnProperty(groupId)) {
						// initializing aggregated row (seed)
						group = groupIndex[groupId].items;
						for (rowId in group) {
							if (group.hasOwnProperty(rowId)) {
								seed = data[group[rowId]];
								break;
							}
						}
						aggregated = initCallback(core.shallow([seed])[0]);
		
						// iterating through each row in group
						for (rowId in group) {
							if (group.hasOwnProperty(rowId)) {
								aggregated = iterateCallback(aggregated, data[group[rowId]]);
							}
						}
						// adding aggregated group to result
						result[groupId] = aggregated;
					}
				}
	
				return result;
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
	
				var index, order;
				
				// obtaining index
				index = null;
				if (options.indexName) {
					// use specified index
					if (!indexes.hasOwnProperty(options.indexName)) {
						throw "Invalid index name.";
					}
					index = indexes[options.indexName];
				} else {
					// look for a suitable index
					index = findIndex(core.join(fields, []));
				}
				if (constants.text === index.type()) {
					throw "Can't order by free-text index: '" + fields.join(',') + "'.";
				}
				// assess sorting order
				order = index.order(direction, options);
				if (!order) {
					// sorting on the fly
					logging.warn("Index '" + options.indexName + "' is not ordered. Sorting index on the fly.");
					return core.shallow(data).sort(function (a, b) {
						return a[fields[0]] > b[fields[0]] ? 1 : a[fields[0]] < b[fields[0]] ? -1 : 0;
					});
				}
	
				// gathers row ids, compacts index if necessary
				function rowIds() {
					var result = [],
							i;
					
					function restart() {
						index.compact();
						order = index.order(direction, options);
						return rowIds();
					}
	
					for (i = 0; i < order.length; i++) {
						// dealing with fragmented order
						if (!(order[i].rowId in data)) {
							return restart();
						}
						result.push(order[i].rowId);
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
				logging.warn("Performing linear search on table (length: " + data.length + "). Consider using an index.");
	
				// applying default options
				options = options || {};
				options.offset = options.offset || 0;
	
				// initializing result
				var result = [],
						i, row, counter;
	
				if (options.renumber) {
					counter = 0;
					for (i in data) {
						if (data.hasOwnProperty(i) && selector(row = data[i])) {
							if (counter++ >= options.offset) {
								result.push(data[i]);
							}
							if (options.limit && counter === options.offset + options.limit) {
								break;
							}
						}
					}
					return result;
				}
	
				for (i in data) {
					if (selector(data[i])) {
						result[i] = data[i];
					}
				}
				return result;
			},
	
			// counts the lements in the table
			count: function () {
				logging.warn("jOrder.table.count() iterates over the table (length: " + data.length + ").");
				return core.keys(data).length;
			},
	
			// returns a copy of the flat contents of the table
			flat: function () {
				return data;
			},
	
			// get the first row from table
			first: function () {
				var rowId;
				for (rowId in data) {
					if (data.hasOwnProperty(rowId)) {
						return data[rowId];
					}
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
						i;
				if (options.renumber) {
					for (i in data) {
						if (data.hasOwnProperty(i)) {
							result.push(data[i][field]);
						}
					}
					return result;
				}
				for (i in data) {
					if (data.hasOwnProperty(i)) {
						result[i] = data[i][field];
					}
				}
				return result;
			},
	
			// tells whether there's an ordered index on the given fields
			ordered: function (fields) {
				var index = findIndex(fields);
				if (!index) {
					return false;
				}
				return index.ordered();
			},
	
			// tells whether there's an ordered index on the given fields
			grouped: function (fields) {
				var index = findIndex(fields);
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

