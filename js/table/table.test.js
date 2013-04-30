////////////////////////////////////////////////////////////////////////////////
// Unit tests for jOrder table
////////////////////////////////////////////////////////////////////////////////
/*global console, jOrder, module, test, ok, equal, notEqual, notStrictEqual, deepEqual, raises */

jOrder.testing = function (testing, core, jOrder) {
	// table unit tests
	testing.table = function () {
		module("Table");
		
		test("Index operations", function () {
			// checkIndex
			notEqual(typeof testing.table77.indexes().get('total'), 'undefined', "Checking named index");
			equal(typeof testing.table77.indexes().get('foo'), 'undefined', "Checking invalid index");
			
			// findIndex
			notEqual(typeof testing.table77.indexes().find('total'), 'undefined', "Finding index by name");
			equal(testing.table77.indexes().find(null, {row: {'Total': 0, 'Currency': 0}}),
				testing.table77.indexes().find('signature'),
				"Finding index by fields");
			equal(testing.table77.indexes().find(null, {grouped: true}),
				testing.table77.indexes().find('group'),
				"Finding index by grouped state");

			// adding and looking up
			var table77 = jOrder.table(testing.json77);
			equal(typeof table77.index('test'), 'undefined', "There is no index on table by default");
			notEqual(typeof table77.index('test', ['ID']).index('test'), 'undefined', "Adding index to table");
			notStrictEqual(table77.index('test').flat(), table77.reindex().index('test').flat(), "Re-indexing table changes indexes");
			equal(typeof table77.clear().index('test'), 'undefined', 'Clearing table removes indexes');
		});
		
		test("Counting items", function () {
			equal(testing.table77.count(), 77, "Counting 77-row table");
			equal(testing.table77n.count(), 77, "Counting 77-row table (NO INDEX)");
		});
		
		test("Selecting rows by ID", function () {
			var tableX = jOrder.table(testing.jsonX);

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
		
		test("Sorting", function () {
			var tableX = jOrder.table(testing.jsonX)
				.index('author', ['author'], {ordered: true})
				.index('volumes', ['volumes'], {type: jOrder.number, grouped: true, ordered: true})
				.index('volumes_uo', ['volumes'], {type: jOrder.number, grouped: true})
				.index('title', ['title'], {type: jOrder.text, grouped: true});

			raises(function () {
				tableX.orderby(['title'], jOrder.asc);
			}, "Can't order by text field");
			
			deepEqual(tableX.orderby(['volumes'], jOrder.asc, {indexName: 'volumes'}), tableX.select([1, 2, 0], {renumber: true}),
				"By numeric field, ascending");
			deepEqual(tableX.orderby(['volumes'], jOrder.asc, {indexName: 'volumes_uo'}), tableX.select([1, 2, 0], {renumber: true}),
				"By string type field, ascending, UNORDERED index");
			deepEqual(tableX.orderby(['volumes'], jOrder.asc, {offset: 1}), tableX.select([2, 0], {renumber: true}),
				"By numeric field, ascending, OFFSET: 1");
			deepEqual(tableX.orderby(['volumes'], jOrder.desc), tableX.select([0, 2, 1], {renumber: true}),
				"By numeric field, descending");
			deepEqual(tableX.orderby(['author'], jOrder.asc), tableX.select([2, 1, 0], {renumber: true}),
				"By string type field, ascending");
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
			equal(core.keys(testing.table77.aggregate('total', null, sum)).length, 16,
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

