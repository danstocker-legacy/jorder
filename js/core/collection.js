////////////////////////////////////////////////////////////////////////////////
// Collection
////////////////////////////////////////////////////////////////////////////////
/*global jOrder */

jOrder.collection = function ($logging) {
	return function () {
		var items = {},
				count = 0,
		
		self = {
			// adds an item to the collection
			// - name: identifies item
			// - item: to be added
			add: function (name, item) {
				// adding item to collection (and optionally removing previous)
				if (items.hasOwnProperty(name)) {
					$logging.warn("Overwriting existing item '" + name + "'");
					delete items[name];
					count--;
				}
				items[name] = item;
				count++;
				return this;
			},
			
			// returns an item from teh collection
			// - name: identifies the item to return
			get: function (name) {
				if (!items.hasOwnProperty(name)) {
					$logging.warn("Invalid item name: '" + name + "'");
					return;
				}
				return items[name];
			},
			
			// clears collection
			clear: function () {
				items = {};
				count = 0;
				return this;
			},
			
			// calls a handler on each item
			// - handler: to be called on each item
			each: function (handler) {
				var i;
				for (i in items) {
					// calling handler and terminating if return value is true
					if (items.hasOwnProperty(i) && handler(i, items[i]) === true) {
						return this;
					}
				}
				return this;
			},
			
			// returns the number of items in the collection
			count: function () {
				return count;
			}
		};
		
		return self;
	};
}(jOrder.logging);

