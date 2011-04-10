////////////////////////////////////////////////////////////////////////////////
// Unit tests for jOrder table
////////////////////////////////////////////////////////////////////////////////
/*global console, jOrder, module, test, ok, equal, notEqual, deepEqual, raises */

jOrder.testing = function (testing, core, jOrder) {
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
		
		test("Counting items", function () {
			equal(testing.table77.count(), 77, "Counting 77-row table");
			equal(testing.table77n.count(), 77, "Counting 77-row table (NO INDEX)");
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
		
		test("Search", function () {
			// exact search on grouped field, results packed
			equal(testing.table77.where([{'Total': 4}], {renumber: true}).length, 10, "Counting rows where Total = 4");
			equal(testing.table77n.where([{'Total': 4}], {renumber: true}).length, 10, "Counting rows where Total = 4 (NO INDEX)");
			
			// eaxact search on grouped field, non-packed
			equal(testing.table77.where([{'Total': 4}]).length, 76, "Index of last row where Total = 4");
			equal(testing.table77n.where([{'Total': 4}]).length, 76, "Index of last row where Total = 4 (NO INDEX)");

			var expected = [{
				"ID": 76,
				"Currency": "USD",
				"EndDate": "10\/24\/2010",
				"EndDateUtc": 129323520000000000,
				"Total": 4,
				"Amount": 0,
				"Product": 2,
				"StartDate": "3\/23\/2010",
				"StartDateUtc": 129138213600000000,
				"Status": 1,
				"StatusStr": "Active",
				"GroupID": 185
			}];
			
			// exact search on unique field, packed
			deepEqual(testing.table77.where([{'ID': 76}], {renumber: true}), expected, "Where ID = 76");
			deepEqual(testing.table77n.where([{'ID': 76}], {renumber: true}), expected, "Where ID = 76 (NO INDEX)");

			// exact search on composite index, packed
			equal(testing.table77.where([{'Total': 5, 'Currency': 'USD'}], {renumber: true, indexName: 'signature'})[0].ID, 11,
				"First suitable row by composite index (Total:5, Currency:USD)");
			equal(testing.table77n.where([{'Total': 5, 'Currency': 'USD'}], {renumber: true})[0].ID, 11,
				"First suitable row by composite index (Total:5, Currency:USD, NO INDEX)");
			
			// range search
			equal(testing.table77.where([{'ID': {lower: 10, upper: 13}}], {renumber: true, mode: jOrder.range}).length, 3,
				"Range search on unique field");
			equal(testing.table77n.where([{'ID': {lower: 10, upper: 13}}], {renumber: true, mode: jOrder.range}).length, 3,
				"Range search on unique field (NO INDEX)");
			
			// text range search
			equal(testing.table1000.where([{'name': 'Using'}], {renumber: true, mode: jOrder.startof}).length, 12,
				"Start of text search on text field");
			equal(testing.table1000n.where([{'name': 'Using'}], {renumber: true, mode: jOrder.startof}).length, 12,
				"Start of text search on text field (NO INDEX)");
		});
		
		test("Aggregation", function () {
			// iteration callback for summing
			function sum(aggregated, next) {
				aggregated.Amount += next.Amount;
				return aggregated;
			}
				
			raises(function () {
				testing.table77.aggregate('id', null, sum);
			}, "Aggregating without grouped index raises exception");
			deepEqual(core.keys(testing.table77.aggregate('total', null, sum)),
				['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '12', '13', '15', '16', '20'],
				"Aggregation preserves the index's keys");
			
			function concat(aggregated, next) {
				aggregated.author += next.author;
				return aggregated;
			}
			
			var tableX = jOrder.table(testing.jsonX)
				.index('volumes', ['volumes'], {grouped: true, type: jOrder.number});
			
			deepEqual(tableX.aggregate('volumes', null, concat), {
				1: {
					'title': 'Winnie the Pooh',
					'data': [1, 2, 34, 5],
					'author': 'MilneAsimov',
					'volumes': 1
				},
				3: {
					'title': 'Lord of the rings',
					'data': [5, 6, 43, 21, 88],
					'author': 'Tolkien',
					'volumes': 3
				}
			}, "Group concatenating string field WITHOUT initialization");
			deepEqual(tableX.aggregate('volumes', function () {
				return {
					author: ''
				};
			}, concat), {
				1: {author: 'MilneAsimov'},
				3: {author: 'Tolkien'}
			}, "Group concatenating string field WITH initialization");
		});
		
		test("Updating table", function () {
			// count checks
			var count = testing.table77.count();
			testing.table77.remove([{'ID': 5}]);
			equal(testing.table77.count(), count - 1, "Removing an item decreases table size by 1");
			equal(testing.table77.insert([{
				"ID": 5,
				"Currency": "USD",
				"Total": 0,
				"StartDate": "4\/8\/2010",
				"GroupID": 1
			}]).count(), count, "Adding an item increases table size by 1");
		});
	}();
	
	return testing;
}(jOrder.testing,
	jOrder.core,
	jOrder);

