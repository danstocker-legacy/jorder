// jOrder on GitHub (source, wiki, donation):
// http://github.com/danstocker/jorder
//
// jOrder blog on Wordpress:
// http://jorder.wordpress.com

jOrder = (function()
{
	// local jOrder variable
	var jOrder = function(json)
	{
		return new jOrder.table(json);
	}

	// constants
	jOrder.version = '1.0.0.8';
	jOrder.name = "jOrder";
	// sorting
	jOrder.asc = 1;
	jOrder.desc = -1;
	// index types
	jOrder.string = 0;
	jOrder.number = 1;
	jOrder.text = 2;
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
	jOrder.log = function(message, level)
	{
		if (!jOrder.logging)
			return;

		var log, warn, error;

		if (window.console)
		{
			log = function(msg) { window.console.log(msg); }
			warn = function(msg) { window.console.warn(msg); }
			error = function(msg) { window.console.error(msg); }
		}
		else if (Sys)
			log = warn = error = function(msg) { Sys.Debug.trace(msg); }
		else
			log = warn = error = function(msg) { window.alert(msg); }

		var prefix = jOrder.name + ": ";
		switch (level)
		{
			default:
				log(prefix + message);
				break;
			case 1:
				warn(prefix + message);
				break;
			case 2:
				error(prefix + message);
				break;
		}
	}

	// issues a warning
	jOrder.warning = function(message)
	{
		jOrder.log(message, 1);
	}

	// issues an error
	jOrder.error = function(message)
	{
		jOrder.log(message, 2);
	}

	// provides a deep copy of a table (array of objects)
	jOrder.copyTable = function(table, renumber)
	{
		jOrder.log("Creating deep copy of table (length: " + table.length + ").");
		var result = [];
		if (renumber)
		{
			for (var idx in table)
			{
				var temp = {};
				for (var field in table[idx])
					temp[field] = table[idx][field];
				result.push(temp);
			}
			return result;
		}
		for (var idx in table)
		{
			var temp = {};
			for (var field in table[idx])
				temp[field] = table[idx][field];
			result[idx] = temp;
		}

		return result;
	}

	// retrieves the keys of an object
	jOrder.keys = function(object, values)
	{
		// construct an object if value is given
		if (values)
		{
			var result = {};
			for (var idx in object)
				result[object[idx]] = values[idx];
			return result;
		}
		
		// get the object's keys otherwise
		var result = [];
		for (var key in object)
			result.push(key);
		return result;
	}

	// gathers the values of an object
	jOrder.values = function(object)
	{
		var result = [];
		for (var key in object)
			result.push(object[key]);
		return result;
	}

	// generates a lookup index on the specified table for the given set of fields
	// purpose: fast access to rows; no support for sorting and inequality filters
	// - _flat: array of uniform objects
	// - _fields: array of strings representing table fields
	// - _options: grouped, sorted, data type
	//	 - grouped: bool
	//	 - sorted: bool
	//	 - type: jOrder.string, jOrder.number, jOrder.text
	jOrder.index = function(_flat, _fields, _options)
	{
		// manipulation
		this.add = add;
		this.remove = remove;
		this.rebuild = rebuild;
		this.compact = compact;

		// querying
		this.lookup = lookup;
		this.bsearch = bsearch;
		this.range = range;

		// getters
		this.signature = signature;
		this.flat = flat;
		this.order = order;
		this.grouped = grouped;
		this.ordered = ordered;
		this.type = type;

		// private values
		var _data = {};
		var _order = [];

		// default options
		if (!_options)
			_options = {};

		// start by building the index
		rebuild();

		// sets a lookup value for a given data row
		// - row: data row that serves as basis for the index key
		// - rowId: index of the row in the original (flat) table
		// - reorder: whether to re-calcuate order after addition
		function add(row, rowId, reorder)
		{
			// obtain keys associated with the row
			var keys = _keys(row);
			if (null == keys)
				throw "Can't add row to index. No field matches signature '" + signature() + "'";

			for (idx in keys)
			{
				var key = keys[idx];
				
				// extend (and re-calculate) order
				if (_options.ordered)
				{
					// number variable type must be preserved for sorting purposes
					switch (_options.type)
					{
					default:
						_order.push({ key: key, rowId: rowId });
						break;
					case jOrder.number:
						_order.push({ key: row[_fields[0]], rowId: rowId });
						break;
					case jOrder.text:
						_order.push({ key: key.toLowerCase(), rowId: rowId });
						break;						
					}
					if (!(false === reorder))
						_reorder();
				}

				// add row id to index
				if (_options.grouped)
				{
					// grouped index
					if (!_data[key])
						_data[key] = [];
					_data[key][rowId] = rowId;
				}
				else
				{
					// non-grouped index
					if (key in _data)
						throw "Can't add more than one row ID to the non-grouped index '" + signature() + "'. Consider using a group index instead.";
					_data[key] = rowId;
				}
			}
		}

		// removes a key from the index
		// - row: row to delete
		// - rowId: id of row to delete
		function remove(row, rowId)
		{
			var keys = _keys(row);
			for (idx in keys)
			{
				var key = keys[idx];

				if (!(key in _data))
					throw "Can't remove row. Row '" + key + "' doesn't match signature '" + signature() + "'.";
	
				// non-group index
				if (!_options.grouped)
				{
					delete _data[key];
					return;
				}
	
				if (null == rowId)
					throw "Must pass rowId when deleting from group index.";
	
				// group index
				delete _data[key][rowId];
			}
		}

		// rebuilds the index
		function rebuild()
		{
			// check parameter consistency
			if (_fields.length > 1)
			{
				switch (_options.type)
				{
					case jOrder.text:
						throw "Can't create a text index on more than one field.";
					case jOrder.number:
						throw "Can't create a number index on more than one field.";
				}
			}

			// clear index
			delete _data;
			_data = {};
			delete _order;
			_order = [];

			// generate index
			jOrder.log("Building index of length: " + _flat.length + ", signature '" + signature() + "'.");
			for (var rowId in _flat)
				add(_flat[rowId], rowId, false);

			if (!_options.ordered)
				return;

			// generate order
			_reorder();
		}

		// compacts the order by eliminating orphan entries
		function compact()
		{
			// compacting operates on index order
			if (!_options.ordered)
				throw "Attempted to compact an unordered index: '" + signature() + "'.";

			// tracing calls to this method as it is expensive
			jOrder.log("Compacting index '" + signature() + "'.")
			
			// remove orphan entries
			for (idx in _order)
				if (!(_order[idx].rowId in _flat))
					_order.splice(idx, 1);
		}
		
		// generates or validates a signature for the index
		// - row: row that we want to validate against the index
		function signature(row)
		{
			if (!row)
				return escape(_fields.join('_'));
			
			// validation: all fields of the index must be present in the test row
			for (idx in _fields)
				if (!(_fields[idx] in row))
					return false;
			return true;
		}

		// returns the original rowids associated with the index
		// - rows: data rows that serve as basis for the index key
		function lookup(rows)
		{
			var result = [];
			for (var idx in rows)
			{
				var key = _keys(rows[idx])[0];
				if (!(key in _data))
					continue;

				// index element is either an array or a number
				var rowIds = _data[key];
				if ('object' == typeof rowIds)
					for (var jdx in rowIds)
						result.push(rowIds[jdx]);
				else
					result.push(rowIds);
			}
			return result;
		}

		// internal function for bsearch
		// - value: searched value
		// - start: starting index in the order
		// - end: ending index in the order
		function _bsearch(value, start, end)
		{
			if (_order[start].key == value)
				return start;

			if (end - start == 1)
				return start;

			var middle = start + Math.floor((end - start) / 2);
			if (_order[middle].key > value)
				return _bsearch(value, start, middle);
			else
				return _bsearch(value, middle, end);
		}

		// binary search on ordered list
		// returns the position or preceeding position of the searched value
		// - value: value we're lookung for
		// - type: jOrder.start or jOrder.end
		function bsearch(value, type)
		{
			// index must be ordered
			if (!_options.ordered)
				throw "Attempted bsearch() on unordered index. Signature: " + signature() + ".";

			// default range
			var start = 0;
			var end = _order.length - 1;

			// is value off the index
			if (value < _order[start].key)
				return start;
			if (value > _order[end].key)
				return end;

			// start search
			var idx = _bsearch(value, start, end);

			// return the found index on exact hit
			if (_order[idx].key == value)
				return idx;

			// return the next index if we're looking for a range start
			if (type == jOrder.start)
				return idx + 1;

			return idx;
		}

		// returns a list of rowIds matching the given bounds
		// - bounds:
		//	 - lower: lower bound for the range
		//	 - upper: upper bound of the range
		// - options:
		// 	 - offset
		//   - limit
		function range(bounds, options)
		{
			if (!_options.ordered)
				throw "Can't call index.range() on the unordered index '" + signature() + "'. Set up the index as ordered.";
			
			if ('object' != typeof bounds)
				throw "Invalid bounds passed to index.range().";

			// default options
			if (!options)
				options = {};
			
			// text index conditions must be in lowercase
			var lower = bounds.lower ? (jOrder.text == _options.type ? bounds.lower.toLowerCase() : bounds.lower) : null;
			var upper = bounds.upper ? (jOrder.text == _options.type ? bounds.upper.toLowerCase() : bounds.upper) : null;
			
			// get range
			var start =
				(lower ? bsearch(lower, jOrder.start) : 0) +
				(options.offset ? options.offset : 0);
			var end =
				options.limit ? ((start + options.limit) < _order.length ? start + options.limit - 1 : _order.length - 1) :
				upper ? bsearch(upper, jOrder.end) : _order.length - 1;

			// the result may have duplicate values
			var result = [];
			for (var idx = start; idx <= end; idx++)
				result.push(_order[idx].rowId);
			return result;
		}

		// tells whether the index id grouped
		function grouped()
		{
			return _options.grouped;
		}

		// tells whether the index is ordered
		function ordered()
		{
			return _options.ordered;
		}

		// returns index type
		function type()
		{
			return _options.type;
		}
		
		// flat, json representation of the index data
		function flat()
		{
			return _data;
		}

		// returns a copy of the index order
		// - options
		//   - offset
		//	 - limit
		function order(options)
		{
			if (!options || !options.offset && !options.limit)
				return _order.length ? _order : null;
			
			if (!options.offset)
				options.offset = 0;
			if (!options.limit)
				options.limit = 1;

			return _order.slice(options.offset, options.offset + options.limit);
		}

		// helper functions

		// constructs a key based on values of a row
		// - row: data row that serves as basis for the index key
		function _keys(row)
		{
			if (jOrder.text == _options.type)
				return row[_fields[0]].split(' ');

			var key = [];
			for (var idx in _fields)
			{
				if (!(_fields[idx] in row))
					return null;
				key.push(row[_fields[idx]]);
			}
			return [escape(key.join('_'))];
		}

		// reorders the index
		function _reorder()
		{
			_order.sort(function(a, b)
			{
				return a.key > b.key ? 1 : a.key < b.key ? -1 : 0;
			});
		}
	}

	// jOrder.table
	// database-like table object
	// - data: json table the table object is based on
	jOrder.table = function(data)
	{
		// manipulation
		this.index = index;
		this.reindex = reindex;
		this.update = update;
		this.insert = insert;
		this.remove = remove;
		this.clear = clear;

		// query functions
		this.select = select;			// direct access
		this.where = where;				// uses index
		this.aggregate = aggregate;		// uses index
		this.orderby = orderby;			// uses ordered index
		this.filter = filter;			// iterates
		this.count = count;				// iterates

		// data access
		this.flat = flat;
		this.first = first;
		this.column = column;
		this.ordered = ordered;
		this.grouped = grouped;

		// member variables
		var _data = jOrder.copyTable(data);
		var _indexes = {};

		// set or get an index
		// - name: index name
		// - fields: array of strings representing table fields
		// - options: index options (groupability, sortability, type, etc.)
		function index(name, fields, options)
		{
			if (!name)
				reindex();
			if (!fields)
				return _indexes[name];
			if (null != _indexes[name])
				delete _indexes[name];
			_indexes[name] = new jOrder.index(_data, fields, options);
			return this;
		}

		// rebuilds indexes on table
		function reindex()
		{
			for (var name in _indexes)
				_indexes[name].rebuild();
		}

		// updates, inserts or deletes one row in the table, modifies indexes
		// - before: data row
		// - after: changed data row
		// - options: [indexName]
		function update(before, after, options)
		{
			if (!options)
				options = {};
			
			// obtain index explicitely
			// or take the first available unique one
			var index;
			if (options.indexName)
				index = _indexes[indexName];
			else
			{
				for (idx in _indexes)
					if (!_indexes[idx].grouped())
						index = _indexes[idx];
			}
			
			// obtain current rowId
			var rowId = null;
			if (before)
			{
				if (!index)
					throw "Can't find suitable index for fields: '" + jOrder.keys(before).join(",") + "'.";
				rowId = index.lookup([before])[0];
				before = _data[rowId];
			}
			
			// are we inserting?
			if (null == rowId)
			{
				if (!after)
					return;

				// insert new value
				rowId = _data.push(after) - 1;
			}
			else
			{
				// delete old
				delete _data[rowId];

				// add new at the same row id
				if (after)
					_data[rowId] = after;
			}

			// update indexes
			for (var idx in _indexes)
			{
				var index = _indexes[idx];
				if (before)
					index.remove(before, rowId);
				if (after)
					index.add(after, rowId);
			}
		}

		// inserts a row into the table, updates indexes
		// - rows: table rows to be inserted
		// - options: [indexName]
		function insert(rows, options)
		{
			for (var idx in rows)
				update(null, rows[idx], options);
		}

		// deletes row from table, updates indexes
		// - rows: table rows to delete
		// - options: [indexName]
		function remove(rows, options)
		{
			for (var idx in rows)
				update(rows[idx], null, options);
		}

		// deletes the tables contents
		function clear()
		{
			delete _data;
			_data = jOrder.copyTable(data);
			delete _indexes;
			_indexes = {};
		}

		// selects a set of rows using the specified row ids
		// - rowIds: specifies which rows to include in the result
		// - options:
		//	 - renumber: whether or not to preserve row ids
		function select(rowIds, options)
		{
			// default options
			if (!options)
				options = {};

			var result = [];

			if (options.renumber)
			{
				for (var idx in rowIds)
				{
					var rowId = rowIds[idx];
					result.push(_data[rowId]);
				}
				return result;
			}

			for (var idx in rowIds)
			{
				var rowId = rowIds[idx];
				result[rowId] = _data[rowId];
			}
			return result;
		}

		// returns the first row as json table from the table ftting the conditions
		// - conditions: list of field-value pairs defining the data we're looking for
		//	 (fields must be in the same exact order as in the index)
		// - options:
		//	 - indexName: index to use for search
		//	 - mode: jOrder.exact, jOrder.range, jOrder.startof (not unicode!)
		//	 - renumber: whether or not to preserve row ids
		//	 - offset: search offset
		//	 - limit: munber of rows to return starting from offset
		function where(conditions, options)
		{
			// default options
			if (!options)
				options = {};

			// obtain index
			var index = null;
			if (options.indexName)
			{
				// use specified index
				if (!(options.indexName in _indexes))
					throw "Invalid index name: '" + options.indexName + "'.";
				index = _indexes[options.indexName];
			}
			else
			{
				// look for a suitable index
				index = _index(conditions[0]);
			}

			// index found, return matching row by index
			var rowIds;
			if (index)
			{
				switch (options.mode)
				{
					default:
					case jOrder.exact:
						rowIds = index.lookup(conditions);
						break;
					case jOrder.range:
						rowIds = index.range(jOrder.values(conditions[0])[0], options);
						break;
					case jOrder.startof:
						var lower = jOrder.values(conditions[0])[0];
						rowIds = index.range({ lower: lower, upper: lower + 'z' }, options);
						break;
				}
				return select(rowIds, { renumber: options.renumber });
			}

			// no index found, search iteratively
			jOrder.warning("No matching index for fields: '" + jOrder.keys(conditions[0]).join(',') + "'.");
			
			// range search
			if (options.mode == jOrder.range)
				return filter(function(row)
				{
					var bounds = jOrder.values(conditions[0])[0];
					var field = jOrder.keys(conditions[0])[0];
					return bounds.lower <= row[field] && bounds.upper >= row[field];
				}, options);

			
			// start-of partial match
			if (options.mode == jOrder.startof)
				return filter(function(row)
				{
					0 == row[jOrder.keys(conditions[0])[0]].indexOf(jOrder.values(conditions[0])[0]);
				}, options);

			// exact match
			return filter(function(row)
			{
				var match = false;
				for (var idx in conditions)
				{
					var partial = true;
					for (var field in conditions[idx])
					{
						partial &= (conditions[idx][field] == row[field]);
						if (!partial)
							break;
					}
					match |= partial;
					if (match)
						break;
				}
				return match;
			}, options);

			return [];
		}

		// aggregates the table using a group index
		// - indexName: name of the group index
		// - initCallback: function that initializes the aggregated row
		// - iterateCallback: function performing one step of iteration
		function aggregate(indexName, initCallback, iterateCallback)
		{
			// check index
			if (!(indexName in _indexes))
				throw "Index '" + indexName + "' not found.";

			var index = _indexes[indexName];
			if (!index.grouped())
				throw "Can't aggregate using a non-group index! Signature: '" + index.signature() + "'.";

			jOrder.warning("jOrder.table.aggregate() iterates over the table (length: " + _data.length + ").");

			// cycling through groups according to index
			var groupIndex = index.flat();
			var grouped = [];
			for (var groupId in groupIndex)
			{
				// initializing aggregated row (seed)
				var group = groupIndex[groupId];
				var seed;
				for (var idx in group)
				{
					seed = _data[group[idx]];
					break;
				}
				var aggregated = initCallback(jOrder.copyTable([seed])[0]);

				// iterating through each row in group
				for (var idx in group)
					aggregated = iterateCallback(aggregated, _data[group[idx]]);

				// adding aggregated group to result
				grouped[groupId] = aggregated;
			}

			return grouped;
		}

		// sorts the contents of the table according to an index
		// - fields: array of field names to sort by
		// - direction: jOrder.asc or jOrder.desc
		// - options:
		//	 - indexName: name of the index to use for sorting
		//	 - compare: comparer callback (UNUSED)
		function orderby(fields, direction, options)
		{
			// default options
			if (!options)
				options = {};

			// obtain index
			var index = null;
			if (options.indexName)
			{
				// use specified index
				if (!(options.indexName in _indexes))
					throw "Invalid index name.";
				index = _indexes[options.indexName];
			}
			else
			{
				// look for a suitable index
				index = _index(jOrder.keys(fields, []));
			}
			if (jOrder.text == index.type())
				throw "Can't order by free-text index: '" + fields.join(',') + "'.";
			
			// assess sorting order
			var order = index.order(options);
			if (!order)
			{
				// sorting on the fly
				jOrder.warning("Index '" + options.indexName + "' is not ordered. Sorting index on the fly.");
				return jOrder.copyTable(_data).sort(function(a, b)
				{
					return a[fields[0]] > b[fields[0]] ? 1 : a[fields[0]] < b[fields[0]] ? -1 : 0;
				});
			}

			// gathers row ids, compacts index if necessary
			function rowIds()
			{
				function restart()
				{
					index.compact();
					order = index.order(options);
					delete result;
					return rowIds();
				}
				
				var result = [];
				if (jOrder.asc == direction)
				{
					for (var idx = 0; idx < order.length; idx++)
					{
						if (!(order[idx].rowId in _data))
							return restart();
						result.push(order[idx].rowId);
					}
					return result;
				}

				for (var idx = order.length - 1; idx >= 0; idx--)
				{
					if (!(order[idx].rowId in _data))
						return restart();
					result.push(order[idx].rowId);
				}
				return result;
			}
			
			// returning ordered rows
			return select(rowIds(), { renumber: true });
		}

		// filters table rows using the passed selector function
		// runs the selector on each row of the table
		// returns a json table; preserves row ids
		// - selector: function that takes the row (object) as argument and returns a bool
		// - options:
		// 	 - renumber: whether to preserve original row ids
		function filter(selector, options)
		{
			jOrder.warning("Performing linear search on table (length: " + _data.length + "). Consider using an index.");

			// default options
			if (!options)
				options = {};
			
			var result = [];
			
			if (options.renumber)
			{
				for (var idx in _data)
					if (selector(_data[idx]))
						result.push(_data[idx]);
				return result;
			}
			
			for (var idx in _data)
				if (selector(_data[idx]))
					result[idx] = _data[idx];
			return result;
		}

		// counts the lements in the table
		function count()
		{
			jOrder.warning("jOrder.table.count() iterates over the table (length: " + _data.length + ").");

			return jOrder.keys(_data).length;
		}

		// returns a copy of the flat contents of the table
		function flat()
		{
			return _data;
		}

		// get the first row from table
		function first()
		{
			for (idx in _data)
				return _data[idx];
		}

		// returns one column of the table as a flat array
		// - field: field name identifying the column
		// - options:
		//	 - renumber: whether or not it should preserve row ids
		function column(field, options)
		{
			// default options
			if (!options)
				options = {};

			var result = [];
			if (options.renumber)
			{
				for (var idx in _data)
					result.push(_data[idx][field]);
				return result;
			}
			for (var idx in _data)
				result[idx] = _data[idx][field];
			return result;
		}

		// tells whether there's an ordered index on the given fields
		function ordered(fields)
		{
			var index = _index(fields);
			if (!index)
				return false;
			return index.ordered();
		}

		// tells whether there's an ordered index on the given fields
		function grouped(fields)
		{
			var index = _index(fields);
			if (!index)
				return false;
			return index.grouped();
		}

		// helper functions

		// looks up an index according to the given fields
		// - row: sample row that's supposed to match the index
		function _index(row)
		{
			for (var idx in _indexes)
				if (_indexes[idx].signature(row))
					return _indexes[idx];
			return null;
		}
	}

	return jOrder;
})();

