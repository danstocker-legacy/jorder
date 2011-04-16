////////////////////////////////////////////////////////////////////////////////
// jOrder performance tests
////////////////////////////////////////////////////////////////////////////////
/*global jQuery, jOrder, jOB */

// registering benchmarks on document ready
(function ($, jOrder, jOB) {
	$(function () {
		// Exact search on 77 rows
		jOB.benchmark("Searching for exact matches ('GroupID' being either 107 or 185)");
		jOB.test("jOrder.table.where()", function () {
			return jOrder.testing.table77.where([{ 'GroupID': 107 }, { 'GroupID': 185 }], { renumber: true });
		});
		jOB.test("Row by row iteration", function () {
			return jOrder.testing.table77n.filter(function (row) {
				return row.GroupID === 107 || row.GroupID === 185;
			}, {renumber: true});
		}, { isreference: true });
	
		// Exact search on composite index search
		jOB.benchmark("Searching for exact matches (where 'Total' = 8 and 'Currency' = 'USD')");
		jOB.test("jOrder.table.where()", function () {
			return jOrder.testing.table77.where([{ 'Currency': 'USD', 'Total': 8 }], { renumber: true });
		});
		jOB.test("Row by row iteration", function () {
			return jOrder.testing.table77n.filter(function (row) {
				return row.Currency === 'USD' && row.Total === 8;
			}, {renumber: true});
		}, { isreference: true });
	
		// Exact search on 1000 rows
		jOB.benchmark("Searching for exact matches ('id' being either 107 or 115)");
		jOB.test("jOrder.table.where()", function () {
			return jOrder.testing.table1000.where([{ 'id': 107 }, { 'id': 115 }], {renumber: true});
		});
		jOB.test("Row by row iteration", function () {
			return jOrder.testing.table1000n.filter(function (row) {
				return row.id === 107 || row.id === 115;
			}, {renumber: true});
		}, { isreference: true });
	
		// Range search on 77 rows
		jOB.benchmark("Range search ('Total' between 11 and 15)");	
		jOB.test("jOrder.table.where()", function () {
			return jOrder.testing.table77.where([{ 'Total': { lower: 11, upper: 15 } }], { mode: jOrder.range, renumber: true });
		});
		jOB.test("Row by row iteration", function () {
			return jOrder.testing.table77n.filter(function (row) {
				return row.Total >= 11 && row.Total <= 15;
			}, {renumber: true});
		}, { isreference: true });
		
		// Range search on 1000 rows
		jOB.benchmark("Range search ('id' between 203 and 315)");
		jOB.test("jOrder.table.where()", function () {
			return jOrder.testing.table1000.where([{ 'id': { lower: 203, upper: 315 } }], { mode: jOrder.range, renumber: true, limit: 1000 });
		});
		jOB.test("Row by row iteration", function () {
			return jOrder.testing.table1000n.filter(function (row) {
				return row.id >= 203 && row.id <= 315;
			}, {renumber: true});
		}, { isreference: true });
	
		// Range search on 1000 rows with limit
		jOB.benchmark("Range search with page result ('id' between 203 and 315; hits #20 to #40)");
		jOB.test("jOrder.table.where()", function () {
			return jOrder.testing.table1000.where([{ 'id': { lower: 203, upper: 315 } }], {
				mode: jOrder.range,
				renumber: true,
				offset: 20,
				limit: 20
			}, {renumber: true});
		});
	
		// Freetext search on 1000 rows
		jOB.benchmark("Free text search (rows with 'name' field starting with \"con\")");
		jOB.test("jOrder.table.where()", function () {
			return jOrder.testing.table1000.where([{ 'name': 'con' }], { mode: jOrder.startof, indexName: 'fulltext', limit: 1000, renumber: true });
		});
		jOB.test("Row by row iteration", function () {
			return jOrder.testing.table1000n.filter(function (row) {
				return null !== row.name.match(/\bcon/i);
			}, {renumber: true});
		}, { isreference: true });
		
		// Sorting on 77 rows
		jOB.benchmark("Sorting by 'ID'");
		jOB.test("jOrder.table.orderby()", function () {
			return jOrder.testing.table77.orderby(['ID'], jOrder.asc, { indexName: 'id' });
		});
		jOB.test("Row by row iteration", function () {
			return jOrder.shallow(jOrder.testing.table77.flat()).sort(function (a, b) {
				return a.ID > b.ID ? 1 : a.ID < b.ID ? -1 : 0;
			});
		}, { isreference: true });
		
		// Sorting on 1000 rows
		jOB.benchmark("Sorting by 'name'");
		jOB.test("jOrder.table.orderby()", function () {
			return jOrder.testing.table1000.orderby(['name'], jOrder.asc, { indexName: 'name' });
		}, { lengthonly: true });	
		jOB.test("Row by row iteration", function () {
			return jOrder.shallow(jOrder.testing.table1000.flat()).sort(function (a, b) {
				return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
			});
		}, { isreference: true, lengthonly: true });
	
		// Sorting on 1000 rows, limited
		jOB.benchmark("Sorting by 'name' (first 20 hits)");
		jOB.test("jOrder.table.orderby()", function () {
			return jOrder.testing.table1000.orderby(['name'], jOrder.asc, { indexName: 'name', offset: 0, limit: 20 });
		});	
		
		// Grouping
		jOB.benchmark("Grouping by 'GroupID'");
		jOB.test("Summing on field 'Total'", function () {
			function iterate(aggregated, next) {
				aggregated.Total += next.Total;
				return aggregated;
			}
			var summed,
					i;
			for (i = 0; i < jOB.count; i++) {
				summed = jOrder.values(jOrder.testing.table77.aggregate('group', null, iterate));
			}
			return summed;
		});
		
		jOrder.logging = false;
	
		jOB.start();
	});
}(jQuery,
	jOrder,
	jOB));

