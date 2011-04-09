////////////////////////////////////////////////////////////////////////////////
// Unit tests for jOrder table
////////////////////////////////////////////////////////////////////////////////
/*global console, jOrder, module, test, ok, equal, notEqual */

jOrder.testing = function (testing, jOrder) {
	// table unit tests
	testing.table = function () {
		module("Table");
		
		test("Index operations", function () {
			var table = jOrder.table(testing.json77);
			
			equal(typeof table.index('test'), 'undefined', "There is no index on table by default");
			notEqual(typeof table.index('test', ['ID']).index('test'), 'undefined', "Adding index to table");
			notEqual(table.index('test').flat(), table.reindex().index('test').flat(), "Re-indexing table changes indexes");
			equal(typeof table.clear().index('test'), 'undefined', 'Clearing table removes indexes');
		});
	}();
	
	return testing;
}(jOrder.testing,
	jOrder);

