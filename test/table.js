////////////////////////////////////////////////////////////////////////////////
// Unit tests for jOrder table
////////////////////////////////////////////////////////////////////////////////
/*global console, jOrder, module, test, ok, equal, notEqual, deepEqual */

jOrder.testing = function (testing, jOrder) {
	// table unit tests
	testing.table = function () {
		module("Table");
		
		var table77 = jOrder.table(testing.json77),
				tableX = jOrder.table(testing.jsonX);

		test("Index operations", function () {
			// checkIndex
			notEqual(typeof testing.table77.checkIndex('total'), 'undefined', "Checking named index");
			equal(testing.table77.checkIndex('foo'), false, "Checking invalid index");
			
			// findIndex
			notEqual(typeof testing.table77.findIndex('total'), 'undefined', "Finding index by name");
			equal(testing.table77.findIndex(null, {row: {'Total': 0, 'Currency': 0}}),
				testing.table77.findIndex('signature'),
				"Finding index by fields");
			equal(testing.table77.findIndex(null, {grouped: true}),
				testing.table77.findIndex('group'),
				"Finding index by grouped state");

			// adding and looking up
			equal(typeof table77.index('test'), 'undefined', "There is no index on table by default");
			notEqual(typeof table77.index('test', ['ID']).index('test'), 'undefined', "Adding index to table");
			notEqual(table77.index('test').flat(), table77.reindex().index('test').flat(), "Re-indexing table changes indexes");
			equal(typeof table77.clear().index('test'), 'undefined', 'Clearing table removes indexes');
		});
		
		test("Selecting rows by ID", function () {
			// with renumber
			deepEqual(tableX.select([0, 2], {renumber: true}), [{
				'title': 'Lord of the rings',
				'data': [5, 6, 43, 21, 88],
				'author': 'Tolkien',
				'volumes': 3
			}, {
				'title': 'Prelude to Foundation',
				'data': [99, 1],
				'author': 'Asimov',
				'volumes': 1
			}], "Renumbering row IDs");
			
			// without renumber
			deepEqual(tableX.select([0, 2], {renumber: false}), [{
				'title': 'Lord of the rings',
				'data': [5, 6, 43, 21, 88],
				'author': 'Tolkien',
				'volumes': 3
			},
			undefined,
			{
				'title': 'Prelude to Foundation',
				'data': [99, 1],
				'author': 'Asimov',
				'volumes': 1
			}], "Leaving original row IDs");
		});
		
		test("Updating table", function () {
			var count = testing.table77.index('id').count();
			testing.table77.remove([{'ID': 5}]);
			equal(testing.table77.index('id').count(), count - 1, "Removing an item decreases table size by 1");
			equal(testing.table77.insert([{
				"ID": 5,
				"Currency": "USD",
				"Total": 0,
				"StartDate": "4\/8\/2010",
				"GroupID": 1
			}]).index('id').count(), count, "Adding an item increases table size by 1");
		});
	}();
	
	return testing;
}(jOrder.testing,
	jOrder);

