////////////////////////////////////////////////////////////////////////////////
// jOrder index collection for tables
////////////////////////////////////////////////////////////////////////////////
/*global jOrder */

jOrder.indexes = function ($collection, $index) {
	// index collection
	// - data: json table the table object is based on
	return function (json) {
		// member variables
		var self = Object.create($collection()),
				base_add = self.add,
				indexes = {},
				count = 0;
		
		// adds an index to the collection
		self.add = function (name, fields, options) {
			// calling add() of base
			base_add(name, $index(json, fields, options));
		};

		// looks up an index according to the given fields
		// - indexName: name of index to look up
		// - options:
		//   - row: sample row that's supposed to match the index
		//   - grouped: whether the index in question should be
		self.find = function (indexName, options) {
			options = options || {};
			
			// looking up by index
			if (indexName) {
				return self.get(indexName);
			}
			
			var index;
			self.each(function (key, item) {
				if ((typeof options.row === 'undefined' || item.signature(options.row, true)) &&
					(typeof options.grouped === 'undefined' || item.grouped() === options.grouped)) {
					index = item;
					return true;
				}
			});
			return index;
		};
	
		// rebuilds all indexes on table
		self.rebuild = function () {
			self.each(function (name, index) {
				index.rebuild();
			});
		};

		// tells whether there's an ordered index on the given combination of fields
		self.ordered = function (fields) {
			var index = self.find(null, {row: fields});
			if (!index) {
				return false;
			}
			return index.ordered();
		};

		// tells whether there's an ordered index on the given combination of fields
		self.grouped = function (fields) {
			var index = self.find(null, {row: fields});
			if (!index) {
				return false;
			}
			return index.grouped();
		};
		
		return self;
	};
}(jOrder.collection,
	jOrder.index);

