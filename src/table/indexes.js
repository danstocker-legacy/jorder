////////////////////////////////////////////////////////////////////////////////
// jOrder index collection for tables
////////////////////////////////////////////////////////////////////////////////
/*global jOrder */

jOrder.indexes = function (logging) {
	// index collection
	// - data: json table the table object is based on
	return function (json) {
		// member variables
		var indexes = {},
				count = 0,
		
		self = {
			// checks whether index exists and returns that index
			// - name: index name
			get: function (name) {
				if (!indexes.hasOwnProperty(name)) {
					logging.warn("Invalid index name: '" + name + "'");
					return false;
				}
				return indexes[name];
			},
					
			// looks up an index according to the given fields
			// - indexName: name of index to look up
			// - options:
			//   - row: sample row that's supposed to match the index
			//   - grouped: whether the index in question should be
			find: function (indexName, options) {
				options = options || {};
				
				// looking up by index
				if (indexName) {
					return self.get(indexName);
				}
				
				var name, index;
				for (name in indexes) {
					if (indexes.hasOwnProperty(name)) {
						index = indexes[name];
						if ((typeof options.row === 'undefined' || index.signature(options.row, true)) &&
							(typeof options.grouped === 'undefined' || index.grouped() === options.grouped)) {
							return index;
						}
					}
				}
				return null;
			},
		
			// calls a handler on each index
			// - handler: function to call on each index
			each: function (handler) {
				var i;
				for (i in indexes) {
					if (indexes.hasOwnProperty(i)) {
						handler(indexes[i]);
					}
				}
			},
			
			// creates or gets an index
			// - name: index name
			// - fields: array of strings representing table fields
			// - options: index options (groupability, sortability, type, etc.)
			index: function (name, fields, options) {
				// reindexing table on no args at all 
				if (!name) {
					self.rebuild();
				}
				// looking up index when only name arg is given
				if (!fields) {
					return indexes[name];
				}
				// adding index to table (and optionally removing previous)
				if (indexes.hasOwnProperty(name)) {
					logging.warn("Overwriting existing index '" + name + "'");
					delete indexes[name];
					count--;
				}
				indexes[name] = jOrder.index(json, fields, options);
				count++;
			},
	
			// rebuilds all indexes on table
			rebuild: function () {
				var name;
				for (name in indexes) {
					if (indexes.hasOwnProperty(name)) {
						indexes[name].rebuild();
					}
				}
			},
	
			// resets table to its original state
			// except for field changes within the original json
			clear: function () {
				indexes = {};
				count = 0;
			},
		
			count: function () {
				return count;
			},
			
			// tells whether there's an ordered index on the given combination of fields
			ordered: function (fields) {
				var index = self.find(null, {row: fields});
				if (!index) {
					return false;
				}
				return index.ordered();
			},
	
			// tells whether there's an ordered index on the given combination of fields
			grouped: function (fields) {
				var index = self.find(null, {row: fields});
				if (!index) {
					return false;
				}
				return index.grouped();
			}
		};
		
		return self;
	};
}(jOrder.logging);

