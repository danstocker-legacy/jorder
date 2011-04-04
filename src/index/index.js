////////////////////////////////////////////////////////////////////////////////
// jOrder index object
////////////////////////////////////////////////////////////////////////////////
/*global jOrder, escape */

// generates a lookup index on the specified table for the given set of fields
// - json: array of uniform objects
// - fields: array of strings representing table fields
// - options: grouped, sorted, data type
//	 - grouped: bool
//	 - ordered: bool
//	 - type: jOrder.string, jOrder.number, jOrder.text, jOrder.array
//	 - build: bool
jOrder.index = function (core, constants, logging) {
	return function (json, fields, options) {
		options = options || {};
		
		// private values
		var lookup = jOrder.lookup(json, fields, options),
				order = options.ordered ? jOrder.order(json, fields, options) : {},
				
		self = {
			// sets a lookup value for a given data row
			// - row: data row that serves as basis for the index key
			// - rowId: index of the row in the original (flat) table
			// - reorder: whether to re-calcuate order after addition
			add: function (row, rowId, reorder) {
				// obtaining keys associated with the row
				var keys = self.keys(row);
				if (!keys.length) {
					throw "Can't add row to index. No field matches signature '" + self.signature() + "'";
				}

				// adding entry to lookup index
				lookup.add(keys, rowId);
				
				// adding entry to order
				if (options.ordered) {
					order.add(keys, row, rowId, reorder);
				}
				
				return self;
			},
	
			// removes a key from the index
			// - row: row to delete
			// - rowId: id of row to delete
			remove: function (row, rowId) {
				// obtaining keys associated with the row
				var keys = self.keys(row);
				if (!keys.length) {
					throw "Can't remove row from index. No field matches signature '" + self.signature() + "'";
				}

				lookup.remove(keys, rowId);
				
				return self;
			},
	
			// clears index
			unbuild: function () {
				lookup.clear();
				if (options.ordered) {
					order.clear();
				}
				
				return self;
			},
			
			// rebuilds index based on original json and options
			rebuild: function () {
				// clearing index
				self.unbuild();
				
				// generating index
				logging.log("Building index of length: " + json.length + ", signature '" + lookup.signature() + "'.");
				var i, row;
				for (i = 0; i < json.length; i++) {
					// skipping 'holes' in array
					if (!(row = json[i])) {
						continue;
					}
					self.add(row, i, false);
				}

				// generating order for ordered index				
				if (options.ordered) {
					order.reorder();
				}
				
				return self;
			},
	
			// tells whether the index id grouped
			grouped: function () {
				return options.grouped;
			},
	
			// tells whether the index is ordered
			ordered: function () {
				return options.ordered;
			},
	
			// returns index type
			type: function () {
				return options.type;
			}
		};
	
		// delegating methods from lookup and order
		// NOTE: delegated methods MUST NOT return reference to self!
		core.delegate(lookup, self, {
			'lookup': true,
			'flat': true,
			'signature': true,
			'keys': true
		});
		if (options.ordered) {
			core.delegate(order, self, {
				'compact': true,
				'bsearch': true,
				'range': true,
				'order': true
			});
		}
		
		// building index (w/ opting out)
		if (options.build !== false) {
			self.rebuild();
		}
		
		return self;
	};
}(jOrder.core,
	jOrder.constants,
	jOrder.logging);
