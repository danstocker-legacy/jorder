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
		// default options
		options = options || {};
		options.type = options.type || constants.string;
		
		// private values
		var lookup = jOrder.lookup(json, fields, options),
				order = options.ordered ? jOrder.order(json, fields, options) : null,
				
		self = {
			// sets a lookup value for a given data row
			// - row: data row that serves as basis for the index key
			// - rowId: index of the row in the original (flat) table
			// - lazy: lazy sorting - only consistent on all items added
			add: function (row, rowId, lazy) {
				// obtaining keys associated with the row
				var keys = self.keys(row);
				if (!keys.length) {
					throw "Can't add row to index. No field matches signature '" + self.signature() + "'";
				}

				// adding entry to lookup index
				lookup.add(keys, rowId);
				
				// adding entry to order
				if (order) {
					order.add(keys, rowId, lazy);
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

				// removing entry from lookup ondex
				lookup.remove(keys, rowId);
				
				// removing entry from order
				if (order) {
					order.remove(keys, rowId);
				}
				
				return self;
			},
	
			// clears index
			unbuild: function () {
				lookup.clear();
				if (order) {
					order.clear();
				}
				
				return self;
			},
			
			// rebuilds index based on original json and options
			// - lazy: lazy sorting - only consistent on all items added
			rebuild: function (lazy) {
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
					self.add(row, i, lazy);
				}
				
				if (order && lazy) {
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
				return order !== null;
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
			'count': true,
			'signature': true,
			'keys': true
		});
		if (order) {
			core.delegate(order, self, {
				'reorder': true,
				'compact': true,
				'bsearch': true,
				'range': true,
				'order': true
			});
		}
		
		// building index (w/ opting out)
		if (options.build !== false) {
			self.rebuild(true);
		}
		
		return self;
	};
}(jOrder.core,
	jOrder.constants,
	jOrder.logging);
